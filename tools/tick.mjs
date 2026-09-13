#!/usr/bin/env node
// The day tick — memoryOS's heartbeat.
//
// Run once a day (see .github/workflows/tick.yml). It reads world/state.json,
// advances the world by one day, and writes it back. Everything it does is
// arithmetic: no model, no network, no judgement. Judgement happens in the
// season tick, which is a human or an LLM opening a pull request.
//
// Zero dependencies, same as the rest of the repo (see CLAUDE.md — this
// machine's Application Control policy blocks native Node addons, so nothing
// here may need `npm install`).
//
//   node tools/tick.mjs --init        write a fresh day-0 world
//   node tools/tick.mjs               advance one day
//   node tools/tick.mjs --days 7      advance seven
//   node tools/tick.mjs --no-git      advance without harvesting commits
//
// Determinism is a feature: the same state + the same day + the same commits
// always produce the same next state, so a strange morning can be replayed.

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATE_PATH = join(ROOT, 'world', 'state.json');
const CHRONICLE_PATH = join(ROOT, 'world', 'chronicle.md');

export const STATE_VERSION = 1;

// ---------------------------------------------------------------- randomness

// Seeded PRNG. The seed is (world seed, day), so every day of the world can be
// recomputed from scratch and a bug is never a one-off.
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------- economy

// What a commit is made of. His work on the palace is the village's quarry:
// geometry becomes stone, writing becomes timber, code becomes glass. A house
// cannot be finished out of nothing, which is the whole anti-slop mechanism —
// the world can only grow as fast as he actually works.
const MATERIALS = ['stone', 'timber', 'glass'];

function materialFor(files) {
  if (files.some((f) => f.startsWith('models/') || f.includes('blender'))) return 'stone';
  if (files.some((f) => f.startsWith('docs/') || f.endsWith('.md'))) return 'timber';
  if (files.some((f) => f.startsWith('src/') || f.startsWith('scripts/') || f.startsWith('tools/')))
    return 'glass';
  return 'stone';
}

// What a plot needs at each point of its build. Read together with stageOf()
// below — the same thresholds drive what the viewer draws.
function needAt(progress) {
  if (progress < 0.35) return 'timber'; // stakes, the frame
  if (progress < 0.85) return 'stone'; // the walls
  return 'glass'; // the fitting out
}

// Keep in sync with stageOf() in src/world/stages.js — the tick decides, the
// viewer draws, and they must agree on what 0.4 looks like.
export function stageOf(plot) {
  if (plot.progress >= 1) return 'dedicated';
  if (plot.progress <= 0) return plot.active ? 'yard' : 'bare';
  if (plot.progress < 0.35) return 'yard';
  if (plot.progress < 0.85) return 'scaffold';
  return 'fitting';
}

const MAX_INTAKE_PER_DAY = 8; // a 40-commit push is a week of stone, not a flood
const HAUL_PER_DAY = 3; // what one carter can carry up the hill
const LAY_PER_DAY = 2; // what one mason can lay
const PROGRESS_PER_UNIT = 0.125;
const WEAR_PER_DAY = 0.02;
const WALK_PER_DAY = 16; // world units of z covered in a day

// --------------------------------------------------------------- world seeds

function freshState() {
  const plots = [];
  for (let i = 1; i <= 12; i += 1) {
    plots.push({
      id: i,
      progress: 0,
      active: false,
      wear: 0,
      inscription: null,
      blocks: [], // every commit that went into this house, in the order laid
      dedicatedOn: null,
    });
  }
  return {
    version: STATE_VERSION,
    day: 0,
    seed: 20260913,
    updated: new Date().toISOString(),
    lastCommit: null,
    chronicle: [],
    scenes: {
      'wisdom-village': {
        // Where the inhabitants are is stored as a position along the stair
        // (z in three.js space). The viewer turns z into a point on the ground
        // by raycasting the hill, so the tick never has to know the terrain.
        gateZ: 45,
        plots,
        // One commit is one block. The gate yard is where they land, the site
        // is what has been carried up, and a finished house keeps the list of
        // the blocks it was built from — so a wall can be read back to the work
        // that paid for it.
        yard: { blocks: [] },
        site: { blocks: [] },
        inhabitants: [
          mkPerson('quy', 'Quy', 'mason', 34),
          mkPerson('hien', 'Hien', 'carter', 45),
          mkPerson('lam', 'Lam', 'lamplighter', 22),
          mkPerson('thu', 'Thu', 'chronicler', 8),
        ],
      },
    },
  };
}

function mkPerson(id, name, role, z) {
  return { id, name, role, z, targetZ: z, carrying: null, journal: [] };
}

// Where each plot sits along the stair. Mirrors the locus positions in
// src/scenes/wisdom-village.js; the viewer is the authority on exact placement,
// the tick only needs the ordering along z.
const PLOT_Z = {
  1: 34, 2: 34, 3: 22, 4: 22, 5: 8, 6: 8,
  7: -4, 8: -4, 9: -15.5, 10: -15.5, 11: -26.5, 12: -26.5,
};

// ----------------------------------------------------------------- the tick

function harvest(state, useGit) {
  if (!useGit) return [];
  let range;
  try {
    if (state.lastCommit) {
      execSync(`git cat-file -e ${state.lastCommit}^{commit}`, { cwd: ROOT, stdio: 'ignore' });
      range = `${state.lastCommit}..HEAD`;
    } else {
      range = '--max-count=12 HEAD';
    }
    const out = execSync(`git log --reverse --format=%H%x1f%s ${range}`, {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    if (!out) return [];
    const blocks = [];
    for (const line of out.split('\n')) {
      const [sha, subject] = line.split('');
      if (!sha) continue;
      let files = [];
      try {
        files = execSync(`git show --name-only --format= ${sha}`, { cwd: ROOT, encoding: 'utf8' })
          .trim()
          .split('\n')
          .filter(Boolean);
      } catch {
        /* a merge or a graft; material falls back to stone */
      }
      // The world does not quarry itself: a commit the tick made is not ore.
      if (files.length && files.every((f) => f.startsWith('world/'))) continue;
      blocks.push({
        sha: sha.slice(0, 7),
        text: (subject || '').slice(0, 90),
        material: materialFor(files),
      });
      state.lastCommit = sha;
    }
    return blocks.slice(0, MAX_INTAKE_PER_DAY);
  } catch (err) {
    console.warn('tick: no git history to harvest (' + err.message.split('\n')[0] + ')');
    return [];
  }
}

function note(person, day, text) {
  person.journal.push(`d${day} · ${text}`);
  if (person.journal.length > 10) person.journal.shift();
}

function walk(person, targetZ) {
  person.targetZ = targetZ;
  const d = targetZ - person.z;
  if (Math.abs(d) <= WALK_PER_DAY) person.z = targetZ;
  else person.z += Math.sign(d) * WALK_PER_DAY;
  return person.z === targetZ;
}

function tickOnce(state, { useGit = true } = {}) {
  const day = state.day + 1;
  const rand = mulberry32((state.seed ^ (day * 0x9e3779b1)) >>> 0);
  const v = state.scenes['wisdom-village'];
  const events = [];
  const by = (role) => v.inhabitants.find((p) => p.role === role);

  // 1 — intake. The real world arrives at the gate as material.
  const blocks = harvest(state, useGit);
  for (const b of blocks) v.yard.blocks.push({ ...b, day });
  if (blocks.length) {
    events.push(
      `${blocks.length} block${blocks.length > 1 ? 's' : ''} arrived at the gate: ` +
        blocks.map((b) => `“${b.text}”`).slice(0, 3).join(', ') +
        (blocks.length > 3 ? ' and more' : ''),
    );
  }

  // 2 — open a plot when there is anything to build with.
  let active = v.plots.find((p) => p.active);
  const stock = v.yard.blocks.length + v.site.blocks.length;
  if (!active && stock > 0) {
    active = v.plots.find((p) => p.progress < 1);
    if (active) {
      active.active = true;
      events.push(`Plot ${String(active.id).padStart(2, '0')} was staked out.`);
    }
  }

  // 3 — the carter hauls from the gate yard up to the site.
  const carter = by('carter');
  if (active) {
    const plotZ = PLOT_Z[active.id];
    if (carter.carrying) {
      if (walk(carter, plotZ)) {
        v.site.blocks.push(...carter.carrying);
        note(carter, day, `set down ${carter.carrying.length} at Plot ${active.id}`);
        carter.carrying = null;
      } else {
        note(carter, day, `hauling ${carter.carrying.length} ${carter.carrying[0].material} up the stair`);
      }
    } else if (walk(carter, v.gateZ)) {
      const want = needAt(active.progress);
      // Take what the mason needs first, then whatever else is lying about.
      const order = [...v.yard.blocks].sort(
        (a, b) => (b.material === want) - (a.material === want),
      );
      const take = order.slice(0, HAUL_PER_DAY);
      if (take.length) {
        v.yard.blocks = v.yard.blocks.filter((b) => !take.includes(b));
        carter.carrying = take;
        note(carter, day, `loaded ${take.length} ${take[0].material} at the gate`);
      } else {
        note(carter, day, 'the yard is empty; waited at the gate');
      }
    } else {
      note(carter, day, 'walking back down to the gate');
    }
  } else {
    walk(carter, v.gateZ);
    note(carter, day, 'nothing to haul');
  }

  // 4 — the mason lays what has reached the site.
  const mason = by('mason');
  if (active) {
    const plotZ = PLOT_Z[active.id];
    if (!walk(mason, plotZ)) {
      note(mason, day, `walking to Plot ${active.id}`);
    } else {
      let laid = 0;
      let improvised = false;
      for (let i = 0; i < LAY_PER_DAY && active.progress < 1; i += 1) {
        const want = needAt(active.progress);
        // The right material at full speed; anything else at half. A village
        // that stops dead because the glass has not arrived is realistic and
        // unbearable — this way the work always creeps on, just badly.
        let idx = v.site.blocks.findIndex((b) => b.material === want);
        if (idx < 0) idx = v.site.blocks.length ? 0 : -1;
        if (idx < 0) break;
        const [block] = v.site.blocks.splice(idx, 1);
        active.blocks.push(block);
        if (block.material !== want) improvised = true;
        const step = block.material === want ? PROGRESS_PER_UNIT : PROGRESS_PER_UNIT / 2;
        active.progress = Math.min(1, +(active.progress + step).toFixed(3));
        laid += 1;
      }
      if (laid) {
        note(
          mason,
          day,
          `laid ${laid} at Plot ${active.id} (${Math.round(active.progress * 100)}%)` +
            (improvised ? `, making do without ${needAt(active.progress)}` : ''),
        );
      } else {
        note(mason, day, 'nothing on site; stood idle');
      }

      if (active.progress >= 1) {
        // The house is inscribed with its foundation stone — the first commit
        // laid into it — and keeps the rest as its provenance.
        active.inscription = active.blocks.length ? active.blocks[0].text : 'Unrecorded';
        active.dedicatedOn = day;
        active.active = false;
        active.wear = 0;
        events.push(
          `Plot ${String(active.id).padStart(2, '0')} was dedicated, inscribed “${active.inscription}”.`,
        );
        note(mason, day, `finished Plot ${active.id}`);
      }
    }
  } else {
    note(mason, day, 'no plot open; sharpened tools');
  }

  // 5 — weather. Everything finished starts going quietly wrong.
  const dedicated = v.plots.filter((p) => p.dedicatedOn !== null);
  for (const p of dedicated) p.wear = Math.min(1, +(p.wear + WEAR_PER_DAY).toFixed(3));

  // 6 — the lamplighter pushes back against it.
  const lamp = by('lamplighter');
  if (dedicated.length) {
    const worst = dedicated.slice().sort((a, b) => b.wear - a.wear)[0];
    if (walk(lamp, PLOT_Z[worst.id])) {
      worst.wear = Math.max(0, +(worst.wear - 0.15).toFixed(3));
      note(lamp, day, `trimmed the lamp at Plot ${worst.id}`);
    } else {
      note(lamp, day, `climbing to Plot ${worst.id}`);
    }
  } else {
    const wander = [45, 34, 22, 8, -4][Math.floor(rand() * 5)];
    walk(lamp, wander);
    note(lamp, day, 'walked the empty stair');
  }

  // 7 — the chronicler writes the day down. This is the part that makes a
  // world that changed while you were away legible instead of confusing.
  const scribe = by('chronicler');
  if (events.length) {
    walk(scribe, active ? PLOT_Z[active.id] : v.gateZ);
    note(scribe, day, events[0].slice(0, 70));
  } else {
    note(scribe, day, 'nothing worth the ink');
  }

  for (const text of events) state.chronicle.push({ day, scene: 'wisdom-village', text });
  if (state.chronicle.length > 80) state.chronicle = state.chronicle.slice(-80);

  state.day = day;
  state.updated = new Date().toISOString();
  return events;
}

// ---------------------------------------------------------------------- main

function main() {
  const args = process.argv.slice(2);
  const useGit = !args.includes('--no-git');
  const daysIdx = args.indexOf('--days');
  const days = daysIdx >= 0 ? parseInt(args[daysIdx + 1], 10) || 1 : 1;

  mkdirSync(join(ROOT, 'world'), { recursive: true });

  if (args.includes('--init') || !existsSync(STATE_PATH)) {
    const state = freshState();
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
    if (!existsSync(CHRONICLE_PATH)) {
      writeFileSync(
        CHRONICLE_PATH,
        '# The Chronicle\n\nWritten by `tools/tick.mjs`, one line per thing that happened.\nNobody edits this by hand; the world says what it did.\n\n',
      );
    }
    console.log('tick: wrote a fresh day-0 world');
    if (args.includes('--init')) return;
  }

  const state = JSON.parse(readFileSync(STATE_PATH, 'utf8'));
  if (state.version !== STATE_VERSION) {
    console.error(`tick: state version ${state.version} != ${STATE_VERSION}; refusing to tick`);
    process.exit(1);
  }

  const lines = [];
  for (let i = 0; i < days; i += 1) {
    const events = tickOnce(state, { useGit });
    for (const e of events) lines.push(`- **Day ${state.day}** — ${e}`);
    console.log(`tick: day ${state.day}${events.length ? ' — ' + events.join(' ') : ''}`);
  }

  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
  if (lines.length) appendFileSync(CHRONICLE_PATH, lines.join('\n') + '\n');
}

if (process.argv[1] && process.argv[1].endsWith('tick.mjs')) main();
