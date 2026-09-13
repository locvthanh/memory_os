// The Endless Survey — an encyclopedia you walk into.
//
// Asked for as "translate Britannica into a 3D adventure, load from the live
// data". The adventure part is literal: a rotunda of today's anniversaries,
// and a door out of it for every one of them, and six more doors out of every
// room after that, laid out as you go and descending as it goes. You are never
// on rails and you are never finished.
//
// THREE THINGS ARE UNUSUAL ABOUT THIS SCENE:
//
// 1. THERE IS NO GLB — like tuoitre-vn. The world is assembled in the browser
//    while you walk, because it is not a place, it is a reading of whatever the
//    encyclopedia says at the moment you ask. `build` below is the hook Viewer
//    calls instead of loading `model`.
//
// 2. IT IS NOT FINISHED WHEN IT OPENS. Only the rotunda exists at first. Walk
//    up to any arch and that subject is fetched, built and bolted on while you
//    are still crossing the floor. Ten rooms are kept; the furthest dead end
//    behind you is taken down to make space, and rebuilt from scratch — from
//    the encyclopedia as it is THEN — if you walk back that way.
//
// 3. THERE ARE NO LOCI, like glacier-deck and tuoitre-vn. A memory palace
//    needs objects that hold still, and nothing here does: tomorrow the
//    rotunda is a different twelve subjects and the doors lead somewhere else
//    entirely. This is the other half of MemoryOS — the anti-library, the
//    place you go to find out what you did not know yet. Free move only.
//
// ON THE SOURCE: it was meant to be britannica.com, which turns out to be
// unreachable by anything that is not a real browser — Cloudflare's managed
// challenge answers direct fetches, eight different public CORS proxies and
// plain Node alike with "Just a moment..." and a 403. There is no live path to
// it from a static page on GitHub Pages and none from a GitHub Action either.
// So the prose is Wikipedia's, fetched live, and every room still carries a
// brass door out to Britannica's entry for its own subject, which opens in a
// real tab where the challenge passes. See the top of
// src/scenesjs/expedition/wiki.js.
import { build } from '../scenesjs/expedition/index.js';

export default {
  // Standing on the rotunda floor, looking at the oldest anniversary of the
  // day — the first arch — rather than at the middle of the room.
  startView: {
    position: [0, 1.75, 9.5],
    lookAt: [0, 3.2, -6],
  },
  // Lamplight in a windowless building: the dark is the point, and the fog is
  // what makes a corridor you have not taken yet look like it goes somewhere.
  background: 0x0a0805,
  fog: { near: 16, far: 105 },
  lighting: {
    hemisphere: 0.22,
    ambient: 0.56,
    ambientColor: 0xffe2b4,
    sun: 0.18,
    sunPosition: [30, 120, 20],
  },
  // Every room is two merged meshes and there may be a dozen of them spread
  // over 300 metres; one shadow map across that is a smear. The rooms light
  // themselves — see the four lamps that follow you in
  // src/scenesjs/expedition/index.js.
  shadows: false,
  // Rooms are ~19 m across and a corridor is 13 m, so the default 8 u/s is
  // about right; the boost is for getting back up the shaft.
  fly: { speed: 9, boost: 4.5 },
  loci: [],
  build,
};
