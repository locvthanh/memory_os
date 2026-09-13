// One article, one room.
//
// An octagon. You come in through face 0 and the article is straight ahead of
// you on face 4 -- its plate on the wall, its name in brass under it, its
// opening paragraph on the lectern in the middle of the floor. The other six
// faces are doors, one per cross-reference the article reaches for in its own
// first paragraphs, each with the linked subject's name and one-line
// description engraved on the lintel. Walk towards one and the room beyond it
// is fetched and built while you are still crossing the floor.
//
// The room is built in two passes on purpose. `buildChamber` is synchronous:
// geometry and lettering only, so a room exists the instant its text arrives.
// `hydrate()` then fetches the pictures -- the article's own plate and a small
// engraving over each door -- and adds them when they land. A room you have
// already walked into never blocks on an image.
import * as THREE from 'three';
import { Batch, rng } from '../kit.js';
import {
  PAL, facePos, roomShell, sconce, bookcase, brassPlate, pageplate, picture, prism,
  vestibule, threshold, archFrame,
} from './parts.js';
import { loadImage, britannicaUrl } from './wiki.js';

export const N = 8;
export const R = 9.5;
export const H = 6.2;
export const DOOR = { width: 3.4, height: 4.2 };
export const ENTRY_FACE = 0;
export const MURAL_FACE = 4;
export const DOOR_FACES = [1, 2, 3, 5, 6, 7];

/** Where the camera has to get to for a door to count as taken. */
export function doorAnchor(faceIndex) {
  const f = facePos(R, N, faceIndex);
  return new THREE.Vector3(...f.at(1.6, 0, 1.7));
}

export function buildChamber({ article, depth = 1, solid, glow }) {
  const group = new THREE.Group();
  group.name = `chamber:${article.title}`;
  const bat = new Batch();
  const gbat = new Batch();
  const readable = [];
  const disposers = [];

  const openings = new Map();
  openings.set(ENTRY_FACE, DOOR);
  const doors = [];
  article.links.slice(0, DOOR_FACES.length).forEach((link, k) => {
    openings.set(DOOR_FACES[k], DOOR);
    doors.push({ ...link, faceIndex: DOOR_FACES[k] });
  });

  const { r } = roomShell(bat, gbat, { n: N, R, H, openings, seed: depth * 7919 + 13 });

  // --- the far wall: mount, name plate, and a pair of cases flanking it
  const mural = facePos(R, N, MURAL_FACE);
  bat.box(0.3, 4.4, 6.4, PAL.panelDark,
    mural.at(-0.25, 0, 3.5), [0, mural.yaw, 0]);
  const nameplate = brassPlate(5.2, 1.05, article.title,
    article.description || 'no description on file');
  nameplate.position.set(...mural.at(-0.42, 0, 1.05));
  nameplate.rotation.y = Math.PI / 2 - mural.phi + Math.PI;
  nameplate.userData = {
    kind: 'article', title: article.title, url: article.url, site: 'Wikipedia',
  };
  group.add(nameplate);
  readable.push(nameplate);
  disposers.push(nameplate.disposePlate);

  // --- the lectern, dead centre, facing whoever walks in
  const entry = facePos(R, N, ENTRY_FACE);
  prism(bat, 8, 1.5, 0.22, PAL.floorInlay, [0, 0.16, 0]);
  prism(bat, 8, 0.42, 1.0, PAL.panelDark, [0, 0.6, 0]);
  prism(bat, 8, 0.7, 0.12, PAL.brassDark, [0, 1.12, 0]);
  const page = pageplate(3.3, 2.2, {
    title: article.title,
    description: article.description,
    extract: article.extract,
    footer: `depth ${depth}  ·  press E or tap to open the article`,
  });
  page.rotation.order = 'YXZ';
  page.rotation.y = Math.PI / 2 - entry.phi;
  page.rotation.x = -0.85;
  page.position.set(entry.normal[0] * 0.25, 1.9, entry.normal[2] * 0.25);
  page.userData = {
    kind: 'article', title: article.title, url: article.url, site: 'Wikipedia',
  };
  group.add(page);
  readable.push(page);
  disposers.push(page.disposePlate);

  // a brass reading lamp leaning over the page
  sconce(bat, gbat, [entry.normal[0] * 1.0, 1.3, entry.normal[2] * 1.0],
    entry.phi + Math.PI, 0.9);

  // --- the doors: a plate over each opening, a sconce on each pier
  for (const door of doors) {
    const f = facePos(R, N, door.faceIndex);
    const pl = brassPlate(3.1, 0.95, door.title,
      door.description || 'unlabelled — nobody has described it');
    pl.position.set(...f.at(-0.36, 0, DOOR.height + 1.35));
    pl.rotation.y = Math.PI / 2 - f.phi + Math.PI;
    pl.userData = { kind: 'door', door };
    group.add(pl);
    readable.push(pl);
    disposers.push(pl.disposePlate);
    door.plate = pl;
    door.anchor = doorAnchor(door.faceIndex);
    door.dir = new THREE.Vector3(f.normal[0], 0, f.normal[2]);
    // the threshold itself: a brass strip you can see from across the room
    gbat.box(0.7, 0.05, DOOR.width - 0.3, 0xffe1a8, f.at(0, 0, 0.12), [0, f.yaw, 0]);
    const half = (f.width - DOOR.width) / 2;
    sconce(bat, gbat, f.at(-0.4, DOOR.width / 2 + half / 2, 3.1), f.phi + Math.PI);
    sconce(bat, gbat, f.at(-0.4, -(DOOR.width / 2 + half / 2), 3.1), f.phi + Math.PI);

    // the passage behind the door, lit, there from the start
    archFrame(bat, f, DOOR);
    vestibule(bat, gbat, f, DOOR);
    const pane = threshold(f, DOOR.width, DOOR.height);
    pane.userData = { kind: 'door', door };
    group.add(pane);
    readable.push(pane);
    disposers.push(pane.disposePlate);
    door.threshold = pane;
  }

  // --- the entry arch, and bookcases wherever the article ran out of links
  archFrame(bat, entry, DOOR);
  vestibule(bat, gbat, entry, DOOR);
  const entryPlate = brassPlate(2.6, 0.8, 'BACK', 'the way you came in');
  entryPlate.position.set(...entry.at(-0.36, 0, DOOR.height + 1.35));
  entryPlate.rotation.y = Math.PI / 2 - entry.phi + Math.PI;
  group.add(entryPlate);
  disposers.push(entryPlate.disposePlate);

  // The way out to the encyclopedia this scene was asked for. Britannica has
  // no fetchable API and no stable slug we could guess, but its search always
  // resolves a subject and it opens in a real tab, where Cloudflare lets you
  // through and this page never could. One brass plate on the entry pier, so
  // it is the last thing you pass on the way back out.
  const brit = brassPlate(2.0, 0.72, 'BRITANNICA',
    'the modern entry for this subject');
  
  brit.position.set(...entry.at(-0.36, (entry.width - DOOR.width) / 4 + DOOR.width / 2, 2.3));
  brit.rotation.y = Math.PI / 2 - entry.phi + Math.PI;
  brit.userData = {
    kind: 'article', title: article.title, url: britannicaUrl(article.title),
    site: 'Britannica',
  };
  group.add(brit);
  readable.push(brit);
  disposers.push(brit.disposePlate);

  for (const i of DOOR_FACES) {
    if (openings.has(i)) continue;
    bookcase(bat, r, R, N, i, 0, facePos(R, N, i).width - 1.0, 3.4);
    const f = facePos(R, N, i);
    sconce(bat, gbat, f.at(-0.4, 0, 4.3), f.phi + Math.PI);
  }
  bookcase(bat, r, R, N, MURAL_FACE, -(facePos(R, N, MURAL_FACE).width / 2 - 1.1), 1.8, 2.6);
  bookcase(bat, r, R, N, MURAL_FACE, facePos(R, N, MURAL_FACE).width / 2 - 1.1, 1.8, 2.6);

  const solidMesh = bat.build(solid);
  const glowMesh = gbat.build(glow);
  if (solidMesh) group.add(solidMesh);
  if (glowMesh) group.add(glowMesh);

  let hydrated = false;
  async function hydrate() {
    if (hydrated) return;
    hydrated = true;
    const images = await Promise.all([
      loadImage(article.image, 800),
      ...doors.map((d) => loadImage(d.thumb, 400)),
    ]);
    if (!group.parent) return; // the room was disposed while we waited
    const big = picture(5.6, 3.9, images[0]);
    big.position.set(...mural.at(-0.4, 0, 3.6));
    big.rotation.y = Math.PI / 2 - mural.phi + Math.PI;
    big.userData = {
      kind: 'article', title: article.title, url: article.url, site: 'Wikipedia',
    };
    group.add(big);
    readable.push(big);
    disposers.push(big.disposePlate);
    doors.forEach((door, k) => {
      const img = images[k + 1];
      if (!img) return;
      const f = facePos(R, N, door.faceIndex);
      // beside the door, at eye height, not above it: the arch frame and the
      // plate already fill the wall above the opening, and a chamber only has
      // two metres between lintel and ceiling
      const half = (f.width - DOOR.width) / 2;
      const small = picture(1.5, 1.15, img);
      small.position.set(...f.at(-0.38, DOOR.width / 2 + half / 2, 1.9));
      small.rotation.y = Math.PI / 2 - f.phi + Math.PI;
      small.userData = { kind: 'door', door };
      group.add(small);
      readable.push(small);
      disposers.push(small.disposePlate);
    });
  }

  return {
    group,
    doors,
    readable,
    title: article.title,
    depth,
    url: article.url,
    britannica: britannicaUrl(article.title),
    radius: R,
    n: N,
    apothem: R * Math.cos(Math.PI / N),
    height: H,
    hydrate,
    dispose() {
      for (const d of disposers) if (d) d();
      group.traverse((o) => {
        if (o.isMesh && o.geometry && o.geometry !== undefined) o.geometry.dispose();
      });
    },
  };
}
