# Sàn Bảng Điện — cafef.vn as a trading floor

**Scene id** `cafef-vn` · **no model** · **no loci** · free move only

The second MemoryOS scene built in the browser rather than in Blender, and the
sister of [Phố Báo Sáng](tuoitre-scene.md). Tuổi Trẻ is the morning paper, so it
got a street with notice cases on the walls. CafeF is the money paper, so it
gets the room the money is actually watched in: a Vietnamese brokerage floor.

One wall is a twenty-four-metre **bảng điện**. Facing it, five banked rows of
red chairs, which is how these places really are — people sit there all session.
Down both flanks, eight **dealing bays**, one per section of the site, each a
desk with seven screens over it carrying that section's stories. In the corner
by the doors there is a **coffee counter**, because the paper is named after
one.

Stand in front of a screen and read it; press `E`, or tap it, and the article
opens on cafef.vn.

---

## Why it is not a glb

Same reason as the street's. The content is today: a model exported last night
would be yesterday's session. The scene config exports a `build` hook and
`Viewer` calls that instead of `GLTFLoader` (see the build-hook branch in
`Viewer.start`). `build` returns `{ root, update, pick }`.

## Why it has no loci

A memory palace wants objects that hold still. Today's fourth Chứng khoán story
is a different story tomorrow and VCB closes at a different number, so there is
nothing here to peg. Like the Glacier Deck and Phố Báo Sáng: no pegs, no
badges, no transport bar, free move only. This is the **anti-library** half of
MemoryOS — the half you walk into to find out what you did not know yet.

---

## Layout

```
hall        x ∈ [-22, 22], z ∈ [-40, +12], ceiling at y = 12
board wall  z = -40; its two lit panels at z = -39.5
  header    24 × 2.6 m, the four indices and the session clock
  grid      24 × 6.0 m, sixteen listings, four across and four down
the bank    five tiers, z ∈ [-36, -21], x ∈ [-12, 12], rising 0.45 a tier,
            sixty chairs, a centre aisle 3.2 m wide with steps
walkways    12 < |x| < 20.2
bays        against x = ±22 at z = -34, -25.5, -17, -8.5, paired across
            the room; 4 screens at 2.05 m and 3 above at 3.2 m
counter     x ≈ 16.5, z ≈ 6.5 — the café
ribbon      both side walls at y = 7.6, 20.5 m of scrolling headlines
front       glazed at z = +12, with the city and the hour beyond it
```

Start view: standing in the centre aisle a few steps inside the doors, looking
the length of the hall at the board.

## Files

```
src/scenes/cafef-vn.js          the config: start view, fog, lighting, build hook
src/scenesjs/cafef/
  index.js                      build entry — fetch, then photos, then assemble
  feed.js                       cafef.vn RSS through three relays, raced
  market.js                     the numbers, and the trading clock
  board.js                      the two board canvases + the ribbon line
  hall.js                       the room, the bank, the bays, the counter
  pages.js                      one story = one backlit panel
  life.js                       the people, as many as the hour deserves
  hud.js                        crosshair, reading panel, quote strip
  sky.js                        the hour outside, seen through the glass
tools/cafef.mjs                 refreshes world/cafef.json (news AND board)
world/cafef.json                the fallback edition and the fallback board
```

---

## The feed

Eight sections: Chứng khoán, Doanh nghiệp, Tài chính · Ngân hàng, Bất động
sản, Vĩ mô · Đầu tư, Tài chính quốc tế, Kinh tế số, Smart Money. Seven stories
each, so 56 panels at full strength.

CafeF publishes at `https://cafef.vn/<slug>.rss`. The page cannot fetch that
directly (no `Access-Control-Allow-Origin`), so the same three public relays
Phố Báo Sáng uses are **raced** per section — rss2json, allorigins, codetabs —
and the first usable answer wins. If all three fail the scene falls back to
`world/cafef.json`.

Four things about CafeF's RSS that the street's parser could not have handled:

- **Two-digit years.** `Sun, 13 Sep 26 16:05:00 +0700`. `new Date()` is
  entitled to read that as 1926, so it is parsed by hand.
- **No `<enclosure>`, no `<author>`.** The photo is an `<img>` inside the CDATA
  of `<description>`, ahead of the summary text, so one tag has to yield both
  the picture and the words.
- **Photos are on cafefcdn.com**, a different domain from the articles — so the
  host check allows a second list. It matters: a cross-origin image from a host
  that sends no CORS header taints the canvas and WebGL refuses it as a
  texture, and every panel would be blank.
- **Article ids carry their own timestamp**, like tuoitre's, but behind a
  channel prefix whose length varies by section (`188…`, `4…`). `tsFromLink`
  therefore slides a twelve-digit window along the id and keeps the first
  reading that lands inside the last few weeks.

## The board

Real numbers: **VN-INDEX, VN30, HNX-INDEX, UPCOM** and sixteen of the largest
listings, from VNDirect's public `dchart/history` endpoint — the only free
Vietnamese market series a browser can reach. Each request goes direct first
and through the codetabs relay second, and a symbol that fails both is left off
the board rather than failing the scene.

Colours are the **Vietnamese** convention, not the Western one, and getting
them backwards would read as a crash:

| | |
|---|---|
| green | up |
| red | down |
| yellow | at reference |
| purple | ceiling (≥ +6.5%) |
| cyan | floor (≤ −6.5%) |

Two honesties are built in, because a board that looks live and is not would be
the worst thing this room could be:

1. **The prices are the last completed session's.** The free series is daily
   bars. So the header stamps the bar's own date, and beside it the session
   strip says what the floor is doing *at this minute* — `ATO`, `Phiên sáng`,
   `Nghỉ trưa`, `ATC`, `Đã đóng cửa`, `Nghỉ cuối tuần`.
2. **If the numbers do not come, the board does not pretend.** `market.ok`
   false and the grid draws the newsroom instead — the eight sections, how many
   stories in each, and the freshest headline in it. No blank cells, no zeroes.

## The clock is the scene

`session()` in `market.js` is the cheapest thing here and probably the one that
makes it a place. It drives:

- **how full the bank is** — 8% of the chairs at the weekend, ~70% at 09:30 and
  at the ATC, thinning through nghỉ trưa, nearly empty at seven in the evening;
- **the session strip and the dot** on the board header, green while open;
- **the light through the glass**, which is the hour in Vietnam — the ceiling
  troughs are on whatever the time, because a dealing floor's lights are, but
  at 21:00 the board is the brightest thing in the room and the front rows go
  blue.

Walk in on a Sunday night and it is the board talking to empty chairs.

---

## Gotchas worth keeping

- **The relay that answers an https origin refuses an http one.** allorigins
  will not talk to `http://localhost`, so under `npm run dev` you often get the
  snapshot rather than the live feed. Not a bug; it works on Pages.
- **A bezel drawn *centred* on a lit plane contains it**, and the plane is
  never seen. The ribbon's and the board's surrounds sit behind their planes,
  not around them.
- **`signPlane` only makes vertical planes.** A "stencil on the carpet" laid
  out with it is a card standing half-buried in the floor.
- **The board header runs to within 0.65 m of the ceiling**, so the masthead
  cannot go over the board. It flanks it on the blank returns instead.
- **Point lights, not triangles, are the cost** in a `MeshStandardMaterial`
  room: one light per bay, one for the board's spill, and that is the budget.
- **The in-app preview pane throttles rAF**, so a frame counter there reads
  ~1 fps whatever the scene. Time `renderer.render()` in a loop instead.

## Refreshing the snapshot

```bash
node tools/cafef.mjs            # writes world/cafef.json
node tools/cafef.mjs --print    # writes nothing, shows what it found
```

Node talks to both hosts directly — no relay, no CORS. Like everything under
`world/`, the file is **data**: machine-written, never hand-edited, and nothing
about the room's geometry depends on it.
