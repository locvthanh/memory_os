// The Rotunda of the Day — where every expedition starts.
//
// A twelve-sided drum with an arch in every face. Each arch is one of today's
// anniversaries, in year order clockwise from the oldest, with a glazed case
// standing in front of it holding the year, what happened, and a small
// engraving of the subject. Walk into an arch and that subject's room is
// built beyond it.
//
// The date is read off your clock, and the twelve events come from Wikimedia's
// `onthisday/selected` feed for that date, so the hall is different every day
// and different from the hall anyone else walks into on their own date. If the
// feed cannot be reached the standing exhibition takes its place (see
// wiki.js) — twelve subjects worth a room on any day — and the hall says so.
import * as THREE from 'three';
import { Batch, rng } from '../kit.js';
import {
  PAL, facePos, roomShell, sconce, bookcase, brassPlate, picture, prism, orientedBox,
} from './parts.js';
import { loadImage } from './wiki.js';

export const N = 12;
export const R = 17;
export const H = 9.5;
export const DOOR = { width: 4.0, height: 5.4 };

export function buildRotunda({ day, solid, glow }) {
  const group = new THREE.Group();
  group.name = 'rotunda';
  const bat = new Batch();
  const gbat = new Batch();
  const readable = [];
  const disposers = [];
  const r = rng(20260913);

  const items = day.items.slice(0, N);
  const openings = new Map();
  const doors = [];
  items.forEach((item, k) => {
    openings.set(k, DOOR);
    doors.push({
      title: item.title,
      description: item.description
        || (item.year ? `${item.year < 0 ? `${-item.year} BC` : item.year}` : ''),
      thumb: item.thumb,
      year: item.year,
      text: item.text,
      faceIndex: k,
    });
  });

  roomShell(bat, gbat, {
    n: N, R, H, openings, seed: 4211, carpet: false,
    floorA: PAL.marble, floorB: PAL.marbleDark,
  });

  // --- the drum above the arches, and a dome over that
  for (let ring = 0; ring < 3; ring += 1) {
    prism(bat, N, R - 0.2 - ring * 1.9, 0.55, ring % 2 ? PAL.plasterDark : PAL.plaster,
      [0, H + 0.6 + ring * 1.5, 0]);
  }
  prism(bat, N, R * 0.42, 1.6, PAL.rib, [0, H + 5.4, 0]);
  prism(gbat, N, R * 0.3, 0.3, 0xfff3d6, [0, H + 6.1, 0]); // the oculus

  // --- the centre: a compass rose, a plinth, and the date
  prism(bat, N, 5.2, 0.14, PAL.floorInlay, [0, 0.14, 0]);
  prism(bat, N, 4.9, 0.16, PAL.marbleDark, [0, 0.15, 0]);
  for (let i = 0; i < N; i += 1) {
    const a = (i / N) * Math.PI * 2;
    orientedBox(bat, [0, 0.24, 0], [Math.cos(a) * 4.8, 0.24, Math.sin(a) * 4.8],
      0.16, 0.08, PAL.brass);
  }
  prism(bat, 8, 1.9, 0.5, PAL.marble, [0, 0.4, 0]);
  prism(bat, 8, 1.5, 1.1, PAL.panelDark, [0, 1.1, 0]);
  prism(bat, 8, 1.8, 0.16, PAL.brassDark, [0, 1.72, 0]);
  gbat.sphere(0.46, 0xffd9a0, [0, 2.55, 0]);
  bat.cyl(0.09, 1.0, PAL.brass, [0, 2.1, 0]);

  const stale = day.source !== 'live';
  const datePlate = brassPlate(3.6, 1.5,
    day.label.toUpperCase(),
    stale ? 'the standing exhibition — the day could not be read'
      : `${items.length} anniversaries drawn this morning`,
    { px: 760, py: 320 });
  datePlate.position.set(0, 1.95, 0);
  datePlate.rotation.x = -Math.PI / 2;
  datePlate.rotation.z = Math.PI;
  group.add(datePlate);
  disposers.push(datePlate.disposePlate);

  // --- each arch: a case in front of it and a plate above it
  for (const door of doors) {
    const f = facePos(R, N, door.faceIndex);
    const yearLabel = door.year
      ? (door.year < 0 ? `${-door.year} BC` : String(door.year))
      : '';
    const plate = brassPlate(3.6, 1.1,
      `${yearLabel ? `${yearLabel} · ` : ''}${door.title}`,
      door.text || door.description || '');
    plate.position.set(...f.at(-0.36, 0, DOOR.height + 0.85));
    plate.rotation.y = Math.PI / 2 - f.phi + Math.PI;
    plate.userData = { kind: 'door', door };
    group.add(plate);
    readable.push(plate);
    disposers.push(plate.disposePlate);
    door.plate = plate;
    door.anchor = new THREE.Vector3(...f.at(1.4, 0, 1.7));
    door.dir = new THREE.Vector3(f.normal[0], 0, f.normal[2]);

    // a glazed case standing a little in front of the arch
    bat.box(1.0, 1.05, 2.6, PAL.panelDark, f.at(-2.6, 0, 0.52), [0, f.yaw, 0]);
    bat.box(1.1, 0.1, 2.8, PAL.brassDark, f.at(-2.6, 0, 1.08), [0, f.yaw, 0]);
    gbat.box(0.9, 0.06, 2.4, 0x9fd8e8, f.at(-2.58, 0, 1.14), [0, f.yaw, 0]);
    sconce(bat, gbat, f.at(-0.4, DOOR.width / 2 + 0.9, 3.6), f.phi + Math.PI, 1.1);
    sconce(bat, gbat, f.at(-0.4, -(DOOR.width / 2 + 0.9), 3.6), f.phi + Math.PI, 1.1);
    gbat.box(0.8, 0.05, DOOR.width - 0.3, 0xffe1a8, f.at(0, 0, 0.12), [0, f.yaw, 0]);
  }

  for (let i = doors.length; i < N; i += 1) {
    bookcase(bat, r, R, N, i, 0, facePos(R, N, i).width - 1.4, 4.2);
    const f = facePos(R, N, i);
    sconce(bat, gbat, f.at(-0.4, 0, 5.2), f.phi + Math.PI);
  }

  const solidMesh = bat.build(solid);
  const glowMesh = gbat.build(glow);
  if (solidMesh) group.add(solidMesh);
  if (glowMesh) group.add(glowMesh);

  let hydrated = false;
  async function hydrate() {
    if (hydrated) return;
    hydrated = true;
    const images = await Promise.all(doors.map((d) => loadImage(d.thumb, 480)));
    if (!group.parent) return;
    doors.forEach((door, k) => {
      const img = images[k];
      if (!img) return;
      const f = facePos(R, N, door.faceIndex);
      const card = picture(2.0, 1.5, img);
      card.position.set(...f.at(-2.52, 0, 1.9));
      card.rotation.order = 'YXZ';
      card.rotation.y = Math.PI / 2 - f.phi + Math.PI;
      card.rotation.x = -0.55;
      card.userData = { kind: 'door', door };
      group.add(card);
      readable.push(card);
      disposers.push(card.disposePlate);
    });
  }

  return {
    group,
    doors,
    readable,
    title: `On this day — ${day.label}`,
    depth: 0,
    url: 'https://en.wikipedia.org/wiki/Wikipedia:On_this_day',
    radius: R,
    n: N,
    apothem: R * Math.cos(Math.PI / N),
    height: H,
    hydrate,
    dispose() {
      for (const d of disposers) if (d) d();
    },
  };
}
