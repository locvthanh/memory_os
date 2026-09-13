// The Back Office, part 1 of 4: the audit and the layout.
//
// This is the Python generator (blender_models/office_scenegen/build_office.py)
// rewritten to run in the browser, which is the whole point of the rewrite:
// the corridor used to be baked into a glb, so a new scene only grew a door
// when someone remembered to re-run Blender. Now the room re-runs the audit
// every time it is opened. Write a scene, push it, walk in: the door is there.
//
// WHAT AN ORPHAN IS. A scene that is registered on the hub and that no other
// scene's locus links to — on the map, but nowhere in the world. See
// docs/scene-map.md, which is the audit this room automates.
//
// HOW THE EDGES ARE FOUND. Titles and ids come from the registry, which is
// already a module. The `link:` edges do not: they are inside each scene's
// config, and importing thirty configs would drag in every procedural scene's
// whole implementation with it (cafef alone is seventy kilobytes of trading
// floor, and its module reads the clock on import). So the sources are fetched
// as TEXT and scanned with the same regex the Python used. No module is
// evaluated, nothing has a side effect, and the whole sweep is one parallel
// round of small gzipped files.
import { SCENES } from '../../scenes/index.js';

export const SELF = 'the-office';

// The one hand-kept table in the room. A scene named here lands in that wing;
// anything else lands in The New Wing, which is the honest place for a room
// nobody has thought about yet. Leaf colour is the door, glow is the transom.
export const SECTIONS = [
  {
    name: 'The Subjects', leaf: 0xc2842f, glow: 0xf0b357,
    ids: ['solar-system', 'india-history', 'nobel-hall', 'cfa-level-1',
      'civil-war', 'world-war-2', 'the-white-house', 'chroniclers-athenaeum'],
  },
  {
    name: 'The Systems', leaf: 0x2c7a75, glow: 0x4fd2c8,
    ids: ['macro-hydraulic-hall', 'pin-factory', 'the-stack',
      'body-heart', 'body-lungs'],
  },
  {
    name: 'Work & Worlds', leaf: 0x47569f, glow: 0x8492ee,
    ids: ['grab-workplace', 'lunar-base', 'future-city', 'sky-loft',
      'chinatown-street', 'wisdom-village', 'war-museum'],
  },
  {
    name: 'The Quiet Rooms', leaf: 0x4c7742, glow: 0x84d06a,
    ids: ['hutong-corner', 'misty-valley', 'meditation-ledge',
      'seaside-bungalow', 'glacier-deck'],
  },
  // Catch-all, always last, no id list.
  { name: 'The New Wing', leaf: 0x6a4a8f, glow: 0xb98fe8, ids: null },
];

// Room proportions, in three.js space (x right, y up, z toward the viewer).
// The office sits at positive z and the corridor runs away from it into
// negative z, which is what the Blender build exported and what every locus
// position in the old data file already used.
export const M = {
  X0: -5.5, X1: 5.5,        // office west .. east
  ZN: 0, ZS: 9.0,           // office north (the arch) .. south
  CEIL: 3.3,
  WT: 0.14,
  CW: 3.0,                  // corridor half-width
  ARCH_W: 3.0, ARCH_H: 2.9,
  DOOR_W: 1.25, DOOR_H: 2.3,
  BAY0: 2.4, PITCH: 2.7, RUNOUT: 2.7,
};

const LINK_RE = /\blink:\s*['"]([a-z0-9-]+)['"]/g;

/** Fetch one scene's source and return the ids it links to. Never throws: a
 *  file that will not load simply contributes no edges, which can only make
 *  the corridor longer, never wrong in a way that hides a room. */
async function edgesOf(id) {
  try {
    const res = await fetch(new URL(`../../scenes/${id}.js`, import.meta.url));
    if (!res.ok) return [];
    const src = await res.text();
    return [...src.matchAll(LINK_RE)].map((m) => m[1]);
  } catch {
    return [];
  }
}

/** Every scene that some OTHER scene points at. This room's own files are
 *  skipped on purpose — it links to every orphan, so counting its own edges
 *  would empty the corridor. */
export async function inbound() {
  const ids = SCENES.map((s) => s.id).filter((id) => id !== SELF);
  const lists = await Promise.all(ids.map(edgesOf));
  return new Set(lists.flat());
}

/**
 * Work out the corridor.
 *
 * `slots` is the physical sequence of positions down the arcade, two to a bay,
 * west first. An entry is a door or `null`, and a null is a deliberately blank
 * wall panel: each wing is padded to an even number so the next one starts on
 * the west side, and the gap reads as what it is — room for one more of that
 * kind.
 */
export async function plan() {
  const titles = new Map(SCENES.map((s) => [s.id, s.title]));
  const linked = await inbound();
  const orphans = SCENES.map((s) => s.id)
    .filter((id) => id !== SELF && !linked.has(id));
  const pool = new Set(orphans);

  const buckets = [];
  for (const sec of SECTIONS.slice(0, -1)) {
    // the section's own order, not the registry's, so a door keeps its number
    // when an unrelated scene is added further up the list
    const got = sec.ids.filter((id) => pool.has(id));
    got.forEach((id) => pool.delete(id));
    buckets.push({ sec, ids: got });
  }
  buckets.push({ sec: SECTIONS[SECTIONS.length - 1], ids: [...pool] });

  const slots = [];
  const wings = [];
  let n = 0;
  for (const { sec, ids } of buckets) {
    if (!ids.length) continue;
    wings.push({ name: sec.name, leaf: sec.leaf, glow: sec.glow, slot: slots.length, count: ids.length });
    for (const id of ids) {
      n += 1;
      slots.push({
        n, id, title: titles.get(id) || id, section: sec.name,
        leaf: sec.leaf, glow: sec.glow,
      });
    }
    if (ids.length % 2) slots.push(null);
  }

  const bays = Math.max(2, Math.ceil(slots.length / 2));
  const bayZ = [];
  for (let i = 0; i < bays; i += 1) bayZ.push(-(M.BAY0 + M.PITCH * i));
  const end = bayZ[bays - 1] - M.RUNOUT;

  return {
    slots, wings, bays, bayZ, end,
    doors: slots.filter(Boolean),
    scenes: SCENES.length,
    orphans: orphans.length,
  };
}

/** Where slot i sits: x on the inner wall face, z, and which side it is on. */
export function slotPose(p, i) {
  const side = i % 2 === 0 ? -1 : 1;
  return { x: side * M.CW, z: p.bayZ[Math.floor(i / 2)], side };
}
