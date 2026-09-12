# Software Engineering — scene plan

One MemoryOS scene: **The Stack**, a city built as a round stepped pit, where
the districts are the topic areas of software engineering and the *height* of a
district is its level of abstraction. This is the living design doc: edit it as
districts get built, and move the detailed notes into `claude/the-stack-scene.md`
once work starts.

- **Status:** building — phase 1 (the pit, districts 1–2, loci 1–16) is live
- **Started:** 2026-09-12
- **Proposed scene id:** `the-stack` (`models/the-stack.glb`, `src/scenes/the-stack.js`)
- **Shape:** one city, six districts, 51 loci, shipped in five phases
- **Decided 2026-09-12:** one 51-stop tour is fine; districts, streets and loci all
  carry labels in the world; the city is built oversized so districts can grow
- **Covers:** CS foundations · code craft & design · system design & distributed
  systems · delivery & operations

---

## Design idea

Software has one property no other subject in MemoryOS has: it is built in
**layers**, and every layer is a lie the layer below agrees to maintain. So the
city is **vertical**. The tour starts in the rock under the city at a single
transistor and climbs to a control tower on the rim, and the climb *is* the
abstraction ladder: the higher the camera goes, the further from the machine and
the closer to other people.

So the city is a **round stepped pit**: six concentric terraces, each one higher
*and wider* than the one below, like a stepwell or an open-cast mine. The tour
starts on the pit floor at a single transistor and spirals up and out to the rim.
From any terrace you can look across and down through every layer under you.

That gives the whole scene one rule to remember it by:

> **Altitude = abstraction.** The pit floor is the machine. One step up is the
> data. Then the code, then the system, and the rim is the organisation.

And one thing travels the whole height: a glowing cube — **the Packet** — moving
along the neon traces that serve as the city's streets. Where the traces glow,
the system is running.

### Why a pit and not a skyline

The CFA Financial District is already a bright low-poly island city seen from
above, and its rule is *height = exam weight*. The Stack has to not look like
it. So: a **night** city seen from *inside*, and concave rather than convex —
a pit 320 m across and 88 m deep, terraces widening as they rise. Light comes
from the city itself — emissive neon traces, kerbs, signage — not from a sun.
Think circuit board at 3 a.m., not glass tower at noon.

The pit also pays for itself mechanically: every terrace is concentric, so every
locus in the whole scene can anchor its camera from one shared centre (the pit
axis) with a negative stand-off — the rig sits inside the ring and looks outward
at the prop, with that district's wall, traces and nameplate behind it.

### Rules shared by every district

1. **Altitude = abstraction** (above). Six terraces, bottom to top.
2. **One colour per district**, carried by its neon traces and signage — the
   same method the Hydraulic Hall uses for water colour:
   | District | Colour |
   |---|---|
   | Bedrock (the machine) | indigo + copper |
   | The Mines (data structures & algorithms) | teal |
   | The Artisans' Quarter (code craft) | warm amber — the only warm-lit level |
   | The Grid (distributed systems) | cold cyan-white |
   | The Rim (delivery & operations) | signal green, with red |
   | The Summit (the antilibrary) | violet |
3. **The Bug.** A beetle appears in every district, and in each one it is caught
   by a different mechanism — a type check, a test net, a review gate, a canary,
   an alert. Its price tag grows ten-fold each level. It is Grace Hopper's actual
   1947 moth, and it is the continuity character the way the Baker is in the
   macro series.
4. **A real artifact or outage at every stop.** No stop is a generic
   illustration: Dijkstra's café, Therac-25, Ariane 5, Knight Capital's 45
   minutes, the S3 typo, Cloudflare's regex, log4shell, the xz backdoor.
5. **An open-question door closes every district** — the antilibrary rule. Five
   doors, one per district, all opening onto the Summit.
6. **No animation** (the pipeline has none yet): flow is shown with static light
   trails and chevrons, as the Hydraulic Hall does.

### Why one city instead of six scenes

Because the layers only teach the lesson when you can see them stacked. The cost
is a long tour (~51 stops, ~10 minutes) and a big build, so:

- It ships **one district per phase**, committed and pushed as it lands.
- Any district can later grow its **own deeper scene** behind a portal locus —
  the pattern `war-museum` already uses for its sand tables. The Mines are the
  obvious first candidate (a scene per data structure).
- Optional small viewer change: let a registry entry carry a **locus range** over
  the same glb, so "The Stack — Bedrock" can be its own short tour without a
  second model. Not needed for phase 1.

---

## The city, bottom to top

Section through the pit (radius out to the right, height up):

```
  z=74  ^  THE SUMMIT ........ violet  r=160   the antilibrary
  z=60 +2  THE RIM ........... green   r=136   git, CI/CD, deploys, on-call, security
  z=45 +1  THE GRID .......... cyan    r=112   load balancers, DBs, caches, queues, CAP
  z=30  0  THE ARTISANS' Q. .. amber   r= 88   names, functions, SOLID, tests, review
  z=15 -1  THE MINES ......... teal    r= 66   arrays, maps, trees, graphs, Big-O, locks
  z= 0 -2  THE BEDROCK ....... indigo  r= 44   transistors, the CPU, memory, stack, heap
```

Every district's content sits on the **southern arc, 192°–348°**; the northern
204° of every ring is left empty on purpose — the **Unbuilt Quarter**, pegged
out with foundation stubs and violet rebar, room for loci that don't exist yet.
Consecutive districts run their arc in opposite directions, so the tour spirals,
and a stairway climbs at each turn. Props stand 7 m inside their riser wall;
open-question doors are set *into* it.

---

## 1. The Bedrock — the machine (level −2) · 6 loci

- **Concepts:** a computer is a switch repeated a billion times; the
  fetch–decode–execute loop; memory as numbered cells; pointers; the call stack
  vs the heap; what "out of memory" and "stack overflow" physically are.
- **Setting:** a flooded cavern under the city, copper bus bars overhead, the
  rock face cut away so you can see the city's footings.
- **Art style:** indigo dark, copper, single-colour emissive glyphs.

1. **The Moth Case** — a glass case with a moth taped into a logbook, 9
   September 1947, Harvard Mark II. The Bug is introduced, and with it the
   scene's frame: the machine is simple; everything above it exists because
   humans are not.
2. **The Gate** — one transistor as a literal lever-operated gate, with a NAND
   truth table in neon above it. Everything in the city is this, repeated.
3. **The Foundry** — the CPU as an assembly line: fetch, decode, execute,
   write-back, each a station, with work in flight at every station at once
   (pipelining). *Links to `pin-factory`* — it is Adam Smith's division of
   labour in silicon.
4. **The Address Library** — memory as a wall of numbered pigeonholes. A pointer
   is a slip of paper carrying a box number, not the thing in the box. Cache is
   the pigeonhole you can reach without walking.
5. **The Stack Stair and the Heap Yard** — a spiral stair of plates that are
   pushed and popped by each call (and crash into the ceiling on infinite
   recursion), beside an open yard where you ask for space and must give it
   back. A garbage truck makes the rounds; rusting piles are leaks.
6. **Door: *What can't be computed at all?*** — the halting problem, Turing
   1936. The first antilibrary door.

## 2. The Mines — data structures & algorithms (level −1) · 10 loci

- **Concepts:** the handful of shapes all data takes, what each costs, and how
  to talk about cost at all.
- **Setting:** a mined-out gallery level, narrow-gauge rails, each structure a
  piece of working infrastructure rather than a diagram.
- **Art style:** teal, wet stone, lamp-lit.

7. **The Mailbox Row** — arrays: identical boxes in a straight line, so box *n*
   is arithmetic, and walking them is fast because they are neighbours.
8. **The Barge Chain** — linked lists: each barge carries the address of the
   next. Cheap to splice, slow to visit, because the next barge is anywhere.
9. **The Cloakroom** — hash maps: a machine stamps your coat to a hook number;
   two coats on one hook is a collision; constant time until the cloakroom is
   too full.
10. **The Orchard** — trees: a sorted orchard you search by halving, and the
    B-tree filing cabinet next to it, which is what a database index actually is.
11. **The Metro Map** — graphs: two search crews leave the same station, one
    sweeping ring by ring (BFS), one running to the end of a line first (DFS).
    Dijkstra's own anchor: he worked the shortest-path algorithm out in about
    twenty minutes in an Amsterdam café in 1956, with no pencil.
12. **The Hump Yard** — sorting: a railway hump yard *is* merge sort; quicksort
    is the pivot siding; stability is whether two identical wagons keep their
    order.
13. **Gradient Street** — Big-O as five ramps out of the mine, flat to vertical:
    O(1), O(log n), O(n), O(n log n), O(n²), with O(n!) as a sealed shaft.
    Couriers race up them. Constants live in the paving and sometimes win.
14. **The Hall of Mirrors** — recursion: a stairwell containing itself, with a
    base-case door at the bottom that must exist, and a chalk wall outside where
    answers are written down once (memoisation).
15. **The Lock Bridge** — concurrency: one bridge, two tracks, a mutex toll gate.
    A race condition is both trains on it; deadlock is two trains nose to nose,
    each waiting. Real anchor: Therac-25, 1985–87 — a race condition in a
    radiation machine, and the reason "it's just a timing bug" is not a sentence.
16. **Door: *P vs NP*** — and the quieter question behind it: why are we still
    this bad at knowing which problems are hard?

## 3. The Artisans' Quarter — code craft (level 0) · 10 loci

- **Concepts:** everything that makes code survivable by the next person. The
  only warm-lit level, because this is the one about humans.
- **Setting:** a street of workshops at street level, lit from inside, washing
  lines of cable between the upper floors.
- **Art style:** warm amber, timber and brick over the basalt.

17. **The Sign Painter** — naming. The shop that names everything else in the
    city, and the alley of bad signs behind it (`data2`, `tmp`, `manager`).
18. **The One-Job Machines** — functions: small machines that each do one thing,
    with an inspection hatch. Pure machines take in and give out; the ones with a
    drain pipe have side effects, and the pipes are what you trip on.
19. **Coupling Alley** — two buildings fused by a dozen pipes through the wall,
    facing two buildings joined by one clean doorway. Interfaces, cohesion, and
    the leaky abstraction: a doorway with a draught under it (Spolsky, 2002).
20. **The Five Pillars** — SOLID as five load-bearing columns, with the crack
    that appears when each is removed shown on the wall behind.
21. **The Pattern Book Shop** — design patterns as a vocabulary, not a law:
    Christopher Alexander's *A Pattern Language* (1977, buildings) on the shelf
    above the Gang of Four (1994, code). Next to it, the shelf of patterns
    applied where they weren't needed.
22. **The Scaffold Tenement** — technical debt: scaffolding that has been up for
    eleven years, with an interest meter ticking. Ward Cunningham coined the
    metaphor in 1992 — and spent years objecting that it had come to mean
    "messy code", when he meant knowingly shipping the wrong model and paying to
    fix the model later.
23. **The Test Pyramid** — a stepped pyramid: many unit tests at the base, fewer
    integration above, a handful end-to-end at the tip. Beside it, the
    ice-cream-cone statue standing on its point. **The Bug is caught here**, in a
    net, with a small price tag.
24. **The Guild Hall** — code review and pairing: a two-key door nobody opens
    alone. Upstairs, Brooks' law on the wall — adding people adds communication
    paths, not output (*The Mythical Man-Month*, 1975). *Links to `pin-factory`*,
    which argues the opposite case for pins.
25. **The Renovation** — refactoring: a building being rebuilt room by room while
    people live in it, next to the cleared lot where someone chose the full
    rewrite instead. Real anchor: Netscape's rewrite, and Spolsky's "Things You
    Should Never Do" (2000).
26. **Door: *Is any of this actually evidence-based?*** — most of what this street
    teaches has never been measured well.

## 4. The Grid — systems & distributed systems (level +1) · 12 loci

- **Concepts:** what happens when one machine is not enough, and the network
  starts lying to you.
- **Setting:** the built city above street level — warehouses, canals on
  viaducts, a traffic circle, towers — all in cold light, with the Packet's trace
  running through it.
- **Art style:** cyan-white, concrete and steel, wet reflections.

27. **The Traffic Circle** — load balancing: requests round a carousel, health
    checks as a barrier that drops for a sick lane. Vertical scaling is a bigger
    lane; horizontal scaling is more lanes.
28. **The Warehouse** — the database: a ledger that is either fully written or
    not written (transactions, ACID), and a card catalogue beside it that is the
    index — fast to read, and a tax on every write.
29. **The Mirror Warehouses** — replication: one warehouse takes the writes,
    three copy it, and the copies are always slightly behind. Replication lag as
    a clock on each building showing a different time, and the customer who
    cannot find the thing they just handed in.
30. **The Split Ledger** — sharding: the ledger cut across warehouses by key.
    One warehouse has a queue round the block (hot shard), and moving the line
    between them while open is the hard part.
31. **The Vendor Cart** — caching: a cart outside the warehouse selling only the
    most-asked item. A bouncer evicting whoever was asked for least recently
    (LRU), a stale crate with a TTL stamp, and the crowd that arrives the instant
    the cart closes (thundering herd). Invalidation is the hard one.
32. **The Canal of Queues** — asynchrony: work in boats, not in hand. A lock
    filling up is backpressure; the dock of undeliverable crates is the
    dead-letter queue; at-least-once delivery means some crates arrive twice, so
    the receiver has to cope.
33. **The Three-Bridge Storm** — CAP: three bridges to an island and a storm
    cutting one. You may keep answering with possibly-wrong stock (available) or
    refuse to answer until the bridge is back (consistent). Real anchors: Amazon's
    Dynamo paper (2007) choosing the first; Spanner's atomic clocks (2012)
    buying its way towards the second.
34. **The Lighthouse Council** — consensus: three lighthouses that must agree on
    one signal, a rotating beacon for leader election, and the split-brain night
    when two believe they lead. Paxos, Raft.
35. **The Post Office** — retries and idempotency: every crate carries a stamped
    receipt number so posting it twice changes nothing. Without that, the retry
    storm — everyone resending at once — is what turns a blip into an outage
    (hence jitter).
36. **The Token Booth** — rate limiting: a bucket that tokens drip into, and you
    pass only by spending one. Quotas, and the noisy neighbour next door who
    spends everyone's.
37. **The Monolith and the Bazaar** — one vast stone hall across the square from
    a market of small stalls, with the stalls' courier traffic drawn in: every
    call that was a function call is now a network call that can fail or be slow.
    Real anchors: Amazon's 2002 API mandate in favour, and Segment's 2018 move
    back to a monolith against.
38. **Door: *How much distribution is too much?*** — nobody can tell you in
    advance where the line is for your system.

## 5. The Rim — delivery & operations (level +2) · 10 loci

- **Concepts:** everything between "it works on my machine" and "it works for
  everyone, and we know when it doesn't".
- **Setting:** the canyon rim road looping the whole city, with the pipeline
  running up from the Artisans' Quarter to Production at the top.
- **Art style:** signal green and red, galvanised steel, floodlights.

39. **The Branch Orchard** — version control: a grafted tree you can walk;
    commits as grafts, branches as limbs, merge as a join that either takes or
    scars. The blame ledger in the shed, read to find a reason, not a culprit.
    A limb that has grown six months away from the trunk cannot be grafted back.
40. **The Funicular** — CI: a crate rides up through gates — build, test, scan,
    sign — and any red gate sends it back down. The only number that matters is
    how long the ride takes, because a slow ride gets bypassed.
41. **The Three Model Houses** — dev, staging and production as three houses that
    were identical when built and are not now. "Works on my machine" as a statue.
    Configuration as the house's fuse box; infrastructure as code as the
    blueprint that *is* the house.
42. **The Bridge Swap** — releasing: two identical bridges and one switch
    (blue/green), a single cart sent first with a canary cage on it, a wall of
    flag switches, and a rollback lever under glass. Real anchor: Knight Capital,
    1 August 2012 — old code left reachable by a flag, $440M in 45 minutes.
43. **The Control Tower** — observability: a gauge wall (metrics), a ledger room
    (logs), and a room of threads on a board (traces — one request's path through
    every stall in the Bazaar below). On the balcony, the all-green dashboard
    facing away from the fire.
44. **The Fire Station** — incidents: the pole, the rota board (on-call), the
    runbook shelf, and a round table with no accusation chair (the blameless
    postmortem). Real anchors: the AWS S3 outage of 28 February 2017 — a typo in
    one command during routine work — and Cloudflare's 2019 regex that pegged
    every CPU.
45. **The Monkey** — a monkey loose in the city with a wrench, breaking one thing
    on purpose in daylight. Netflix's Chaos Monkey, 2011: resilience is a thing
    you practise, not a thing you claim.
46. **The Gatehouse** — security: a ring with exactly the keys this job needs
    (least privilege), a sealed vault for secrets that is never built into a wall
    (never in the repo), and an inspection dock for every delivered crate — the
    supply chain. Real anchors: log4shell (2021), and the xz backdoor (2024),
    which was a person, patiently, for two years.
47. **The Tally Office** — measuring delivery: the four DORA keys on the wall
    (lead time, deploy frequency, change failure rate, restore time) and, in the
    basement, the lines-of-code counter nobody reads any more. Goodhart's law
    framed above the desk.
48. **Door: *Can you measure a developer?*** — every attempt so far has measured
    something else.

## 6. The Summit — the antilibrary (above +2) · 3 loci

49. **The Cost Ladder** — the Bug's five price tags side by side, one per level:
    caught in design, in code, in test, in staging, in production, each about ten
    times the last (Boehm, 1981). And, beside them, the papers arguing the curve
    is much flatter than the poster version — which matters, because the whole
    industry's "shift left" rests on it.
50. **The Silver Bullet Vitrine** — an empty glass case. Brooks, 1986: the
    accidental complexity — languages, tools, plumbing — is the part we keep
    making easier; the essential complexity, understanding what the thing must
    do, is the part that is left, and no tool removes it.
51. **The Antilibrary Gate** — the five district doors arrive here as five
    unopened gates, plus the questions this scene cannot answer: is software
    engineering engineering; why do estimates never work; what does the craft
    become when the machine writes the code. *Links to `chroniclers-athenaeum`*
    (what is known) and, once built, *The Quarry* (what isn't).

---

## Cross-links to existing scenes

| From | To | Why |
|---|---|---|
| The Foundry (3) | `pin-factory` | Division of labour → the CPU pipeline |
| The Guild Hall (24) | `pin-factory` | Brooks' law as the counter-argument to Smith |
| The Antilibrary Gate (51) | `chroniclers-athenaeum` | Mastered knowledge |
| The Antilibrary Gate (51) | The Quarry (unbuilt) | Unlearned knowledge |
| `wisdom-village` | The Stack | A sage-house for the engineering canon could open here |

---

## Implementation notes

Conventions follow `cfa_scenegen/` and `hydraulic_hall_scenegen/`.

**Sources** — `blender_models/stack_scenegen/` (as built):

```
st_lib.py        MB bmesh builder (from cfa_lib) + band/annulus/LCG/figure
st_layout.py     LEVELS, arcs, local->world frame, the palette, materials()
st_shell.py      the pit: floors, risers, traces, stairs, conduit, nameplates,
                 the Unbuilt Quarter
st_props.py      shared furniture: ground pad, street sign, antilibrary door
st_d1_bedrock.py, st_d2_mines.py, …   one module per district
st_build.py      orchestrator: build(parts) / save() / export() / locus_shot()
```

Rebuild and re-export, from a Blender MCP call:

```python
import sys, importlib
sys.path.insert(0, r"...\blender_models\stack_scenegen")
import st_build; importlib.reload(st_build)
st_build.build(('shell', 'd1', 'd2')); st_build.save(); st_build.export()
```

`st_build.locus_shot('L07', 7)` renders exactly what the web rig will frame at
locus 7 (same 50° vertical FOV, same negative stand-off), which is the only
reliable way to check framing without the app.

Blender file `blender_models/TheStack.blend`, one collection per district
(`D1_Bedrock` … `D6_Summit`) plus `09_Loci`.

**Loci** — empties `Locus_01_moth`, `Locus_02_gate`, … baked into the .blend;
only the number is read, the label is for us. A locus must sit at the *mid
height* of a tall subject, because the rig parks `eyeHeight` above it and looks
down.

**`anchorFrom` on every locus, but only one value.** Radial anchoring measures
from the centroid of *all* loci, which here sits off-centre because every
district uses the same southern arc. Because the terraces are concentric, the
right centre is the pit axis — so every locus carries `anchorFrom: [0, 0, 0]`
and a negative `anchorDistance` (−19 for props, −17 for the wall doors).

**Light.** Emissive materials, not lamps, wherever possible — `Viewer` sets
`castShadow` on every mesh it loads, so a large emissive shell shadows the city
(the lesson `portal-island`'s sky dome taught). Any backdrop plane, sky dome or
framing camera goes in `build_glb.py`'s `RENDER_ONLY` for this scene.

**Budget.** Biggest glb on disk today is `solar-system.glb` at 26 MB; a
50-locus city must stay well under that. Linked duplicates for every repeated
prop (pigeonholes, mailboxes, warehouses, stalls, window grids), no subdivision,
no textures — flat emissive colour and plate geometry only. Check the size after
each phase, not at the end.

**Walkthrough tuning (first guess):** `travelSeconds: 3.2`, `dwellSeconds: 11`,
`eyeHeight: 2.0`, `loop: true`; longer travel on the three level changes, which
should read as an ascent — the camera should visibly climb out of the mine into
the amber street.

**Phases:**

| Phase | Contents | Ships |
|---|---|---|
| 1 | The pit + The Bedrock + The Mines (16 loci) | **built 2026-09-12** |
| 2 | The Artisans' Quarter (10) | |
| 3 | The Grid (12) | |
| 4 | The Rim (10) | |
| 5 | The Summit, the five doors, cross-links, polish | |

Each phase: build → render checks → re-export `models/the-stack.glb` → extend
`src/scenes/the-stack.js` → commit and push to `main`.

---

## As built — phase 1 (2026-09-12)

`blender_models/TheStack.blend`, `models/the-stack.glb` (1.8 MB, 149 objects,
~8.1k faces), `src/scenes/the-stack.js`, registered in `src/scenes/index.js`.

- **The pit**: six terraces and risers as bands and annuli, a lit kerb on every
  terrace lip in that district's hue, 13 vertical neon traces and one horizontal
  run per riser, a stair at each arc end, and the Packet's conduit climbing the
  full 88 m at 356°.
- **Labels in the world** (the decision of 2026-09-12): every district has a
  neon nameplate high on its riser — number, name and subtitle — every locus has
  a street sign on a post with its name and number, and every prop stands on a
  kerbed ground pad. The Unbuilt Quarter is captioned on each terrace.
- **Bedrock (1–6)**: the moth case with its logbook line, the transistor as a
  lever gate under a lit NAND table, the CPU as a four-station line with work in
  flight at each station, a wall of pigeonholes with a pointer slip on a stand,
  the call stack as a spiral of plates hitting a ceiling beside a fenced heap
  yard with a collection truck, and the halting-problem door.
- **Mines (7–16)**: mailbox row with indices, barge chain ending in NULL,
  cloakroom with a stamping machine and one double-hung hook, sorted orchard
  beside a B-tree cabinet with one drawer pulled, metro map with BFS and DFS
  crews, hump yard, five ramps of Gradient Street with the O(n!) shaft sealed,
  the hall of mirrors with its base-case door, the one-track lock bridge with two
  trains nose to nose, and the P vs NP door.
- Descriptions are **real content**, not placeholders.
- Camera: `travelSeconds 3.6`, `dwellSeconds 13`, `eyeHeight 2.2`,
  `anchorDistance −19`, `background #070a12`, `fog 95/460`, lights turned down
  (`hemisphere 0.42`, `sun 0.7`, `ambient 0.14`) so the neon carries the colour.

## Open after phase 1

- The scene has not yet been seen in a browser — this session had no way to run
  the dev server or reach GitHub Pages; framing was verified with Blender renders
  that reproduce the web rig exactly. First thing to check on the next run.
- Should the Bug be a visible character the tour keeps finding, or only implied
  by the five price tags at the Summit?
- Phase 2 starts at the Artisans' Quarter (z=30, r=88, 10 loci, amber, arc runs
  192° → 348°).
