// The Back Office, part 3 of 4: the room itself.
//
// A port of blender_models/office_scenegen/build_office.py into the browser
// kit. Same proportions, same palette, same furniture — the difference is that
// the corridor is laid out from `plan()` at load rather than baked, so it is
// exactly as long as the orphan list is.
//
// Everything static goes into two Batches (solid + glow) and comes out as two
// meshes, the way the street and the trading floor do. Signs are canvas planes
// on top of that, because text is the one thing a vertex-coloured merge cannot
// carry.
import * as THREE from 'three';
import { Batch, solidMaterial, glowMaterial, rng } from '../kit.js';
import { M, slotPose } from './plan.js';
import * as S from './signs.js';

const C = {
  wall: 0xe7e0d2, wallDark: 0xd9d0bd, ceiling: 0xf2efe9, trim: 0xf6f3ec,
  floor: [0x8a5c33, 0x99683a, 0x7b4f2b, 0x91613a],
  runner: 0x7a3f3a, runnerEdge: 0x63312d, rug: 0x6d5b7b, rugEdge: 0x584a63,
  brass: 0xb08d3f, plate: 0xf4f0e4, ink: 0x2b2622,
  deskTop: 0xc8a06d, deskEdge: 0xa9814f, metal: 0x6b6f78, metalDark: 0x3c4048,
  cabBody: 0xe9e6de, cabFace: 0xdcd7cc, cork: 0xc99a5f, corkFrame: 0x8c6236,
  cardPale: 0xefe9dc, cardAmber: 0xe79a33, string: 0xb6453c,
  tray: 0xa3a7b0, glass: 0x9cc2da, sky: 0xbcd8ee,
  plant: 0x2f6434, plantLt: 0x43803c, pot: 0xa3573a, paper: 0xf5f1e6,
  books: [0x9c3830, 0x33567f, 0x4c7448, 0xb07f2c, 0x66497a, 0x2e3540],
  mug: 0xd6644f, shade: 0xcfc7b6, blank: 0xded6c6,
  lamp: 0xfff3dc, strip: 0xfff6e4, endGlow: 0xfff0c8,
};

export function buildRoom(p) {
  const root = new THREE.Group();
  root.name = 'back-office';
  const b = new Batch();      // lit, vertex-coloured, one mesh
  const glow = new Batch();   // unlit, so a transom reads as a transom
  const signs = [];

  shell(b, glow, p);
  floor(b, p);
  doors(b, glow, signs, p);
  banners(b, signs, p);
  corridorDressing(b, glow, signs, p);
  office(b, glow, signs, p);

  const solid = b.build(solidMaterial());
  if (solid) { solid.name = 'office-solid'; root.add(solid); }
  const lit = glow.build(glowMaterial());
  if (lit) { lit.name = 'office-glow'; root.add(lit); }
  signs.forEach((s) => root.add(s));

  root.userData.dispose = () => {
    signs.forEach((s) => s.userData.disposeSign && s.userData.disposeSign());
  };
  return root;
}

// ------------------------------------------------------------------- shell
function shell(b, glow, p) {
  const { X0, X1, ZN, ZS, CEIL, WT, CW, ARCH_W, ARCH_H, DOOR_W, DOOR_H } = M;

  // office box
  b.span(X0 - WT, 0, ZN - WT, X0, CEIL, ZS + WT, C.wall);
  b.span(X1, 0, ZN - WT, X1 + WT, CEIL, ZS + WT, C.wall);
  b.span(X0, 0, ZS, X1, CEIL, ZS + WT, C.wall);
  // north wall: two piers and a lintel around the corridor mouth
  b.span(X0, 0, ZN - WT, -ARCH_W, CEIL, ZN, C.wall);
  b.span(ARCH_W, 0, ZN - WT, X1, CEIL, ZN, C.wall);
  b.span(-ARCH_W, ARCH_H, ZN - WT, ARCH_W, CEIL, ZN, C.wall);
  // the arch's own casing, on the corridor side
  for (const s of [-1, 1]) {
    b.box(0.18, ARCH_H, 0.06, C.wallDark, [s * (ARCH_W + 0.09), ARCH_H / 2, ZN - WT - 0.03]);
  }
  b.box(2 * ARCH_W + 0.36, 0.18, 0.06, C.wallDark, [0, ARCH_H + 0.09, ZN - WT - 0.03]);

  // corridor: a gap in the wall only where a slot actually has a door
  const gaps = { '-1': [], 1: [] };
  p.slots.forEach((slot, i) => {
    if (!slot) return;
    const { z, side } = slotPose(p, i);
    gaps[side].push([-(z + DOOR_W / 2), -(z - DOOR_W / 2)]); // as distances
  });
  for (const side of [-1, 1]) {
    const runs = gaps[side].sort((u, v) => u[0] - v[0]);
    const edges = [0, ...runs.flat(), -p.end];
    for (let i = 0; i < edges.length - 1; i += 2) {
      const d0 = edges[i], d1 = edges[i + 1];
      if (d1 - d0 > 0.02) {
        b.span(side * CW, 0, -d0, side * (CW + WT), CEIL, -d1, C.wall);
      }
    }
    for (const [d0, d1] of runs) {
      b.span(side * CW, DOOR_H, -d0, side * (CW + WT), CEIL, -d1, C.wall);
    }
  }
  b.span(-CW - WT, 0, p.end - WT, CW + WT, CEIL, p.end, C.wall);

  // baseboard + cornice
  const rails = (x, z, w, d) => {
    b.box(w, 0.12, d, C.trim, [x, 0.06, z]);
    b.box(w, 0.12, d, C.trim, [x, CEIL - 0.06, z]);
  };
  rails(X0 + 0.05, (ZN + ZS) / 2, 0.10, ZS - ZN);
  rails(X1 - 0.05, (ZN + ZS) / 2, 0.10, ZS - ZN);
  rails(0, ZS - 0.05, X1 - X0, 0.10);
  for (const s of [-1, 1]) rails(s * (CW - 0.05), (ZN + p.end) / 2, 0.10, ZN - p.end);
  rails(0, p.end + 0.05, 2 * CW, 0.10);

  // ceilings. `shadows: false` in the config, so no ROOF_ tagging needed --
  // one merged mesh could not carry the flag anyway.
  b.box(X1 - X0 + 2 * WT, 0.14, ZS - ZN + 2 * WT, C.ceiling, [0, CEIL + 0.07, (ZN + ZS) / 2]);
  b.box(2 * CW + 2 * WT, 0.14, ZN - p.end, C.ceiling, [0, CEIL + 0.07, (ZN + p.end) / 2]);

  // lights: panels over the office, one strip per bay down the corridor
  for (const lx of [-3.2, 0, 3.2]) {
    for (const lz of [2.4, 6.6]) glow.box(1.5, 0.06, 0.55, C.lamp, [lx, CEIL - 0.04, lz]);
  }
  p.bayZ.forEach((z) => glow.box(0.34, 0.06, 1.6, C.strip, [0, CEIL - 0.04, z]));
  glow.box(0.34, 0.06, 1.6, C.strip, [0, CEIL - 0.04, p.end + 1.0]);
}

function floor(b, p) {
  const r = rng(20260913);
  const planks = (x0, x1, z0, z1) => {
    const pw = 0.26;
    const n = Math.floor((x1 - x0) / pw);
    for (let i = 0; i < n; i += 1) {
      const x = x0 + pw * (i + 0.5);
      let z = z0 - r() * 2.0;
      let k = 0;
      while (z < z1) {
        const len = 1.6 + r() * 1.4;
        const za = Math.max(z, z0);
        const zb = Math.min(z + len, z1);
        if (zb - za > 0.06) {
          const tone = C.floor[(i * 3 + k + Math.floor(r() * 4)) % 4];
          b.box(pw - 0.014, 0.04, zb - za - 0.014, tone, [x, -0.02, (za + zb) / 2]);
        }
        z += len;
        k += 1;
      }
    }
  };
  planks(M.X0, M.X1, M.ZN, M.ZS);
  planks(-M.CW, M.CW, p.end, M.ZN);
}

// ------------------------------------------------------------------- doors
function doors(b, glow, signs, p) {
  const { DOOR_W, DOOR_H } = M;
  p.slots.forEach((slot, i) => {
    const { x, z, side } = slotPose(p, i);
    const inner = x - side * 0.02;

    if (!slot) {
      // room for one more of this kind: a blank recessed panel, no leaf
      b.box(0.03, DOOR_H, DOOR_W + 0.28, C.blank, [inner - side * 0.01, DOOR_H / 2 + 0.14, z]);
      b.box(0.10, 0.10, DOOR_W + 0.42, C.trim, [inner - side * 0.03, DOOR_H + 0.21, z]);
      signs.push(S.place(S.label('ROOM FOR ONE MORE', 1.2, 0.16, { size: 0.7 }),
        [inner - side * 0.055, DOOR_H + 0.21, z], side < 0 ? S.FACE.west : S.FACE.east));
      return;
    }

    // casing
    for (const d of [-1, 1]) {
      b.box(0.10, DOOR_H + 0.28, 0.14, C.trim,
        [inner - side * 0.03, (DOOR_H + 0.14) / 2, z + d * (DOOR_W / 2 + 0.07)]);
    }
    b.box(0.10, 0.14, DOOR_W + 0.28, C.trim, [inner - side * 0.03, DOOR_H + 0.21, z]);
    // leaf, recessed, with two sunk panels
    b.box(0.08, DOOR_H + 0.06, DOOR_W + 0.06, slot.leaf, [x + side * 0.05, DOOR_H / 2, z]);
    b.box(0.03, 1.05, DOOR_W - 0.28, slot.leaf, [x + side * 0.005, 0.72, z]);
    b.box(0.03, 0.60, DOOR_W - 0.28, slot.leaf, [x + side * 0.005, 1.92, z]);
    // handle and hinges
    b.box(0.10, 0.05, 0.16, C.brass, [inner - side * 0.07, 1.05, z - side * (DOOR_W / 2 - 0.16)]);
    for (const hy of [0.45, DOOR_H - 0.45]) {
      b.box(0.05, 0.16, 0.05, C.brass, [x + side * 0.02, hy, z + side * (DOOR_W / 2 - 0.04)]);
    }
    // transom light
    glow.box(0.05, 0.14, DOOR_W - 0.10, slot.glow, [inner - side * 0.02, DOOR_H + 0.20, z]);
    // name plate and the brass number beside the handle
    const yaw = side < 0 ? S.FACE.west : S.FACE.east;
    signs.push(S.place(S.namePlate(slot.title), [inner - side * 0.03, DOOR_H + 0.52, z], yaw));
    b.box(0.05, 0.26, 0.20, C.brass, [inner - side * 0.05, 1.60, z + (DOOR_W / 2 + 0.20)]);
    signs.push(S.place(S.numberPlate(slot.n), [inner - side * 0.08, 1.60, z + (DOOR_W / 2 + 0.20)], yaw));
  });
}

function banners(b, signs, p) {
  const { CEIL, CW } = M;
  p.wings.forEach((w) => {
    const z = p.bayZ[Math.floor(w.slot / 2)] + 1.55;
    b.box(2 * CW - 0.9, 0.40, 0.06, C.plate, [0, CEIL - 0.42, z]);
    b.box(0.05, 0.32, 0.05, C.metal, [0, CEIL - 0.16, z]);
    signs.push(S.place(S.banner(w.name, w.count, 2 * CW - 0.98), [0, CEIL - 0.42, z + 0.05]));
  });
}

function corridorDressing(b, glow, signs, p) {
  const { CW, ZN, DOOR_W, DOOR_H } = M;
  const len = ZN - p.end - 1.2;
  b.box(2.1, 0.016, len, C.runner, [0, 0.008, (ZN + p.end) / 2 - 0.4]);
  b.box(2.34, 0.012, len + 0.2, C.runnerEdge, [0, 0.006, (ZN + p.end) / 2 - 0.4]);

  // a bench or a plant at every other bay junction, however many there are
  for (let k = 1; k < p.bays; k += 2) {
    const z = p.bayZ[k] - M.PITCH / 2;
    if (z < p.end + 0.8) break;
    const s = (k >> 1) % 2 === 0 ? -1 : 1;
    if ((k >> 1) % 2 === 0) {
      b.box(0.46, 0.08, 1.3, C.deskTop, [s * (CW - 0.30), 0.44, z]);
      for (const dz of [-0.5, 0.5]) {
        b.box(0.34, 0.42, 0.07, C.metal, [s * (CW - 0.30), 0.21, z + dz]);
      }
    } else {
      plant(b, s * (CW - 0.42), z, 0.95);
    }
  }

  // the end of the corridor: a cased frame with nothing in it, lit behind
  for (const s of [-1, 1]) {
    b.box(0.16, DOOR_H + 0.4, 0.10, C.trim, [s * (DOOR_W / 2 + 0.12), (DOOR_H + 0.2) / 2, p.end + 0.06]);
  }
  b.box(DOOR_W + 0.56, 0.16, 0.10, C.trim, [0, DOOR_H + 0.28, p.end + 0.06]);
  glow.box(DOOR_W + 0.06, DOOR_H, 0.04, C.endGlow, [0, DOOR_H / 2, p.end + 0.02]);
  signs.push(S.place(S.label('NOT YET BUILT', 1.5, 0.2, { size: 0.72 }),
    [0, DOOR_H + 0.62, p.end + 0.12]));
}

// ------------------------------------------------------------------ office
function plant(b, x, z, h = 1) {
  b.cyl(0.20 * h, 0.32 * h, C.pot, [x, 0.16 * h, z]);
  for (let k = 0; k < 7; k += 1) {
    const a = (Math.PI * 2 * k) / 7 + x + z;
    const r = 0.30 * h;
    b.sphere(0.20 * h, k % 2 ? C.plant : C.plantLt,
      [x + Math.cos(a) * r * 0.7, (0.45 + 0.14 * (k % 3)) * h, z + Math.sin(a) * r * 0.7],
      [1, 0.55, 1]);
  }
}

function office(b, glow, signs, p) {
  const { X0, X1, ZN, ZS } = M;

  b.box(5.2, 0.012, 3.6, C.rugEdge, [0.2, 0.006, 4.6]);
  b.box(4.9, 0.014, 3.3, C.rug, [0.2, 0.014, 4.6]);

  // --- the register desk ---------------------------------------------
  const dx = -2.6, dz = 6.5;
  b.box(2.0, 0.06, 0.95, C.deskTop, [dx, 0.74, dz]);
  b.box(2.0, 0.10, 0.04, C.deskEdge, [dx, 0.72, dz + 0.48]);
  for (const sx of [-0.88, 0.88]) b.box(0.08, 0.72, 0.85, C.metal, [dx + sx, 0.36, dz]);
  b.box(0.62, 0.64, 0.62, C.cabBody, [dx + 0.62, 0.32, dz - 0.12]);
  for (let k = 0; k < 3; k += 1) {
    b.box(0.56, 0.16, 0.03, C.cabFace, [dx + 0.62, 0.12 + 0.20 * k, dz + 0.20]);
  }
  // Lying open on the desk. rotation.x alone lays it flat but leaves it
  // upside down to anyone standing where the tour parks the camera (north of
  // the desk, looking south), so it is turned in its own plane as well.
  const reg = S.register(p.orphans, p.scenes);
  reg.rotation.set(-Math.PI / 2, 0, Math.PI);
  reg.position.set(dx - 0.35, 0.785, dz - 0.02);
  signs.push(reg);
  b.cyl(0.11, 0.04, C.metalDark, [dx + 0.70, 0.79, dz - 0.26]);
  b.cyl(0.022, 0.44, C.metalDark, [dx + 0.70, 1.02, dz - 0.26]);
  b.cyl(0.17, 0.16, C.lamp, [dx + 0.62, 1.24, dz - 0.26]);
  glow.cyl(0.15, 0.03, C.lamp, [dx + 0.62, 1.16, dz - 0.26]);
  b.cyl(0.045, 0.09, C.mug, [dx - 0.92, 0.815, dz + 0.24]);
  b.cyl(0.05, 0.10, C.metal, [dx + 0.18, 0.82, dz - 0.30]);
  b.box(0.52, 0.07, 0.50, C.deskEdge, [dx, 0.45, dz + 1.0]);
  b.box(0.52, 0.56, 0.07, C.deskEdge, [dx, 0.76, dz + 1.24]);
  b.cyl(0.05, 0.42, C.metalDark, [dx, 0.21, dz + 1.0]);
  b.cyl(0.30, 0.05, C.metalDark, [dx, 0.03, dz + 1.0]);

  // --- corkboard: one card per registered scene, orphans in amber ------
  const bx = X0 + 0.07, bz = 3.2, BW = 3.12, BH = 1.78, by = 1.62;
  b.box(0.06, BH + 0.17, BW + 0.18, C.corkFrame, [bx, by, bz]);
  b.box(0.02, BH, BW, C.cork, [bx + 0.035, by, bz]);
  const cols = Math.max(6, Math.ceil(Math.sqrt(p.scenes * 1.9)));
  const rows = Math.max(1, Math.ceil(p.scenes / cols));
  const pz = (BW - 0.10) / cols;
  const py = (BH - 0.10) / rows;
  const wired = [];
  for (let i = 0; i < p.scenes; i += 1) {
    const r = Math.floor(i / cols), c = i % cols;
    const z = bz - (BW - 0.10) / 2 + pz * (c + 0.5);
    const y = by + (BH - 0.10) / 2 - py * (r + 0.5);
    const orphan = i < p.orphans;
    b.box(0.02, py * 0.62, pz * 0.72, orphan ? C.cardAmber : C.cardPale, [bx + 0.055, y, z]);
    if (!orphan) wired.push([y, z]);
  }
  for (let i = 0; i < wired.length - 1; i += 1) {
    const [y0, z0] = wired[i], [y1, z1] = wired[i + 1];
    b.strut([bx + 0.075, y0, z0], [bx + 0.075, y1, z1], 0.013, C.string);
  }
  signs.push(S.place(S.label('THE MAP', 1.0, 0.2, { size: 0.8 }),
    [bx + 0.10, by + BH / 2 + 0.20, bz], S.FACE.west));

  // --- whiteboard ------------------------------------------------------
  const wx = X1 - 0.07, wz = 3.4;
  b.box(0.06, 1.60, 3.0, C.tray, [wx, 1.70, wz]);
  b.box(0.16, 0.04, 2.86, C.tray, [wx - 0.10, 0.92, wz]);
  signs.push(S.place(S.whiteboard([
    'EVERY DOOR IS A PAIR',
    `${p.orphans} rooms with no way in`,
    'this corridor is the temporary fix',
  ]), [wx - 0.035, 1.70, wz], S.FACE.east));

  // --- filing cabinets -------------------------------------------------
  for (let k = 0; k < 4; k += 1) {
    const cx = -3.9 + k * 1.05;
    b.box(0.92, 1.32, 0.62, C.cabBody, [cx, 0.66, ZS - 0.38]);
    b.box(0.98, 0.05, 0.68, C.deskTop, [cx, 1.34, ZS - 0.38]);
    for (let j = 0; j < 3; j += 1) {
      b.box(0.84, 0.36, 0.03, C.cabFace, [cx, 0.24 + j * 0.42, ZS - 0.06]);
      b.box(0.26, 0.03, 0.03, C.brass, [cx, 0.24 + j * 0.42, ZS - 0.02]);
    }
  }

  // --- bookcase --------------------------------------------------------
  const bcx = X1 - 0.24;
  b.box(0.42, 2.10, 2.2, C.cabBody, [bcx, 1.05, 7.2]);
  let n = 0;
  for (let shelf = 0; shelf < 4; shelf += 1) {
    const y = 0.30 + shelf * 0.50;
    let z = 6.20;
    while (z < 8.20) {
      const w = 0.035 + (n % 5) * 0.012;
      const h = 0.30 + (n % 4) * 0.045;
      b.box(0.24, h, w, C.books[n % 6], [bcx - 0.06, y + h / 2, z + w / 2]);
      z += w + 0.008;
      n += 1;
    }
  }

  // --- key cabinet: one hook per door ----------------------------------
  const kx = 4.55;
  const kcols = Math.min(8, Math.max(4, p.orphans));
  const krows = Math.max(1, Math.ceil(p.orphans / kcols));
  const kh = 0.24 + krows * 0.42;
  b.box(1.30, kh, 0.14, C.cabBody, [kx, 1.30 + kh / 2, ZN + 0.10]);
  b.box(1.22, kh - 0.08, 0.03, C.shade, [kx, 1.30 + kh / 2, ZN + 0.04]);
  for (let k = 0; k < p.orphans; k += 1) {
    const r = Math.floor(k / kcols), c = k % kcols;
    const hx = kx - 0.52 + c * (1.04 / Math.max(1, kcols - 1));
    const hy = 1.30 + kh - 0.28 - r * 0.42;
    b.box(0.02, 0.06, 0.05, C.brass, [hx, hy, ZN + 0.10]);
    b.box(0.10, 0.20, 0.02, C.plate, [hx, hy - 0.14, ZN + 0.11]);
  }
  signs.push(S.place(S.label('KEYS', 0.6, 0.16, { size: 0.78 }),
    [kx, 1.30 + kh + 0.14, ZN + 0.18]));

  // --- windows ---------------------------------------------------------
  for (const wxc of [1.9, 4.2]) {
    b.box(1.30, 1.30, 0.05, C.glass, [wxc, 1.75, ZS - 0.05]);
    b.box(1.30, 1.30, 0.04, C.sky, [wxc, 1.75, ZS + 0.06]);
    b.box(1.52, 0.06, 0.20, C.trim, [wxc, 1.06, ZS - 0.12]);
    for (const fy of [-0.42, 0, 0.42]) b.box(1.30, 0.04, 0.06, C.trim, [wxc, 1.75 + fy, ZS - 0.05]);
    b.box(0.05, 1.30, 0.06, C.trim, [wxc, 1.75, ZS - 0.05]);
  }

  plant(b, -4.85, 1.0, 1.15);
  plant(b, 4.9, 8.2, 0.95);

  // --- the framed plan by the arch -------------------------------------
  b.box(1.50, 1.10, 0.08, C.corkFrame, [-4.35, 1.85, ZN + 0.08]);
  signs.push(S.place(S.plan(p.bays), [-4.35, 1.85, ZN + 0.13]));
}
