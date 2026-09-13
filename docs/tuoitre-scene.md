# Phố Báo Sáng — tuoitre.vn as a scene

Scene id `tuoitre-vn`. A hundred metres of Saigon shophouse street with eight
alleys off it, one per section of Tuổi Trẻ. Each alley has a painted gate and a
glazed **bảng tin** — the public notice case still bolted to walls all over
Vietnam — with that section's stories pinned inside it as newsprint, newest
nearest the street. Stand in front of one, read it, press **E** (or tap it) and
the real article opens on tuoitre.vn.

Room OS already has this feed as a place: a door on its east wall opens into a
reading square, boards on posts, readers wandering between them. This is the
same data and deliberately **not** the same room — mixed art styles across
scenes is a decision, not an accident, and a plaza and a street are different
things to be in.

## What is unusual about it

**1. No .glb.** Every other 3D scene here is a Blender model loaded through
`GLTFLoader`. This one is generated in the browser at the moment the page
opens, from the live feed. It has to be: a model exported last night would be
yesterday's paper, and the whole point is that walking in at 06:00 and at 21:00
gives you two different streets.

`Viewer.start()` therefore has two ways in. A scene config that exports a
`build` hook gets that called instead of the loader:

```js
build({ THREE, scene, camera, renderer, setStatus })
  -> Object3D
   | { root, update(dt, camera), pick(raycaster), dispose() }
```

`update` runs every frame, `pick` gets first refusal on taps (before the locus
labels, same contract the world layer has), and `setStatus` writes the loading
line so a twelve-second fetch does not look like a hang. The registry entry is
an ordinary `kind: '3d'` one with `model` simply left off.

**2. No loci**, like `glacier-deck`. A memory palace wants objects that hold
still; today's fourth Thời sự story is a different story tomorrow, so pegging
anything to it would be pegging to sand. This room is the other half of
MemoryOS — the anti-library, the place you go to find out what you did not know
yet. Free move only, no tour, no badges. The viewer drops the whole transport
bar when `loci` is empty, so the HUD in `hud.js` is what replaces it: a
crosshair, and whatever page is under it named at the bottom of the screen.

**3. `shadows: false`** and `lighting.sunPosition`. Both are new switches in
`Viewer`. The street is four thousand merged boxes in one mesh a hundred and
thirty metres long: a single shadow map over that is a smear. And the light
here has an hour to it, so the sun has to be able to sit low and east at dawn
and low and west at dusk instead of the fixed overhead key every other scene
uses.

## The clock

Everything about the light comes from one number: the wall time in Vietnam when
the page loads (`sky.js`). Sky gradient, sun colour and elevation, ambient
level, fog distances, whether the shop interiors and lane bulbs are lit, how
much emissive the pages carry, and how many people are still out — all of it
interpolates between eleven hand-tuned stops from `khuya` to `hoàng hôn`. The
scene config reads the same clock at import time, which is why `background`,
`fog` and `lighting` are computed rather than written down.

## Where the news comes from

MemoryOS is static files on GitHub Pages, with no helper process — and
tuoitre.vn's RSS sends no `Access-Control-Allow-Origin`, so the page cannot
fetch it directly. `feed.js` goes through public relays: **rss2json,
allorigins and codetabs, raced per category**, first usable answer wins, 10 s
timeout, eight categories in parallel.

Racing is the design, not an optimisation. These are free services with no
uptime promise, and allorigins — which worked perfectly while this scene was
being built — was dead within the hour, taking the first deploy's live feed
with it. Tried in turn that costs a timeout per category per relay, the best
part of a minute of staring at the loading line; raced, a dead relay costs
nothing because a live one answers first.

Things learned the hard way, all worth keeping:

- **allorigins answers an https origin and refuses an http one.** So it never
  works under `npm run dev` on `http://localhost`. Locally you get the
  snapshot, or whichever other relay is up. That is not a bug to chase.
- **rss2json is the sturdiest and fastest of the three** (it caches), but it
  returns `pubDate: null` for tuoitre — it cannot parse their American date
  format. So when a relay gives no usable date, the timestamp is read out of
  the article URL instead: the tail of
  `…-100260913151015237.htm` is `100` + `260913` (yymmdd) + `151015` (hhmmss)
  + a serial, in Vietnam time. That is the article's *creation* time and can
  run an hour behind the real pubDate, which is close enough for "3 giờ trước"
  on a board. See `tsFromLink`, and note it sanity-checks the result against a
  40-day window rather than trusting the regex.
- rss2json also returns only ten items per feed, which is fine while `PER_CAT`
  is seven.
- **The photos need no proxy, and must not have one.** `cdn2.tuoitre.vn` does
  send CORS headers. That matters more than it sounds: a cross-origin image
  without them taints the canvas, WebGL refuses to upload it as a texture, and
  every story page comes out blank. Direct measured ~0.4 s, `images.weserv.nl`
  ~1.4 s, so direct first and weserv only as a fallback. The URL is rewritten
  to `/thumb_w/480/`; the page texture is 448 px wide.

When every proxy is down the scene falls back to `world/tuoitre.json`, the last
edition on file, and the HUD says so. That file is **data** like everything
under `world/` — machine-written, never hand-edited:

```bash
node tools/news.mjs          # refresh it (Node talks to tuoitre.vn directly)
node tools/news.mjs --print  # show what it found, write nothing
```

Worth re-running now and then so the fallback is not a year old.

## Layout

```
roadway    x ∈ [-4, 4]            kerb top y = 0.14
pavement   x ∈ [±4, ±7.4]
frontage   |x| = 7.4              alleys cut back from there
street     z ∈ [-108, +16]        you arrive at the south end, +z behind you
alleys     z = -8, -20, -32 … -92, sides alternating L, R, L, R …
pages      first at |x| = 9.4, then every 2.9 m; alley depth follows the count
```

The alley is cut to fit its section — a dead end at a fixed distance looks
right with seven stories in the case and looks like a deserted service yard
with three, which is exactly what happens on the snapshot fallback.

## Files

```
src/scenes/tuoitre-vn.js        the config: clock-derived light, no model, build hook
src/scenesjs/tuoitre/
  index.js                      build entry — feed, photos, street, people, HUD, ticker
  feed.js                       RSS through the proxy chain, snapshot fallback, photos
  sky.js                        the hour -> sky, sun, level, dome
  street.js                     road, shophouses, alleys, gates, cases, stall, gantry
  pages.js                      one story -> one sheet of newsprint on a canvas
  life.js                       readers and walkers, ~20 merged-mesh figures
  hud.js                        crosshair, the reading panel, E-to-open
tools/news.mjs                  refresh the fallback edition
world/tuoitre.json              the fallback edition itself (data, not canon)
```

Style for the HUD lives in `src/style.css` scoped to `.tt-*`, the same way
`scenes2d` scopes its CSS to a body class.

## Performance notes

The whole static street — every shutter, kerbstone, stool, cable and leaf — is
pushed through `Batch` in `kit.js`: cloned geometry, baked through its matrix,
given a flat vertex colour, then merged into **one** mesh with a
`vertexColors: true` material. Two draw calls (matte + self-lit) instead of two
thousand. ~110k triangles, built in about 150 ms. The price is that nothing in
that mesh can move or be clicked, so the story pages, the people and the
loudspeaker head are real meshes built separately.

Point lights are the thing to watch, not triangles: a `MeshStandardMaterial`
shader pays for every light in the scene at every fragment. Night therefore
gets **one** light per alley and a light on only every third street lamp —
about a dozen in total. Every other bulb, lamp head and lit window is unlit
glow geometry, which costs nothing, and the pages carry their own emissive term
so they stay readable under them.

One trap when measuring any of this: the in-app preview pane throttles
`requestAnimationFrame` to near zero, so a frame counter there reads ~1 fps no
matter what the scene is. Time `renderer.render()` in a loop instead — this
scene submits in 0.13 ms.

## If it ever needs pegs

There are plenty of things that do hold still: the stall, the gantry, the
loudspeaker pole, and each of the eight gates. Eight loci, one per section,
would be a stable tour over live content — the stop would be "Kinh doanh", not
whatever Kinh doanh happens to be saying this afternoon.
