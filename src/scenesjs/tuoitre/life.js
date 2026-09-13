// The people on the street.
//
// Deliberately cheap: each person is a handful of boxes merged into ONE mesh
// with baked vertex colours, sharing a single material with everyone else, so
// twenty-odd figures cost twenty draw calls and no skinning. They do two
// things — stand at a notice case reading, or walk the pavement — and both are
// driven by arithmetic in `updateLife` rather than by any animation data.
//
// They matter for the same reason the readers matter in Room OS's plaza: an
// empty street full of today's headlines reads as a mausoleum. One person
// standing in front of a case turns it into somewhere people go.
import * as THREE from 'three';
import { Batch, rng, pick } from './kit.js';
import { KERB, KERB_Y, ROAD } from './street.js';

const SHIRTS = [
  0xb0453c, 0x35618f, 0x3f7a55, 0xb9843a, 0x6b4a86,
  0x2f3b4a, 0xa5563f, 0xd8d2c4, 0x4a7f86, 0x8c3f5a,
];
const SKIN = [0xd2ac86, 0xc49a72, 0xe0bd99, 0xb98a63];
const HAIR = 0x241d17;

function figureMesh(r, material, { hat = false, paper = false } = {}) {
  const B = new Batch();
  const shirt = pick(r, SHIRTS);
  const skin = pick(r, SKIN);
  const h = 1.56 + r() * 0.18;
  const legH = h * 0.47;
  B.box(0.34, legH, 0.24, 0x2f3440, [0, legH / 2, 0]);
  B.box(0.4, h * 0.35, 0.25, shirt, [0, legH + h * 0.175, 0]);
  B.box(0.1, h * 0.3, 0.11, skin, [0.24, legH + h * 0.2, 0.02]);
  B.box(0.1, h * 0.3, 0.11, skin, [-0.24, legH + h * 0.2, 0.02]);
  B.sphere(0.115, skin, [0, h - 0.1, 0]);
  B.sphere(0.125, HAIR, [0, h - 0.055, -0.01], [1, 0.72, 1]);
  if (hat) B.cyl(0.26, 0.04, 0xd9c48a, [0, h + 0.02, 0]); // nón lá, flattened
  if (paper) {
    // a folded paper held up in front — the whole point of the street
    B.box(0.34, 0.26, 0.02, 0xe8e2d2, [0, legH + h * 0.24, 0.19], [-0.25, 0, 0]);
  }
  const mesh = B.build(material);
  mesh.frustumCulled = true;
  mesh.userData.height = h;
  return mesh;
}

/**
 * @param pages the story pages, so readers know where to stand and face.
 */
export function buildLife({ pages, sky }) {
  const r = rng(4711);
  const group = new THREE.Group();
  group.name = 'tuoitre-people';
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.86, metalness: 0,
  });
  const people = [];

  // readers: one in front of roughly every third page
  const spots = pages.filter((_, i) => i % 3 === 1);
  for (const page of spots) {
    const m = figureMesh(r, material, { paper: r() > 0.6 });
    const dz = 1.1 + r() * 0.8;
    m.position.set(page.position.x + (r() - 0.5) * 0.9, 0.14, page.position.z - dz);
    m.rotation.y = Math.PI; // facing the case, which faces -z
    group.add(m);
    people.push({ mesh: m, kind: 'reader', phase: r() * 6.28, base: m.position.y });
  }

  // walkers: up and down both pavements
  for (let i = 0; i < 14; i += 1) {
    const side = i % 2 ? 1 : -1;
    const m = figureMesh(r, material, { hat: r() > 0.78, paper: r() > 0.75 });
    const x = side * (ROAD + 0.8 + r() * (KERB - ROAD - 1.6));
    const z = 12 - r() * 116;
    m.position.set(x, KERB_Y, z);
    group.add(m);
    people.push({
      mesh: m,
      kind: 'walker',
      dir: r() > 0.5 ? 1 : -1,
      speed: 0.7 + r() * 0.55,
      phase: r() * 6.28,
      base: KERB_Y,
    });
  }

  if (sky.night) {
    // fewer people out late — hide a third of the walkers
    let n = 0;
    for (const p of people) {
      if (p.kind === 'walker' && n++ % 3 === 0) p.mesh.visible = false;
    }
  }

  return { group, people };
}

export function updateLife(life, dt, t) {
  for (const p of life.people) {
    const o = p.mesh;
    if (p.kind === 'reader') {
      // weight shifting, and every so often a glance down the case
      o.position.y = p.base + Math.sin(t * 1.3 + p.phase) * 0.012;
      o.rotation.y = Math.PI + Math.sin(t * 0.42 + p.phase) * 0.16;
    } else {
      o.position.z += p.dir * p.speed * dt;
      if (o.position.z > 13) p.dir = -1;
      if (o.position.z < -104) p.dir = 1;
      o.rotation.y = p.dir > 0 ? 0 : Math.PI;
      o.position.y = p.base + Math.abs(Math.sin(t * 5.4 + p.phase)) * 0.03;
    }
  }
}
