// The people on the floor.
//
// Same trick as the street's: each person is a handful of boxes merged into
// ONE mesh with baked vertex colours, sharing a single material, so forty-odd
// figures cost forty draw calls and no skinning at all.
//
// What is different here is that HOW MANY of them there are is not a constant.
// It comes off the trading clock in market.js: the bank is full at 09:30 and
// at 14:40, thinning through nghỉ trưa, nearly empty by seven in the evening
// and empty at the weekend, when the room is the board talking to the chairs.
// That is the single cheapest thing this scene does and probably the one that
// makes it feel like a place — a floor that is always packed is a diorama.
import * as THREE from 'three';
import { Batch, rng, pick } from '../kit.js';
import { HALL } from './hall.js';

const SHIRTS = [
  0x2f3b4a, 0x3d5a80, 0x4a5568, 0x7c3f3a, 0x365b4c,
  0xd8d2c4, 0x5d4a6b, 0x8a6a3a, 0x2b4f63, 0x6b3f4a,
];
const SKIN = [0xd2ac86, 0xc49a72, 0xe0bd99, 0xb98a63];
const HAIR = 0x241d17;

function bodyParts(B, r, { seated }) {
  const shirt = pick(r, SHIRTS);
  const skin = pick(r, SKIN);
  const h = 1.56 + r() * 0.18;

  if (seated) {
    // thighs forward, shins down, torso upright — enough to read as sitting
    const hip = 0.46;
    B.box(0.36, 0.2, 0.46, 0x2f3440, [0, hip, 0.16]);         // thighs
    B.box(0.34, 0.44, 0.16, 0x2f3440, [0, hip - 0.22, 0.36]); // shins
    B.box(0.4, h * 0.36, 0.26, shirt, [0, hip + 0.28, 0]);    // torso
    B.box(0.1, 0.3, 0.1, skin, [0.24, hip + 0.3, 0.1]);
    B.box(0.1, 0.3, 0.1, skin, [-0.24, hip + 0.3, 0.1]);
    B.sphere(0.115, skin, [0, hip + 0.58, 0]);
    B.sphere(0.125, HAIR, [0, hip + 0.63, -0.01], [1, 0.72, 1]);
    return h;
  }

  const legH = h * 0.47;
  B.box(0.34, legH, 0.24, 0x2f3440, [0, legH / 2, 0]);
  B.box(0.4, h * 0.35, 0.25, shirt, [0, legH + h * 0.175, 0]);
  B.box(0.1, h * 0.3, 0.11, skin, [0.24, legH + h * 0.2, 0.02]);
  B.box(0.1, h * 0.3, 0.11, skin, [-0.24, legH + h * 0.2, 0.02]);
  B.sphere(0.115, skin, [0, h - 0.1, 0]);
  B.sphere(0.125, HAIR, [0, h - 0.055, -0.01], [1, 0.72, 1]);
  return h;
}

function figureMesh(r, material, opts = {}) {
  const B = new Batch();
  const h = bodyParts(B, r, opts);
  if (opts.phone) {
    // a phone held up at chest height, which on a trading floor is everyone
    B.box(0.09, 0.16, 0.02, 0x1a1f26, [0.1, (opts.seated ? 0.76 : h * 0.72), 0.22]);
  }
  const mesh = B.build(material);
  mesh.frustumCulled = true;
  mesh.userData.height = h;
  return mesh;
}

/**
 * @param seats  from buildHall — every chair in the bank
 * @param pages  the story screens, so a few people stand and read them
 * @param market carries `session`, which decides how full the room is
 */
export function buildLife({ seats, pages, sky, market }) {
  const r = rng(20260914);
  const group = new THREE.Group();
  group.name = 'cafef-people';
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.86, metalness: 0,
  });
  const people = [];

  const heat = market?.session?.heat ?? 0.5;
  const fill = 0.08 + heat * 0.62;

  /* ---- the bank: the ones who sit all session */
  for (const s of seats) {
    if (r() > fill) continue;
    const m = figureMesh(r, material, { seated: true, phone: r() > 0.72 });
    m.position.set(s.x, s.y - 0.44, s.z + 0.04);
    m.rotation.y = Math.PI; // every chair in the room faces the board
    group.add(m);
    people.push({
      mesh: m, kind: 'sitter', phase: r() * 6.28, base: m.position.y,
    });
  }

  /* ---- the bays: someone reading the screens */
  const spots = pages.filter((_, i) => i % 4 === 1);
  for (const page of spots) {
    if (r() > 0.36 + heat * 0.3) continue;
    const side = Math.sign(page.position.x) || 1;
    const m = figureMesh(r, material, { phone: r() > 0.6 });
    m.position.set(side * (HALL.X - 2.4 - r() * 0.8), 0, page.position.z + (r() - 0.5) * 0.8);
    m.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(m);
    people.push({
      mesh: m, kind: 'reader', phase: r() * 6.28, base: 0, yaw: m.rotation.y,
    });
  }

  /* ---- the walkways: people crossing between the bays and the bank */
  for (let i = 0; i < 10; i += 1) {
    const side = i % 2 ? 1 : -1;
    const m = figureMesh(r, material, { phone: r() > 0.7 });
    const x = side * (HALL.X - 3.2 - r() * 3.2);
    m.position.set(x, 0, -36 + r() * 44);
    group.add(m);
    people.push({
      mesh: m,
      kind: 'walker',
      dir: r() > 0.5 ? 1 : -1,
      speed: 0.75 + r() * 0.6,
      phase: r() * 6.28,
      base: 0,
    });
    if (!market?.session?.open && r() > 0.45) m.visible = false;
  }

  /* ---- the counter: two people who have stopped watching */
  for (let i = 0; i < 2; i += 1) {
    const m = figureMesh(r, material, { seated: true });
    m.position.set(14.5 + i * 2.6, 0.24, 8.0);
    m.rotation.y = Math.PI;
    group.add(m);
    people.push({ mesh: m, kind: 'sitter', phase: r() * 6.28, base: m.position.y });
  }

  return { group, people };
}

export function updateLife(life, dt, t) {
  for (const p of life.people) {
    const o = p.mesh;
    if (p.kind === 'sitter') {
      // the small restlessness of watching a number that will not move
      o.position.y = p.base + Math.sin(t * 1.1 + p.phase) * 0.008;
      o.rotation.y = Math.PI + Math.sin(t * 0.33 + p.phase) * 0.1;
    } else if (p.kind === 'reader') {
      o.position.y = p.base + Math.sin(t * 1.3 + p.phase) * 0.012;
      o.rotation.y = p.yaw + Math.sin(t * 0.4 + p.phase) * 0.14;
    } else {
      o.position.z += p.dir * p.speed * dt;
      if (o.position.z > 9) p.dir = -1;
      if (o.position.z < -37) p.dir = 1;
      o.rotation.y = p.dir > 0 ? 0 : Math.PI;
      o.position.y = p.base + Math.abs(Math.sin(t * 5.2 + p.phase)) * 0.03;
    }
  }
}
