# The Endless Survey

**Scene id:** `endless-survey` · **Kind:** 3D, no model · **Loci:** none (free move only)

An encyclopedia you walk into, built while you walk it.

## What it is

A twelve-sided rotunda holds today's anniversaries — the date read off your own
clock, the events fetched while the page opens — one glazed case and one arch
each, oldest first, clockwise. Walk into an arch and that subject's room is
fetched and built beyond it while you are still crossing the floor: an octagon
with the article's picture on the far wall, its name in brass under that, its
opening paragraph on a lectern in the middle of the floor, and six more doors
around it — one for each cross-reference the article reaches for in its own
first paragraphs, each labelled with that subject's name and one-line
description. Those rooms have six doors of their own. Each level sits 2.4 m
lower than the one before, so the survey reads as a descent.

Nothing is baked. There is no `.glb`, no committed snapshot of the text, no
nightly job. Tomorrow the rotunda is a different twelve subjects and the doors
lead somewhere else entirely.

## Why Wikipedia and not Britannica

The scene was asked for as Britannica. britannica.com sits behind a Cloudflare
*managed challenge*: every request that is not a real browser running JavaScript
gets `Just a moment...` and a 403. Measured, not assumed — direct fetch from the
page, eight different public CORS proxies (allorigins, codetabs, corsproxy.io,
cors.lol, thingproxy, whateverorigin, corsfix, isomorphic-git), and plain Node
on a residential IP with a Chrome user-agent, all 403. There is therefore no
live path to britannica.com from a static page on GitHub Pages, and none from a
GitHub Action either.

Wikipedia's APIs are built to be called from a browser: `Access-Control-Allow-Origin`
on everything, no key, and CORS-clean thumbnails — which matters more than it
sounds, because a cross-origin image without those headers taints the canvas and
WebGL refuses to upload it as a texture, leaving every mural blank.

So the prose is Wikipedia's, and **every room carries a brass plate on its entry
pier that opens Britannica's entry for the same subject in a real tab**, where
the challenge passes.

## The data (`src/scenesjs/expedition/wiki.js`)

Three requests build one room:

1. `REST /page/summary/<title>` — title, one-line description, lead paragraph,
   picture.
2. `action=parse&prop=text&section=0` — the lead HTML, read **only** for its
   links, in order. `prop=links` would be one less parse, but MediaWiki returns
   those alphabetically and alphabetical cross-references are not a route
   through anything. The first links of the opening paragraphs are what the
   article itself reaches for first, so those are the doors.
3. one batched `action=query&prop=description|pageimages` over those link
   titles, so every door is labelled and engraved before you reach it.

The rotunda uses `api.wikimedia.org/feed/v1/wikipedia/en/onthisday/**selected**`
— `all` is 1.7 MB of every birth and death on record and the hall has twelve
cases.

Things learned the hard way, all of them still load-bearing:

- **Rate limiting is real.** Anonymous cross-origin callers earn a 429 quickly,
  and a 429 storm leaves the world black. Everything goes through one queue —
  two in flight, 120 ms apart, three retries with a widening gap — and every
  answer is cached by URL for the life of the page, which is what makes walking
  back up the shaft free.
- **`Api-User-Agent` is worth the preflight.** The same feed request took
  2057 ms without it and 289 ms with it.
- **A 404 is not a 429.** A missing article bricks the door up for good; a
  timeout or an exhausted retry just sets a six-second cooldown, so walking up
  to the door again tries again.
- **You cannot rewrite a thumbnail to any width.** `…/330px-X.jpg` → `…/800px-X.jpg`
  is a real Wikimedia URL form and it is instant when the thumbnailer has that
  size — and a flat 404 when it does not, which is what left the first murals
  reading NO PLATE ENGRAVED. `loadImage` now tries the rewritten width, then
  weserv (which resizes anything, in about a second), then the original 330.

## The building (`src/scenesjs/expedition/`)

| file | what it is |
| --- | --- |
| `wiki.js` | the live encyclopedia: the queue, the cache, the three calls, the images |
| `parts.js` | the kit — `facePos` is the whole coordinate system, plus the room shell, sconces, bookcases and every readable plate |
| `rotunda.js` | the Rotunda of the Day |
| `chamber.js` | one article, one octagon |
| `hud.js` | crosshair, what is under it, the trail |
| `index.js` | the delving: placement, corridors, the lamps that follow you, pruning |

A room is a polygon and everything in it is placed by (face index, offset along
that face, height) — `facePos(R, n, i, s, y)` in `parts.js`. Rooms are octagons
and the rotunda is a twelve-sided drum; nothing else cares which.

Everything static is pushed into a `Batch` (`src/scenesjs/kit.js`, promoted out
of `tuoitre/` when this scene needed it — `tuoitre/kit.js` is now a re-export)
and comes out as **two merged meshes per room**, solid and glow, because a room
is roughly five hundred little boxes and a dozen rooms may be open at once. Only
the things that have to be *read* are real meshes: door plates, the lectern
page, the mural, the Britannica plate. Those are what the crosshair raycasts
against.

Rooms are built in two passes. `buildChamber` is synchronous — geometry and
lettering only — so a room exists the instant its text arrives; `hydrate()` then
fetches the pictures and adds them when they land. A room you have already
walked into never blocks on an image.

### Placement

Placement walks outward from the door in 7 m steps until the new room clears
everything already standing, and gives up (the door is sealed, and says so)
rather than overlap. Ten rooms are kept: cross that and the furthest dead-end
room behind you — never the rotunda, never a junction, never one within 40 m —
is disposed and its door closes again. Walk back and it is rebuilt, from the
encyclopedia as it is *then*.

Four `PointLight`s are pooled and re-aimed at the four nearest rooms every sixth
frame. That is the whole lighting rig; `shadows: false`, because one shadow map
over three hundred metres of tunnel is a smear.

### A trap worth remembering

`plate()` used to hang its disposer on `mesh.userData.dispose`. Every caller
then overwrote `userData` wholesale with what the crosshair needs to read, so
the disposer was silently thrown away and every canvas leaked on every room
taken down. It lives on `mesh.disposePlate` now.

## Controls

Free move / fly only — the viewer hides the transport bar and the locus panel
when a scene has no loci. Walk within 7.5 m of a door and it opens itself; or
aim at it and press **E**, or tap it. Aim at the lectern, the nameplate or the
mural and press **E** to open the article on Wikipedia; aim at the BRITANNICA
plate by the entry for Britannica's own entry.
