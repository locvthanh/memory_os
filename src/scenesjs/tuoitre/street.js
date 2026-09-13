// Phố Báo Sáng — the street itself.
//
// A Saigon shophouse street a hundred metres long, running north from the
// newspaper stall at its mouth. Eight alleys open off it, one per section of
// the paper, each with a painted gate and a glazed notice case down its wall
// holding that section's stories. Everything static in here is pushed into two
// merged meshes (see kit.js Batch), so the whole street costs two draw calls.
//
// Fixed dimensions, because a lot of things have to agree about them:
//   roadway   x ∈ [-4, 4]        kerb top y = 0.14
//   pavement  x ∈ [±4, ±7.4]
//   frontage  |x| = 7.4          lane depth to |x| = 30.4
//   street    z ∈ [-108, +16], the mouth at the south end, +z behind you
import * as THREE from 'three';
import { Batch, rng, pick, canvas, canvasTexture, FONT, PLANE } from './kit.js';
import { makePage, PAGE_W, PAGE_H } from './pages.js';
import { vnDateLine } from './feed.js';

export const ROAD = 4;
export const KERB = 7.4;
export const KERB_Y = 0.14;
const LANE_HALF = 3.2;
const LANE_X0 = 9.4;   // first page, measured out from the street centreline
const LANE_GAP = 2.9;  // page pitch down the wall
const Z_SOUTH = 16;
const Z_NORTH = -108;

// Which section opens where. Alternating sides so the walk keeps turning.
const LANE_Z = [-8, -20, -32, -44, -56, -68, -80, -92];
const LANE_SIDE = [-1, 1, -1, 1, -1, 1, -1, 1];

const WALL_COLOURS = [
  0xe8d9b8, 0xd9c6a2, 0xcfd8c4, 0xbfd0c8, 0xe4c7b4,
  0xd8bfa8, 0xc9cdd6, 0xe6d3c0, 0xc6b79a, 0xd5c9b0,
];
const SHUTTER = [0x4a6b6a, 0x6b4a3f, 0x3f5470, 0x7a5a3a, 0x4f5b46];
const ROOF = 0x8a7a68;

/* ------------------------------------------------------------------ paving */

function roadTexture() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#45443f';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i += 1) {
    const v = 0.8 + Math.random() * 0.45;
    g.fillStyle = `rgba(${Math.round(90 * v)},${Math.round(88 * v)},${Math.round(82 * v)},.5)`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  // patched repairs
  for (let i = 0; i < 5; i += 1) {
    g.fillStyle = `rgba(30,29,27,${0.1 + Math.random() * 0.12})`;
    g.fillRect(Math.random() * 200, Math.random() * 200, 30 + Math.random() * 60, 20 + Math.random() * 50);
  }
  return canvasTexture(c, { repeat: [3, 40] });
}

function paveTexture() {
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#a89f90';
  g.fillRect(0, 0, 256, 256);
  const r = rng(7);
  for (let row = 0; row < 8; row += 1) {
    for (let k = -1; k < 9; k += 1) {
      const off = (row % 2) * 16;
      const v = 0.88 + r() * 0.18;
      g.fillStyle = `rgb(${Math.round(168 * v)},${Math.round(159 * v)},${Math.round(144 * v)})`;
      g.fillRect(k * 32 + off + 1, row * 32 + 1, 30, 30);
    }
  }
  return canvasTexture(c, { repeat: [1.4, 22] });
}

/* ------------------------------------------------------------------ signage */

function signTexture(text, color, sub) {
  const c = canvas(512, 128);
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.fillRect(0, 0, 512, 128);
  g.fillStyle = 'rgba(255,255,255,.14)';
  g.fillRect(0, 0, 512, 8);
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `700 ${sub ? 52 : 62}px ${FONT}`;
  g.fillText(text, 256, sub ? 52 : 64);
  if (sub) {
    g.font = `500 26px ${FONT}`;
    g.fillStyle = 'rgba(255,255,255,.72)';
    g.fillText(sub, 256, 98);
  }
  return canvasTexture(c, { anisotropy: 8 });
}

function signPlane(tex, w, h, position, yaw, { lit = false } = {}) {
  const mat = lit
    ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })
    : new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.8, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.12,
    });
  const m = new THREE.Mesh(PLANE, mat);
  m.scale.set(w, h, 1);
  m.position.set(position[0], position[1], position[2]);
  m.rotation.y = yaw;
  return m;
}

/* ------------------------------------------------------------------ blocks */

function shophouse(B, { side, z0, z1, r, sky }) {
  const w = z1 - z0;
  const zc = (z0 + z1) / 2;
  const storeys = 2 + Math.floor(r() * 3);
  const sh = 3.15;
  const h = storeys * sh;
  const depth = 9 + r() * 3;
  const xf = side * KERB; // frontage
  const xc = side * (KERB + depth / 2);
  const wall = pick(r, WALL_COLOURS);
  const trim = pick(r, SHUTTER);

  B.box(depth, h, w, wall, [xc, h / 2, zc]);
  // parapet + a tiled cornice
  B.box(depth + 0.3, 0.42, w + 0.18, ROOF, [xc, h + 0.2, zc]);
  B.box(depth + 0.5, 0.16, w + 0.3, 0xb9a288, [xc, h - 0.06, zc]);
  // water tank + aerial clutter on the roof
  if (r() > 0.4) {
    B.cyl(0.42, 0.9, 0x7e8fa0, [xc + (r() - 0.5) * 3, h + 0.9, zc + (r() - 0.5) * (w - 1)]);
  }
  if (r() > 0.6) {
    B.box(0.06, 2.4, 0.06, 0x3a3a3a, [xc - side * 1.2, h + 1.6, zc + (r() - 0.5) * w]);
  }

  // ground floor: a recessed shopfront with a roll-up shutter and an awning
  const openW = Math.min(w - 1.2, 3.4);
  B.box(0.3, 3.0, w, 0x6a5f52, [xf - side * 0.14, 1.5, zc]); // plinth face
  B.box(0.22, 2.5, openW, sky.night ? 0x241f1a : 0x2b2620, [xf - side * 0.2, 1.35, zc]);
  if (r() > 0.45) {
    // lit interior
    B.box(0.06, 1.9, openW - 0.5, sky.night ? 0xffd89a : 0x6d6154,
      [xf - side * 0.26, 1.45, zc]);
  }
  // awning, striped
  const aw = 1.5;
  B.box(aw, 0.08, w - 0.5, pick(r, [0xb8453c, 0x2f6b8f, 0x3f7a55, 0xc98a2e]),
    [xf - side * (aw / 2 + 0.05), 3.05, zc], [0, 0, side * 0.16]);
  B.box(0.09, 0.34, w - 0.5, 0xe8e2d4, [xf - side * (aw + 0.02), 2.82, zc]);

  // hand-painted sign board over the shopfront
  B.box(0.16, 0.72, w - 0.7, trim, [xf - side * 0.1, 3.5, zc]);

  // upper floors: shuttered windows, a balcony on the first
  for (let s = 1; s < storeys; s += 1) {
    const y = s * sh;
    const n = Math.max(1, Math.round(w / 2.2));
    for (let i = 0; i < n; i += 1) {
      const zz = z0 + (w * (i + 0.5)) / n;
      B.box(0.2, 1.5, 1.0, 0x2a2721, [xf - side * 0.06, y + 1.5, zz]); // opening
      B.box(0.12, 1.62, 1.14, trim, [xf - side * 0.14, y + 1.5, zz]); // frame
      if (sky.night && r() > 0.45) {
        B.box(0.05, 1.3, 0.86, 0xffd9a0, [xf - side * 0.2, y + 1.5, zz]);
      }
      if (r() > 0.7) {
        // a shutter half closed
        B.box(0.08, 0.7, 1.0, trim, [xf - side * 0.2, y + 2.0, zz]);
      }
    }
    if (s === 1) {
      B.box(0.9, 0.09, w - 0.4, 0xcfc3ad, [xf - side * 0.45, y + 0.1, zc]);
      for (let i = 0; i <= Math.round(w * 2); i += 1) {
        B.box(0.05, 0.9, 0.05, trim, [xf - side * 0.85, y + 0.55, z0 + i * 0.5]);
      }
      B.box(0.05, 0.06, w - 0.4, trim, [xf - side * 0.85, y + 1.0, zc]);
      // potted plants and drying laundry, the two things always on a balcony
      if (r() > 0.35) {
        const pz = z0 + 0.6 + r() * (w - 1.2);
        B.box(0.3, 0.3, 0.3, 0xa9603f, [xf - side * 0.5, y + 0.25, pz]);
        B.sphere(0.3, 0x4e7a41, [xf - side * 0.5, y + 0.6, pz], [1, 0.8, 1]);
      }
      if (r() > 0.5) {
        for (let i = 0; i < 3; i += 1) {
          B.box(0.03, 0.62, 0.42, pick(r, [0xd8d2c4, 0x7a94b8, 0xb8746a, 0x6f8f72]),
            [xf - side * 0.78, y + 0.62, z0 + 0.9 + i * 0.55]);
        }
      }
    }
  }
}

function buildingRun(B, { side, z0, z1, r, sky }) {
  let z = z0;
  while (z < z1 - 1.5) {
    const w = Math.min(z1 - z, 3.8 + r() * 2.6);
    shophouse(B, { side, z0: z, z1: z + w, r, sky });
    z += w;
  }
}

/** A blank block across the street, closing the view at either end. `face` is
 *  the z direction the lit side looks toward (+1 = south, back down the street). */
function crossBlock(B, { z, r, sky, depth = 12, face = 1 }) {
  for (let x = -28; x < 28;) {
    const w = 3.4 + r() * 2.4;
    const h = 7 + r() * 9;
    B.box(w, h, depth, pick(r, WALL_COLOURS), [x + w / 2, h / 2, z]);
    B.box(w + 0.25, 0.36, depth + 0.3, ROOF, [x + w / 2, h + 0.18, z]);
    if (sky.night && r() > 0.4) {
      B.box(w * 0.7, h * 0.6, 0.06, 0xffd9a0,
        [x + w / 2, h * 0.5, z + face * (depth / 2 + 0.04)]);
    }
    x += w + 0.6 + r() * 1.4;
  }
}

/* ------------------------------------------------------------------ street */

function tree(B, x, z, r) {
  const h = 4.2 + r() * 1.8;
  B.cyl(0.17, h, 0x5c4a38, [x, h / 2 + KERB_Y, z]);
  B.box(0.6, 0.5, 0.6, 0x6b6257, [x, KERB_Y + 0.08, z]); // tree pit kerb
  const leaf = [0x3f6b35, 0x4a7a3c, 0x37622f][Math.floor(r() * 3)];
  for (let i = 0; i < 5; i += 1) {
    const a = r() * Math.PI * 2;
    const rr = r() * 1.1;
    B.sphere(1.25 + r() * 0.5, leaf,
      [x + Math.cos(a) * rr, h + 0.5 + r() * 0.9, z + Math.sin(a) * rr],
      [1, 0.78, 1]);
  }
}

// `lit` decides whether this lamp also gets a real point light. Most do not:
// a MeshStandardMaterial shader pays for every light in the scene at every
// fragment, and a street this long wants twenty lamps, which is a phone-killer
// for no visible gain. The glowing head is free; the pool of light is not.
function lamp(B, G, x, z, side, sky, lights, lit) {
  const h = 5.0;
  B.cyl(0.09, h, 0x4a4f52, [x, h / 2 + KERB_Y, z]);
  B.strut([x, h + KERB_Y, z], [x - side * 1.3, h + 0.42 + KERB_Y, z], 0.08, 0x4a4f52);
  const hx = x - side * 1.35;
  const hy = h + 0.36 + KERB_Y;
  B.box(0.44, 0.12, 0.3, 0x3d4245, [hx, hy + 0.08, z]);
  G.box(0.38, 0.1, 0.26, sky.night ? 0xffeec2 : 0xbfc4c0, [hx, hy, z]);
  if (sky.night && lit) {
    const pl = new THREE.PointLight(0xffdca8, 16, 21, 2);
    pl.position.set(hx, hy - 0.2, z);
    lights.add(pl);
  }
}

function powerPole(B, x, z, sky) {
  const h = 8.2;
  B.cyl(0.15, h, 0x8d8881, [x, h / 2 + KERB_Y, z]);
  for (const y of [6.4, 7.1, 7.7]) {
    B.box(1.5, 0.08, 0.08, 0x6f6a63, [x, y, z]);
  }
  B.box(0.34, 0.5, 0.34, 0x50565c, [x, 5.4, z]); // a transformer box
  if (sky.night) B.box(0.2, 0.2, 0.2, 0x9aa0a6, [x, 5.0, z]);
}

function cables(B, x, z0, z1, r) {
  // The famous tangle. Three runs with different sag, plus a couple of strays.
  for (let i = 0; i < 3; i += 1) {
    const y = [6.4, 7.1, 7.7][i];
    const off = (i - 1) * 0.55;
    const sag = 0.5 + r() * 0.5;
    const steps = 6;
    let prev = [x + off, y, z0];
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      const zz = z0 + (z1 - z0) * t;
      const yy = y - Math.sin(t * Math.PI) * sag;
      const p = [x + off, yy, zz];
      B.strut(prev, p, 0.05, 0x1f1f22);
      prev = p;
    }
  }
  if (r() > 0.5) {
    B.strut([x, 6.9, z0], [x, 5.2, z0 + (z1 - z0) * (0.2 + r() * 0.5)], 0.04, 0x1f1f22);
  }
}

function motorbike(B, x, z, yaw, r) {
  const col = pick(r, [0xb03a2e, 0x2e4053, 0xd4d4d4, 0x1c2833, 0x7d6608, 0x2e7d55]);
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const at = (dx, dz, y) => [x + dx * c - dz * s, y, z + dx * s + dz * c];
  B.box(0.42, 0.28, 1.5, col, at(0, 0, 0.62 + KERB_Y), [0, yaw, 0]);
  B.box(0.5, 0.22, 0.5, 0x2b2b2b, at(0, -0.42, 0.78 + KERB_Y), [0, yaw, 0]);
  B.cyl(0.26, 0.12, 0x222222, at(0, 0.66, 0.26 + KERB_Y), [0, yaw, Math.PI / 2]);
  B.cyl(0.26, 0.12, 0x222222, at(0, -0.66, 0.26 + KERB_Y), [0, yaw, Math.PI / 2]);
  B.box(0.62, 0.06, 0.08, 0x555555, at(0, 0.58, 0.98 + KERB_Y), [0, yaw, 0]);
  B.box(0.24, 0.2, 0.14, 0xd8d8d0, at(0, 0.76, 0.86 + KERB_Y), [0, yaw, 0]);
}

function cafeCluster(B, x, z, r) {
  // cà phê vỉa hè: a low table, four plastic stools, a tin ashtray.
  B.cyl(0.34, 0.42, 0xd0cabc, [x, 0.21 + KERB_Y, z]);
  B.cyl(0.36, 0.05, 0xb8b2a4, [x, 0.44 + KERB_Y, z]);
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2 + r();
    const sx = x + Math.cos(a) * 0.95;
    const sz = z + Math.sin(a) * 0.95;
    const col = pick(r, [0xc0392b, 0x2471a3, 0x1e8449, 0xd68910]);
    B.cyl(0.17, 0.3, col, [sx, 0.15 + KERB_Y, sz]);
    B.cyl(0.19, 0.04, col, [sx, 0.32 + KERB_Y, sz]);
  }
  B.cyl(0.09, 0.04, 0x8d8d8d, [x + 0.1, 0.48 + KERB_Y, z + 0.05]);
  // a glass of cà phê đá on the table
  B.cyl(0.05, 0.14, 0x3a2a1c, [x - 0.12, 0.53 + KERB_Y, z - 0.08]);
}

/* ------------------------------------------------------------------ props */

function newsStall(B, G, sky, data, group) {
  // The sạp báo at the mouth of the street: a corrugated stall with the
  // masthead over it and the day's papers stacked on the counter.
  const x = 5.7;
  const z = 7.5;
  B.box(2.6, 0.9, 3.6, 0x8a6f52, [x, 0.45 + KERB_Y, z]); // counter
  B.box(2.7, 0.1, 3.7, 0x6d573f, [x, 0.95 + KERB_Y, z]);
  for (const p of [-1.2, -0.4, 0.4, 1.2]) {
    for (let k = 0; k < 3; k += 1) {
      B.box(0.7, 0.05, 0.5, k % 2 ? 0xe8e2d2 : 0xdcd4c0,
        [x - 0.5 + (k % 2) * 0.1, 1.02 + KERB_Y + k * 0.055, z + p]);
    }
  }
  // posts + corrugated roof
  for (const dx of [-1.2, 1.2]) {
    for (const dz of [-1.7, 1.7]) {
      B.cyl(0.06, 2.6, 0x6f6a60, [x + dx, 1.3 + KERB_Y, z + dz]);
    }
  }
  for (let i = 0; i < 9; i += 1) {
    B.box(3.0, 0.06, 0.38, i % 2 ? 0x9aa3a8 : 0x889297,
      [x, 2.66 + KERB_Y + (i % 2) * 0.03, z - 1.75 + i * 0.44], [0, 0, -0.07]);
  }
  // masthead
  const tex = signTexture(data.title, '#0b2f6b', data.site);
  group.add(signPlane(tex, 2.9, 0.72, [x - 1.28, 2.35 + KERB_Y, z], -Math.PI / 2, { lit: true }));
  // a rack of papers hanging on a wire beside it, which is how they are sold
  B.strut([x - 1.25, 2.3 + KERB_Y, z - 1.7], [x - 1.25, 2.3 + KERB_Y, z + 1.7], 0.03, 0x39373a);
  if (sky.night) {
    const bulb = new THREE.PointLight(0xffe1ad, 7, 9, 2);
    bulb.position.set(x, 2.4, z);
    group.add(bulb);
    G.sphere(0.09, 0xfff0cc, [x, 2.45 + KERB_Y, z]);
  }
  return { x, z };
}

function gantry(B, G, sky, data, group) {
  // A băng rôn stretched across the street at the entrance, with the day's
  // date on it, and an LED strip on the beam under it that runs the headlines.
  const z = -2;
  const yBeam = 6.1;
  for (const s of [-1, 1]) {
    B.cyl(0.13, yBeam, 0x7d7a74, [s * (KERB - 0.3), yBeam / 2 + KERB_Y, z]);
  }
  B.box(KERB * 2 - 0.2, 0.18, 0.18, 0x6f6a63, [0, yBeam, z]);
  // the cloth
  const c = canvas(1024, 128);
  const g = c.getContext('2d');
  g.fillStyle = '#b31f24';
  g.fillRect(0, 0, 1024, 128);
  g.fillStyle = '#ffdf6e';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `700 58px ${FONT}`;
  g.fillText(`${data.title.toUpperCase()} · ${vnDateLine()}`, 512, 64);
  const banner = signPlane(canvasTexture(c), KERB * 2 - 0.6, 1.0,
    [0, yBeam - 0.62, z + 0.02], 0);
  group.add(banner);
  const back = signPlane(canvasTexture(c), KERB * 2 - 0.6, 1.0,
    [0, yBeam - 0.62, z - 0.02], Math.PI);
  group.add(back);
  if (sky.night) G.box(KERB * 2 - 0.8, 0.05, 0.05, 0xffe9b8, [0, yBeam - 1.16, z]);
  return { z, yBeam };
}

function tickerBoard(B, G, sky, group, at) {
  // The rolling headlines. A dot-matrix strip, the kind bolted over every
  // Vietnamese ward office and bus stop — drawn into a canvas each frame.
  const c = canvas(1024, 96);
  const tex = canvasTexture(c, { anisotropy: 4 });
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const w = 6.4;
  const h = 0.6;
  for (const s of [1, -1]) {
    const m = new THREE.Mesh(PLANE, mat);
    m.scale.set(w, h, 1);
    m.position.set(0, at.yBeam + 0.62, at.z + s * 0.09);
    m.rotation.y = s > 0 ? 0 : Math.PI;
    group.add(m);
  }
  B.box(w + 0.24, h + 0.18, 0.16, 0x24262b, [0, at.yBeam + 0.62, at.z]);
  if (sky.night) {
    const pl = new THREE.PointLight(0xffc46a, 6, 12, 2);
    pl.position.set(0, at.yBeam + 0.2, at.z);
    group.add(pl);
  }
  return { canvas: c, texture: tex };
}

function loudspeaker(B, G, sky, group) {
  // Loa phường — the ward loudspeaker, still bolted to a pole on most streets
  // in Vietnam and still reading the news out at six in the morning. Here it
  // sweeps slowly, and it is the only thing in the street that turns.
  const x = -6.5;
  const z = -26;
  const h = 7.0;
  B.cyl(0.12, h, 0x86817a, [x, h / 2 + KERB_Y, z]);
  const head = new THREE.Group();
  head.position.set(x, h - 0.5 + KERB_Y, z);
  const hb = new Batch();
  const hg = new Batch();
  hb.cyl(0.1, 0.5, 0x86817a, [0, 0.25, 0]);
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2;
    const dx = Math.cos(a) * 0.42;
    const dz = Math.sin(a) * 0.42;
    // Euler order is XYZ, so the matrix is Rx*Ry*Rz and Rz runs first: z=PI/2
    // tips the cone's +Y axis onto -X, then y = PI - a swings it round to a.
    const rot = [0, Math.PI - a, Math.PI / 2];
    hb.cone(0.32, 0.8, 0x9aa0a4, [dx, 0.3, dz], rot);
    hb.cyl(0.1, 0.26, 0x5c5f63, [dx * 0.42, 0.3, dz * 0.42], rot);
  }
  const solidHead = hb.build(group.userData.solidMat);
  if (solidHead) head.add(solidHead);
  const glowHead = hg.build(group.userData.glowMat);
  if (glowHead) head.add(glowHead);
  group.add(head);
  if (sky.night) G.sphere(0.07, 0xffd9a0, [x, h - 0.9 + KERB_Y, z]);
  return head;
}

/* ------------------------------------------------------------------- lanes */

function lane(B, G, group, { cat, items, images, side, z, sky, lights }) {
  const xf = side * KERB;
  const zWall = z + LANE_HALF; // the case hangs on the north wall of the alley
  const colorHex = new THREE.Color(cat.color).getHex();
  // The alley is cut to fit its section. A dead end at a fixed distance looks
  // right with seven stories in the case and looks like a deserted service
  // yard with three, which is exactly what happens when the live feed is out
  // and the scene falls back to the snapshot.
  const depth = LANE_X0 - KERB + LANE_GAP * Math.max(0, items.length - 1) + 4.6;
  const xEnd = side * (KERB + depth);

  // lane floor, a shade lighter than the pavement, with a drain down the middle
  B.span(xf, KERB_Y - 0.02, z - LANE_HALF, xEnd, KERB_Y, z + LANE_HALF, 0xb3ab9c);
  B.span(xf, KERB_Y, z - 0.16, xEnd, KERB_Y + 0.02, z + 0.16, 0x8d8679);

  // the two walls of the alley, blank render with a few high windows
  const windows = Math.max(2, Math.round((depth - 3) / 3.2));
  for (const s of [-1, 1]) {
    const zw = z + s * (LANE_HALF + 0.4);
    B.span(xf, 0, zw - 0.4, side * (KERB + depth + 2), 9.2, zw + 0.4,
      s > 0 ? 0xcfc4ad : 0xc4baa6);
    for (let i = 0; i < windows; i += 1) {
      const xx = side * (KERB + 3 + i * 3.2);
      B.box(0.9, 1.0, 0.18, 0x2a2721, [xx, 5.4, zw - s * 0.42]);
      if (sky.night && (i + (s > 0 ? 0 : 1)) % 3 === 0) {
        B.box(0.8, 0.9, 0.06, 0xffd9a0, [xx, 5.4, zw - s * 0.5]);
      }
    }
  }
  // dead end, so the alley reads as an alley
  B.span(xEnd, 0, z - LANE_HALF - 0.4,
    side * (KERB + depth + 0.6), 9.2, z + LANE_HALF + 0.4, 0xbdb3a0);

  /* ---- the gate at the mouth */
  for (const s of [-1, 1]) {
    const zp = z + s * (LANE_HALF + 0.3);
    B.box(0.7, 4.6, 0.7, 0xded4bf, [xf - side * 0.1, 2.3 + KERB_Y, zp]);
    B.box(0.86, 0.22, 0.86, colorHex, [xf - side * 0.1, 4.5 + KERB_Y, zp]);
  }
  B.box(0.75, 0.95, LANE_HALF * 2 + 1.3, colorHex, [xf - side * 0.1, 4.95 + KERB_Y, z]);
  const gateTex = signTexture(cat.label, cat.color, `${cat.en} · ${items.length} tin`);
  for (const s of [-1, 1]) {
    group.add(signPlane(gateTex, LANE_HALF * 2 + 1.0, 0.82,
      [xf - side * 0.1 + s * 0.39, 4.95 + KERB_Y, z], s > 0 ? Math.PI / 2 : -Math.PI / 2,
      { lit: sky.night }));
  }
  // a lane-name plate on the south wall, like a real hẻm number
  group.add(signPlane(signTexture(`Hẻm ${cat.label}`, cat.color),
    1.6, 0.4, [side * (KERB + 2.4), 2.9, z - LANE_HALF - 0.36], 0));

  /* ---- the glazed notice case, and the pages in it */
  const x0 = LANE_X0;
  const gap = LANE_GAP;
  const runLen = gap * Math.max(1, items.length - 1) + PAGE_W + 1.2;
  const xMid = side * (x0 + gap * (items.length - 1) / 2);
  const zCase = zWall - 0.42;
  B.box(runLen, 1.9, 0.22, 0x5f5347, [xMid, 1.62, zCase + 0.11]);
  B.box(runLen, 0.1, 0.7, 0x4a4038, [xMid, 2.62, zCase - 0.24]); // rain hood
  B.box(runLen, 0.06, 0.72, 0x6f6156, [xMid, 2.66, zCase - 0.24], [0.18, 0, 0]);
  B.box(runLen, 0.12, 0.26, 0x4a4038, [xMid, 0.7, zCase - 0.06]); // sill

  const pages = [];
  items.forEach((item, k) => {
    const x = side * (x0 + k * gap);
    B.box(PAGE_W + 0.16, PAGE_H + 0.16, 0.08, colorHex, [x, 1.62, zCase + 0.02]);
    pages.push(makePage({
      item, cat, img: images[k], rank: k, sky,
      position: [x, 1.62, zCase - 0.05],
      yaw: Math.PI, // faces -z, into the alley
    }));
    // a bulb over each page
    G.sphere(0.055, sky.night ? 0xfff0cc : 0xd8d2c4, [x, 2.5, zCase - 0.3]);
    B.strut([x, 2.6, zCase - 0.26], [x, 2.52, zCase - 0.3], 0.02, 0x33312e);
  });
  for (const p of pages) group.add(p);

  // ONE light per lane, not one per page. Fifty-six point lights is not a
  // scene, it is a slideshow; the pages carry their own emissive term (see
  // pages.js) so they stay readable, and this is only the pool on the floor.
  if (sky.night) {
    const pl = new THREE.PointLight(0xffe0ae, 20, 24, 2);
    pl.position.set(side * (x0 + gap * (items.length - 1) * 0.5), 2.5, zCase - 0.9);
    lights.add(pl);
  }

  // a bench and a bicycle, because someone always is reading
  B.box(1.5, 0.1, 0.4, 0x7a6a55, [side * (x0 + gap * 2), 0.56, z - 1.1]);
  for (const dx of [-0.6, 0.6]) {
    B.box(0.1, 0.46, 0.36, 0x6a5c4a, [side * (x0 + gap * 2) + dx, 0.29, z - 1.1]);
  }

  return pages;
}

/* ------------------------------------------------------------------ export */

export function buildStreet({ data, images, sky }) {
  const r = rng(20260913);
  const B = new Batch(); // everything matte
  const G = new Batch(); // everything self-lit
  const group = new THREE.Group();
  group.name = 'tuoitre-street';
  const solidMat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.94, metalness: 0.02,
  });
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  group.userData.solidMat = solidMat;
  group.userData.glowMat = glowMat;
  const lights = new THREE.Group();
  group.add(lights);

  /* ---- ground, road, pavement */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshStandardMaterial({ color: sky.night ? 0x1a1c21 : 0x6f695f, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  group.add(ground);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD * 2, Z_SOUTH - Z_NORTH),
    new THREE.MeshStandardMaterial({ map: roadTexture(), roughness: 0.98 }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, (Z_SOUTH + Z_NORTH) / 2);
  group.add(road);

  const paveMat = new THREE.MeshStandardMaterial({ map: paveTexture(), roughness: 0.95 });
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(KERB - ROAD, Z_SOUTH - Z_NORTH), paveMat);
    p.rotation.x = -Math.PI / 2;
    p.position.set(s * (ROAD + KERB) / 2, KERB_Y, (Z_SOUTH + Z_NORTH) / 2);
    group.add(p);
    B.span(s * ROAD, 0, Z_NORTH, s * (ROAD + 0.22), KERB_Y, Z_SOUTH, 0xbdb6a6);
  }
  // centre line
  for (let z = Z_NORTH + 2; z < Z_SOUTH; z += 4) {
    B.box(0.14, 0.01, 2.0, 0xd8d2b8, [0, 0.012, z]);
  }

  /* ---- the frontages, with a gap wherever a lane opens */
  for (const side of [-1, 1]) {
    const gaps = [];
    LANE_Z.forEach((z, i) => {
      if (LANE_SIDE[i] === side) gaps.push([z - LANE_HALF - 0.8, z + LANE_HALF + 0.8]);
    });
    gaps.sort((a, b) => a[0] - b[0]);
    let z = Z_NORTH;
    for (const [g0, g1] of gaps) {
      if (g0 > z) buildingRun(B, { side, z0: z, z1: g0, r, sky });
      z = g1;
    }
    if (z < Z_SOUTH) buildingRun(B, { side, z0: z, z1: Z_SOUTH, r, sky });
  }
  crossBlock(B, { z: Z_NORTH - 8, r, sky, face: 1 });
  crossBlock(B, { z: Z_SOUTH + 10, r, sky, face: -1 });

  /* ---- lanes */
  const pages = [];
  data.cats.forEach((cat, i) => {
    if (i >= LANE_Z.length || !cat.items.length) return;
    const offset = data.cats.slice(0, i).reduce((n, c) => n + c.items.length, 0);
    pages.push(...lane(B, G, group, {
      cat,
      items: cat.items,
      images: images.slice(offset, offset + cat.items.length),
      side: LANE_SIDE[i],
      z: LANE_Z[i],
      sky,
      lights,
    }));
  });

  /* ---- street furniture */
  const laneNear = (z, side) => LANE_Z.some((lz, i) =>
    LANE_SIDE[i] === side && Math.abs(lz - z) < LANE_HALF + 2.2);

  for (const side of [-1, 1]) {
    for (let z = Z_SOUTH - 4; z > Z_NORTH + 4; z -= 10.5) {
      if (!laneNear(z, side)) tree(B, side * 5.3, z, r);
    }
    let lampN = 0;
    for (let z = Z_SOUTH - 9 + (side > 0 ? 8 : 0); z > Z_NORTH + 6; z -= 17) {
      if (laneNear(z, side)) continue;
      lampN += 1;
      lamp(B, G, side * 4.6, z, side, sky, lights, lampN % 3 === 1);
    }
    let prev = null;
    for (let z = Z_SOUTH - 2; z > Z_NORTH; z -= 21) {
      if (laneNear(z, side)) continue;
      powerPole(B, side * 7.0, z, sky);
      if (prev !== null) cables(B, side * 7.0, prev, z, r);
      prev = z;
    }
    // parked motorbikes, nose to the kerb
    for (let z = Z_SOUTH - 6; z > Z_NORTH + 5; z -= 2.0) {
      if (laneNear(z, side) || r() > 0.62) continue;
      motorbike(B, side * 4.9, z, side > 0 ? Math.PI / 2 : -Math.PI / 2, r);
    }
  }
  for (const [x, z] of [[-6.2, 2], [6.3, -14], [-6.3, -38], [6.2, -62], [-6.1, -86]]) {
    cafeCluster(B, x, z, r);
  }

  const stall = newsStall(B, G, sky, data, group);
  const gan = gantry(B, G, sky, data, group);
  const ticker = tickerBoard(B, G, sky, group, gan);
  const speaker = loudspeaker(B, G, sky, group);

  /* ---- merge */
  const solid = B.build(solidMat);
  if (solid) group.add(solid);
  const glow = G.build(glowMat);
  if (glow) group.add(glow);

  return { group, pages, ticker, speaker, stall, lights };
}

export const LAYOUT = { LANE_Z, LANE_SIDE, LANE_HALF, LANE_X0, LANE_GAP, Z_SOUTH, Z_NORTH };
