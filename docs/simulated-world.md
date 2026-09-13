# MemoryOS as a simulated world

**Date:** 2026-09-13
**Status:** design + phase 0 shipped (the Village of the Sages is alive)
**Scope:** turning a set of 26 finished scenes into one world that grows its own
content, is inhabited, is fed by the real world, and moves while nobody is
watching.

---

## 0. What was chosen

Three of the four possible meanings of "self-evolve", and one clock:

- **Grows its own content.** The world adds to itself — new works, new
  inscriptions, eventually new loci and new scenes.
- **Inhabited.** People live in the scenes, with goals and memory, and they are
  doing something when you arrive.
- **Driven by the real world.** Outside events tick it forward, the way Room
  OS's news door already does.
- **Offline ticks.** It changes while he sleeps, not only in response to a click.

Deliberately **not** chosen: a world that mirrors his learning state — mastered
loci polished, weak ones decayed. That is a study tracker wearing a village. The
world he asked for is one that has its own life.

---

## 1. The claim

A self-evolving world is not a content generator pointed at a scene. Ask an LLM
nightly for "something new in the village" and within two weeks the village is
landfill: forty buildings nobody chose, none of which mean anything, on a hill
that was composed.

What makes a world feel alive is not novelty. It is **metabolism** — a small set
of processes that consume something scarce, take time, and leave traces:

| Organ | What it does | Where it lives |
|---|---|---|
| **Intake** | the real world arrives as raw material | `tools/tick.mjs` harvest |
| **Labour** | inhabitants spend days turning material into structure | the tick |
| **Deposit** | finished work becomes geometry and text | `src/world/works.js` |
| **Weather** | everything finished starts going quietly wrong | the tick |
| **Chronicle** | the world writes down what it did | `world/chronicle.md`, the HUD |

Four of those five are arithmetic. Only one needs judgement, and that one runs
weekly, not nightly, and ends in a pull request (§5).

The scarcity is the point. Growth that costs nothing is slop; growth that costs
material is a record. In this world the material is **his own work** — see §6.

---

## 2. The layer rule

This is the decision everything else depends on.

> **Canon is hand-built and only Tony writes it. State is machine-written and is
> data only. The viewer composites state onto canon at runtime.**

```
models/<id>.glb        canon   Blender, his hands           machine: never
src/scenes/<id>.js     canon   loci, framing, prose         machine: only via PR
world/state.json       state   day, people, works, wear     machine: nightly
world/chronicle.md     state   what happened                machine: nightly
src/world/*            engine  turns state into geometry    changes rarely
```

Consequences worth stating plainly:

- **No Blender in the nightly loop.** Nothing has to be re-exported for the
  world to change. This is the same trick Room OS already uses — the room
  geometry is baked, everything on the furniture is built at runtime — and it is
  what makes a daily tick cost seconds instead of a render farm.
- **26 finished scenes cannot be damaged by the simulation.** The worst a bad
  tick can do is produce ugly scaffolding, and `git revert` removes it.
- **The world's history is free.** Every tick is a commit. `git log world/` is
  the chronicle in another form, and any day can be replayed.
- **A scene opts in.** One `world: {...}` key in its config. A scene without it
  loads byte-for-byte as it did before. `attachWorld` returns `null` on a
  missing file, a bad version, or a parse error, and `Viewer` never awaits it.

---

## 3. Sockets: where growth is allowed to happen

Generated content scattered anywhere ruins a composition. So canon declares
**sockets**, and the world may only fill those.

| Socket | Meaning | Already in the repo |
|---|---|---|
| `plot` | a building site | Wisdom Village's 12 plots, built to be filled |
| `peg` | a blank locus wanting content | ~64 blank pegs across five empty palaces |
| `board` | a surface that can show live text or an image | proven by Room OS's news world |
| `path` | a route inhabitants walk | the stair; the Quarry→Athenaeum cart track |
| `gate` | a door to a scene that does not exist yet | The Stack's Antilibrary Gate |

Wisdom Village was the right place to start because it is already a socket
board: twelve plots, each a different silhouette, every description ending
*"Open plot — no thinker assigned yet."* It was authored for exactly this and
then left waiting for a year.

---

## 4. Three clocks

| Clock | Period | Runs on | Costs | Decides |
|---|---|---|---|---|
| **Frame** | 60 Hz | the browser | nothing | where a walking figure is *right now* |
| **Day** | nightly | GitHub Actions | free minutes | arithmetic: intake, labour, wear |
| **Season** | weekly | a scheduled Claude session | tokens, judged | content: who moves in, what gets built next |

The split is what keeps it cheap and keeps it good. The day tick must never need
taste; the season tick must never do arithmetic. If a nightly job is asking a
model what should happen, the design has gone wrong.

The day tick is **deterministic**: a seeded PRNG keyed on `(seed, day)`, so a
strange morning can be replayed exactly with `node tools/tick.mjs --days N`.

---

## 5. The season tick (phase 3, not yet built)

Weekly, a scheduled Claude session:

1. reads `world/state.json` and the chronicle,
2. looks at the **pressures** the day tick has accumulated — a plot finished but
   unnamed, a peg blank for six weeks, a gate with nothing behind it,
3. writes *content*: the thinker who moves into Plot 07 and why the silhouette
   suits them, the text of a blank peg, the spec for a district that should
   exist,
4. **opens a pull request.** It never pushes to `main`.

He stays the planning authority. That is not a safety fig leaf — it is the part
of this he said he actually enjoys: *the idea, the choices, and the judging.* An
agent that decides what the village means takes away the only job worth having.

---

## 6. The economy — what growth costs

Nothing is built out of nothing. Material comes from **his commits to this
repo**, classified by what they touched:

| He touched | The village receives |
|---|---|
| `models/`, anything Blender | **stone** — walls |
| `docs/`, any `.md` | **timber** — frames |
| `src/`, `scripts/`, `tools/` | **glass** — fitting out |

One commit is one block, and a block carries its subject line. A house needs
eight blocks; twelve houses need ninety-six. Using the wrong material still
works but at half speed, and the mason says so in his journal
(*"laid 2 at Plot 3 (63%), making do without stone"*) — a village that stops
dead waiting for glass is realistic and unbearable.

Commits that touch only `world/` are not ore. The world does not quarry itself.

The payoff is at the end of the chain: a finished house gets a **stone tablet
carrying the commit it was founded on**, and keeps the full list of the eight
blocks that went into it. The wall can be read back to the work that paid for
it. Tap the tablet and the provenance is there.

This is also the anti-slop mechanism, and it is worth being explicit about why
it works: the growth rate is bounded by something outside the generator. The
world cannot inflate; it can only record.

---

## 7. The inhabitants

Four, to start, each with a role, a position on the stair, and a bounded
journal:

- **Quy**, mason — opens the next plot, lays what has reached the site.
- **Hien**, carter — hauls blocks from the gate yard up the hill, three a day.
- **Lam**, lamplighter — walks to whichever dedicated house has the most wear
  and trims its lamp.
- **Thu**, chronicler — goes where the day's event happened and writes it down.

They decide by utility rules, not by a model: cheap, deterministic, debuggable,
and good enough that the village reads as busy. Their journals are what make
them people rather than props — tapping Quy gives you ten days of a working life
(*"d30 · nothing on site; stood idle"*), which is more characterful than any
line an LLM would have written for him, because it is true.

Names are in `world/state.json` and can be changed there in ten seconds.

---

## 8. Wear, and why the world does not respond to visits

Everything dedicated accumulates `wear` at 0.02/day: the lamp dims, moss creeps
onto the flags. The lamplighter pushes back 0.15 at a time, so a village with
one lamplighter can maintain a handful of houses and no more. That is a real
constraint with a real answer — a second lamplighter, eventually, or houses that
are allowed to fall.

Note an honest limit: **a static site on GitHub Pages cannot know whether he
visited.** There is no backend, and `localStorage` never reaches the tick. So
wear runs on *world time*, not on attention. If attention should matter later,
the options are a tiny Cloudflare Worker, or Room OS's local helper acting as
the beacon when the village is opened through the arcade — not a rewrite.

---

## 9. Legibility: the world has to tell you what it did

A world that changes while you are away is indistinguishable from a bug unless
it says so. Three places do:

- the **hub card** carries `Day 32 · 12 new`,
- the **day chip** in the scene opens the chronicle of what was missed, once,
- `world/chronicle.md` is the long record, in git, in English.

"Last seen" is per-browser `localStorage`, wrapped in try/catch, and its absence
degrades to "nothing was missed".

---

## 10. What is built now (phase 0)

```
world/state.json            the world: day, plots, yard, site, people, chronicle
world/chronicle.md          the long record, appended by the tick
tools/tick.mjs              the day tick — zero-dep node, deterministic
.github/workflows/tick.yml  22:00 UTC daily, commits the day, asks Pages to deploy
src/world/stages.js         the five plot stages and the palettes
src/world/figures.js        inhabitants, built from primitives at runtime
src/world/works.js          stakes, scaffolding, glazing, tablets, lamps, moss
src/world/WorldLayer.js     the seam: state + canon -> geometry, and picking
src/world/WorldHud.js       the day chip and the tap panel
src/scenes/wisdom-village.js  gains one `world: {...}` key
src/viewer/Viewer.js        four lines: attach, update, pick, ignore failures
src/main.js                 the hub badge
src/style.css               a `.world-*` block, namespaced
```

Two details worth keeping:

- **Scaffolding is measured, not guessed.** The works layer unions the glb
  meshes standing near each plot to get that house's bounding box, so the
  scaffolding fits a silhouette nobody described to it.
- **Ground is found by raycast, and "first hit" is wrong.** A ray dropped on a
  plot lands on the *roof*, which is how the first dedication tablets ended up
  hovering over the mountains. `groundAt` keeps only upward-facing faces and
  takes the one nearest the height the caller already knows — the house's own
  underside, or the previous stair sample. It then walks the tablet inward until
  it is standing on the same terrace as the house, because the terraces here are
  narrower than they look.

Running it by hand:

```bash
node tools/tick.mjs --init          # a fresh day-0 world
node tools/tick.mjs                 # one day
node tools/tick.mjs --days 7        # a week
node tools/tick.mjs --days 3 --no-git   # advance without harvesting commits
```

---

## 11. Phases

| Phase | What | Needs |
|---|---|---|
| **0 — heartbeat** *(done)* | the village lives; commits become houses | — |
| **1 — more intake** | RSS and his Blender renders as material; boards that show real text; a second scene opts in | the feed fetch moves into the tick, which already has network |
| **2 — the Quarry** | build the intake organ as a real scene: blocks in five chisel stages, the cart track to the Athenaeum, the Antilibrary Gate as a working door | one Blender scene, once; it was spec'd a year ago |
| **3 — the season tick** | the weekly judged pass that writes content and opens PRs | a scheduled Claude session + a PR workflow |
| **4 — inhabitants who speak** | ask a sage a question in their house | an API hop; Room OS's local helper already is one, so keys never touch Pages |

---

## 12. Open questions for him

1. **Does the village fill in order, or by choice?** Right now the mason takes
   the lowest empty plot. The alternative is that a plot only opens when a
   thinker has been assigned to it — growth waits on judgement rather than
   racing ahead of it.
2. **Who moves into a finished house?** The tablet currently carries the
   founding commit. That was the cheap answer. The real answer is a sage, and
   choosing them is the season tick's first job.
3. **Should houses be allowed to fall?** One lamplighter can hold a handful.
   A world where neglect is survivable is comfortable; a world where it is not
   is honest.
4. **Which scene is second?** The Stack is built oversized on purpose and has a
   gate with nothing behind it. That is the strongest socket in the repo.
