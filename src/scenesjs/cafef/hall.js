// Sàn Bảng Điện — the hall itself.
//
// A Vietnamese brokerage floor of the kind that still exists in Hà Nội and
// Sài Gòn: one big room, a wall of board at the far end, and banked rows of
// chairs facing it where people sit all session watching the numbers. Down
// both flanks, eight dealing bays — one per CafeF section — each with a desk
// and a bank of seven screens over it carrying that section's stories.
//
// Fixed dimensions, because a lot of things have to agree about them:
//   hall       x ∈ [-22, 22], z ∈ [-40, +12], ceiling at y = 12
//   board wall z = -40, its two lit panels at z = -39.5
//   the bank   five tiers, z ∈ [-36, -21], x ∈ [-12, 12], rising 0.45 a tier
//   walkways   12 < |x| < 20.2, which is how you get to the bays
//   bays       against x = ±22 at z = -34, -25.5, -17, -8.5
//   front      glazed, z = +12, facing the street and the hour outside
//
// Everything static is pushed into two merged meshes (see ../kit.js Batch), so
// the room costs two draw calls plus the panels and the board.
import * as THREE from 'three';
import {
  Batch, rng, pick, canvas, canvasTexture, FONT, PLANE,
} from '../kit.js';
import { makePage, PAGE_W, PAGE_H } from './pages.js';
import { catLine } from './board.js';
import { vnDateLine } from './feed.js';

export const HALL = {
  X: 22, Z_BOARD: -40, Z_FRONT: 12, H: 12,
};

export const TIERS = 5;
export const TIER_D = 3;      // depth of one tier, metres
export const TIER_RISE = 0.45;
export const TIER_Z0 = -36;   // front edge of the tier nearest the board
export const TIER_X = 12;
export const AISLE = 1.6;     // half-width of the centre aisle

export const BAY_Z = [-34, -25.5, -17, -8.5];

const WALL = 0x59677a;
const WALL_HI = 0x6b7a8d;
const CEIL = 0x2b313a;
const STEEL = 0x6d7783;
const DESK = 0x4a3f36;

/* ------------------------------------------------------------------ finishes */

function carpetTexture() {
  // Contract carpet: dark blue-grey, flecked, laid in half-metre tiles.
  const c = canvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#333b47';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4200; i += 1) {
    const v = Math.random();
    g.fillStyle = v > 0.94 ? 'rgba(170,190,215,.3)' : `rgba(${56 + v * 44},${66 + v * 46},${80 + v * 54},.5)`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  g.strokeStyle = 'rgba(0,0,0,.18)';
  g.lineWidth = 1;
  for (let i = 0; i <= 256; i += 128) {
    g.beginPath();
    g.moveTo(i, 0); g.lineTo(i, 256);
    g.moveTo(0, i); g.lineTo(256, i);
    g.stroke();
  }
  return canvasTexture(c, { repeat: [22, 26] });
}

/** A painted plate. `w`/`h` must match the PLANE's aspect or the lettering
 *  stretches — a 4:1 canvas on the bays' 9:1 lintel made "Chứng khoán" twice
 *  as wide as it is meant to be. */
function signTexture(text, color, sub, { w = 512, h = 128 } = {}) {
  const c = canvas(w, h);
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.12)';
  g.fillRect(0, 0, w, Math.max(4, h * 0.05));
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const big = Math.round(h * (sub ? 0.39 : 0.47));
  g.font = `700 ${big}px ${FONT}`;
  g.fillText(text, w / 2, sub ? h * 0.39 : h / 2);
  if (sub) {
    g.font = `500 ${Math.round(h * 0.2)}px ${FONT}`;
    g.fillStyle = 'rgba(255,255,255,.74)';
    g.fillText(sub, w / 2, h * 0.75);
  }
  return canvasTexture(c, { anisotropy: 8 });
}

function mastheadTexture(data) {
  const c = canvas(1024, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#0d1117';
  g.fillRect(0, 0, 1024, 256);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  // CafeF's own two-tone wordmark, set rather than copied: "Cafe" light, "F"
  // in the house red, which is how the site's logo reads at a glance.
  g.font = `800 116px ${FONT}`;
  const left = 'Cafe';
  const right = 'F';
  const wl = g.measureText(left).width;
  const wr = g.measureText(right).width;
  const x0 = 512 - (wl + wr) / 2;
  g.textAlign = 'left';
  g.fillStyle = '#eef3f8';
  g.fillText(left, x0, 108);
  g.fillStyle = '#e03a3a';
  g.fillText(right, x0 + wl, 108);
  g.textAlign = 'center';
  g.fillStyle = 'rgba(197,210,224,.6)';
  g.font = `500 30px ${FONT}`;
  g.fillText(data.tagline || data.site, 512, 190);
  return canvasTexture(c, { anisotropy: 8 });
}

function signPlane(tex, w, h, position, yaw, { lit = false } = {}) {
  const mat = lit
    ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })
    : new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.72, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.18,
    });
  const m = new THREE.Mesh(PLANE, mat);
  m.scale.set(w, h, 1);
  m.position.set(position[0], position[1], position[2]);
  m.rotation.y = yaw;
  return m;
}

/* ------------------------------------------------------------------ the shell */

function shell(B, G, group, sky) {
  const { X, Z_BOARD, Z_FRONT, H } = HALL;

  // the ground the whole block stands on — the carpet covers its middle
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshStandardMaterial({ color: sky.night ? 0x161a21 : 0x3d434c, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.08, 0);
  group.add(ground);

  // floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(X * 2, Z_FRONT - Z_BOARD),
    new THREE.MeshStandardMaterial({ map: carpetTexture(), roughness: 0.98 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, (Z_FRONT + Z_BOARD) / 2);
  group.add(floor);

  // side walls, with a pilaster every eight metres
  for (const s of [-1, 1]) {
    B.span(s * X, 0, Z_BOARD, s * (X + 0.6), H, Z_FRONT, WALL);
    for (let z = Z_BOARD + 4; z < Z_FRONT; z += 8.5) {
      B.box(0.5, H, 0.9, WALL_HI, [s * (X - 0.25), H / 2, z]);
    }
    B.span(s * X, H - 0.5, Z_BOARD, s * (X - 0.5), H - 0.34, Z_FRONT, WALL_HI); // cornice
    B.span(s * X, 0, Z_BOARD, s * (X - 0.12), 0.16, Z_FRONT, 0x1e242c); // skirting
  }

  // the board wall, and the blank returns either side of it
  B.span(-X, 0, Z_BOARD, X, H, Z_BOARD - 0.6, WALL);
  B.span(-11.9, 3.0, Z_BOARD + 0.1, 11.9, 11.95, Z_BOARD + 0.35, 0x11151b); // the bezel

  // ceiling — tagged ROOF_ so Viewer's shadow pass leaves it alone
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(X * 2, Z_FRONT - Z_BOARD),
    new THREE.MeshStandardMaterial({ color: CEIL, roughness: 1 }),
  );
  ceil.name = 'ROOF_ceiling';
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, H, (Z_FRONT + Z_BOARD) / 2);
  group.add(ceil);

  // Light troughs. Four CONTINUOUS runs the length of the room read as four
  // enormous glowing beams and nothing else; broken into 3.2 m fittings with
  // a gap between them they read as a ceiling, which is what they are.
  for (const x of [-16, -5.5, 5.5, 16]) {
    for (let z = Z_BOARD + 3; z < Z_FRONT - 2; z += 4.6) {
      B.box(0.92, 0.3, 3.2, 0x3a424e, [x, H - 0.16, z]);
      G.box(0.66, 0.05, 3.0, 0xc3d2e2, [x, H - 0.32, z]);
    }
  }

  /* ---- the glazed front, and the city outside it */
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x9fc4d8,
    transparent: true,
    opacity: sky.night ? 0.16 : 0.1,
    roughness: 0.06,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(X * 2 - 1, H - 1.2), glassMat);
  glass.position.set(0, (H - 1.2) / 2 + 0.6, Z_FRONT);
  group.add(glass);
  // mullions, and a revolving-door drum in the middle of them
  for (let x = -X + 1; x <= X - 1; x += 2.6) {
    B.box(0.16, H - 1.2, 0.22, STEEL, [x, (H - 1.2) / 2 + 0.6, Z_FRONT]);
  }
  B.box(X * 2 - 1, 0.3, 0.4, STEEL, [0, 0.6, Z_FRONT]);
  B.box(X * 2 - 1, 0.3, 0.4, STEEL, [0, 4.2, Z_FRONT]);
  B.box(X * 2 - 1, 0.5, 0.5, STEEL, [0, H - 0.5, Z_FRONT]);
  B.cyl(1.9, 3.4, 0x8fa6b5, [0, 1.7, Z_FRONT - 0.2]);
  B.cyl(1.75, 0.12, STEEL, [0, 3.45, Z_FRONT - 0.2]);

  // the street beyond: a row of blocks so the glass looks out at something
  const r = rng(9091);
  for (let x = -70; x < 70;) {
    const w = 6 + r() * 9;
    const h = 10 + r() * 34;
    B.box(w, h, 10 + r() * 8, pick(r, [0x47505c, 0x3f4854, 0x515a66, 0x39414c]),
      [x + w / 2, h / 2, Z_FRONT + 26 + r() * 22]);
    if (sky.night) {
      // lit windows on the faces that look back at us
      for (let k = 0; k < 5; k += 1) {
        G.box(w * 0.62, 0.5, 0.08, 0xffd9a0,
          [x + w / 2, 3 + k * (h / 6), Z_FRONT + 21 + r() * 2]);
      }
    }
    x += w + 2 + r() * 5;
  }
}

/* ------------------------------------------------------------------ the bank */

/** The banked rows of chairs facing the board — the thing that makes this a
 *  sàn and not an office. Returns the seat positions so life.js can fill them. */
function bank(B, G, sky) {
  const seats = [];
  for (let k = 0; k < TIERS; k += 1) {
    const y = k * TIER_RISE;
    const z0 = TIER_Z0 + k * TIER_D;
    const z1 = z0 + TIER_D;

    // the platform, cut by the centre aisle
    for (const s of [-1, 1]) {
      B.span(s * AISLE, -0.1, z0, s * TIER_X, y, z1, k % 2 ? 0x333a44 : 0x2f3540);
      B.span(s * AISLE, y - 0.04, z0, s * TIER_X, y, z1, 0x39414c); // tread nosing
    }
    // aisle steps: two per tier
    if (k) {
      for (let i = 0; i < 2; i += 1) {
        B.span(-AISLE, -0.1, z0 + i * (TIER_D / 2), AISLE,
          y - TIER_RISE * (1 - (i + 1) / 2), z0 + (i + 1) * (TIER_D / 2), 0x353c46);
      }
    }

    // a narrow counter along the front of the tier, and the chairs behind it
    for (const s of [-1, 1]) {
      B.span(s * AISLE, y + 0.72, z0 + 0.35, s * TIER_X, y + 0.78, z0 + 0.9, DESK);
      B.span(s * AISLE, y + 0.05, z0 + 0.55, s * TIER_X, y + 0.72, z0 + 0.62, 0x2a3038);
    }

    for (const s of [-1, 1]) {
      for (let i = 0; i < 6; i += 1) {
        const x = s * (AISLE + 0.9 + i * 1.75);
        const z = z1 - 1.15;
        // chair: seat, back, a single stem and a foot
        B.box(0.52, 0.09, 0.5, 0x8a2f36, [x, y + 0.46, z]);
        B.box(0.5, 0.62, 0.09, 0x8a2f36, [x, y + 0.79, z + 0.24], [-0.12, 0, 0]);
        B.cyl(0.05, 0.42, 0x2f353d, [x, y + 0.23, z]);
        B.cyl(0.26, 0.05, 0x2f353d, [x, y + 0.03, z]);
        seats.push({ x, y: y + 0.5, z, tier: k });
      }
    }
  }

  // a rail across the back of the bank, and one down each flank
  // A SOLID parapet across the back of the bank walls the seating off: from
  // the doors you see a blank band and no chairs at all. Posts and two rails
  // do the same job and let the room read through.
  const topY = (TIERS - 1) * TIER_RISE;
  const railY = topY + 0.95;
  const zr = TIER_Z0 + TIERS * TIER_D + 0.1;
  for (let x = -TIER_X; x <= TIER_X + 0.01; x += 1.6) {
    B.box(0.07, 0.95, 0.07, STEEL, [x, topY + 0.475, zr]);
  }
  B.box(TIER_X * 2, 0.08, 0.12, STEEL, [0, railY, zr]);
  B.box(TIER_X * 2, 0.05, 0.09, STEEL, [0, topY + 0.5, zr]);
  if (sky.night) G.box(TIER_X * 2, 0.035, 0.05, 0x9fd8ff, [0, railY + 0.07, zr]);

  return seats;
}

/* ------------------------------------------------------------------- the bays */

/**
 * One dealing bay: a desk against the wall and a bank of seven screens over
 * it, four at eye level and three above, newest at the bottom left — which is
 * where a dealer's eye goes first.
 */
function bay(B, G, group, {
  cat, items, images, side, z, sky, lights,
}) {
  const { X } = HALL;
  const xWall = side * X;
  const xPanel = side * (X - 0.62);
  const yaw = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  const colorHex = new THREE.Color(cat.color).getHex();
  const pitch = PAGE_W + 0.16;
  const halfW = (pitch * 4) / 2;

  // the alcove: a darker recess with the section's colour as a reveal
  B.span(xWall, 0, z - halfW - 0.45, side * (X - 0.12), 6.4, z + halfW + 0.45, 0x20262e);
  for (const s of [-1, 1]) {
    B.box(0.55, 6.4, 0.3, colorHex, [side * (X - 0.3), 3.2, z + s * (halfW + 0.42)]);
  }
  B.box(0.55, 0.3, halfW * 2 + 1.14, colorHex, [side * (X - 0.3), 6.3, z]);

  // the desk, its return, and the clutter every dealing desk has
  B.box(1.45, 0.08, halfW * 2 + 0.4, DESK, [side * (X - 0.95), 0.76, z]);
  B.box(1.45, 0.7, 0.12, 0x3a3229, [side * (X - 0.95), 0.4, z - halfW - 0.1]);
  B.box(1.45, 0.7, 0.12, 0x3a3229, [side * (X - 0.95), 0.4, z + halfW + 0.1]);
  B.box(1.3, 0.06, halfW * 2 + 0.2, 0x3a3229, [side * (X - 0.95), 0.3, z]);
  const r = rng(Math.round(1000 + z * 7 + side * 13));
  for (let i = 0; i < 5; i += 1) {
    const zz = z - halfW + 0.6 + r() * (halfW * 2 - 1.2);
    if (r() > 0.5) {
      // a stack of paper, which no amount of screens has ever got rid of
      B.box(0.3, 0.06 + r() * 0.1, 0.42, 0xd8d2c4, [side * (X - 1.3), 0.84, zz]);
    } else {
      // a mug
      B.cyl(0.05, 0.11, 0xe4e7ea, [side * (X - 1.25), 0.86, zz]);
    }
    if (i === 2) {
      // a desk phone with a row of line buttons — still the fastest thing here
      B.box(0.26, 0.07, 0.34, 0x22272e, [side * (X - 0.78), 0.84, zz]);
      G.box(0.03, 0.01, 0.2, 0x7fffb0, [side * (X - 0.72), 0.88, zz]);
    }
  }
  // a chair pulled out from the desk
  B.cyl(0.05, 0.44, 0x2f353d, [side * (X - 2.1), 0.22, z + 0.4]);
  B.cyl(0.28, 0.05, 0x2f353d, [side * (X - 2.1), 0.03, z + 0.4]);
  B.box(0.54, 0.09, 0.52, 0x30404d, [side * (X - 2.1), 0.46, z + 0.4]);
  B.box(0.1, 0.66, 0.5, 0x30404d, [side * (X - 1.85), 0.8, z + 0.4]);

  /* ---- the screens */
  const pages = [];
  const rows = [
    { n: 4, y: 2.05 },
    { n: 3, y: 3.2 },
  ];
  let k = 0;
  for (const row of rows) {
    for (let i = 0; i < row.n && k < items.length; i += 1, k += 1) {
      const zz = z + (i - (row.n - 1) / 2) * pitch;
      // the monitor's shell and its arm off the wall
      B.box(0.12, PAGE_H + 0.14, PAGE_W + 0.14, 0x181d24, [side * (X - 0.52), row.y, zz]);
      B.box(0.42, 0.07, 0.07, STEEL, [side * (X - 0.32), row.y, zz]);
      pages.push(makePage({
        item: items[k],
        cat,
        img: images[k],
        rank: k,
        sky,
        position: [xPanel, row.y, zz],
        yaw,
      }));
    }
  }
  for (const p of pages) group.add(p);

  /* ---- the bay's sign, and one light for the whole bay */
  const signW = halfW * 2 + 0.8;
  const signH = 0.86;
  const tex = signTexture(cat.label, cat.color, `${cat.en} · ${catLine(cat)}`,
    { w: 1152, h: Math.round((1152 * signH) / signW) });
  group.add(signPlane(tex, signW, signH, [side * (X - 0.35), 4.6, z], yaw, { lit: true }));
  const pl = new THREE.PointLight(0xcfe2f5, sky.night ? 18 : 9, 15, 2);
  pl.position.set(side * (X - 2.2), 4.4, z);
  lights.add(pl);

  return pages;
}

/** The concourse — the thirty metres between the doors and the bank. Empty,
 *  it reads as an unfinished level; what belongs there is what is actually in
 *  the front half of a building like this. */
function concourse(B, G, group, sky) {
  const r = rng(5150);

  // planters down both edges of the walk
  for (const s of [-1, 1]) {
    for (const z of [-18.5, -12.5, -6.5, -0.5]) {
      B.box(1.1, 0.55, 2.6, 0x6d5f4e, [s * 10.6, 0.28, z]);
      B.box(1.0, 0.06, 2.5, 0x3f3328, [s * 10.6, 0.56, z]);
      for (let i = 0; i < 3; i += 1) {
        const zz = z - 0.8 + i * 0.8;
        B.cyl(0.05, 0.7, 0x4d5c3a, [s * 10.6, 0.9, zz]);
        B.sphere(0.5, [0x3f6b35, 0x4a7a3c, 0x37622f][i % 3],
          [s * 10.6, 1.45 + r() * 0.2, zz], [1, 0.85, 1]);
      }
    }
  }

  // standing tables, the kind people put a cà phê and a phone on
  for (const [x, z] of [[-6.4, -16], [6.4, -16], [-6.4, -7], [6.4, -7]]) {
    B.cyl(0.45, 0.05, 0x3a3229, [x, 1.08, z]);
    B.cyl(0.07, 1.05, 0x5b636e, [x, 0.53, z]);
    B.cyl(0.36, 0.05, 0x5b636e, [x, 0.03, z]);
    if (r() > 0.4) B.cyl(0.05, 0.13, 0x3a2a1c, [x + 0.18, 1.17, z - 0.1]);
  }

  // a reception desk inside the doors, and the barrier line past it
  B.box(4.4, 1.05, 0.9, 0x4a3f36, [-13.5, 0.52, 2.6]);
  B.box(4.6, 0.08, 1.05, 0x2f2620, [-13.5, 1.08, 2.6]);
  B.box(4.4, 0.5, 0.1, 0x3a3229, [-13.5, 1.35, 2.9]);
  G.box(3.0, 0.03, 0.03, 0x7fd6ff, [-13.5, 1.13, 2.15]);
  group.add(signPlane(signTexture('LỄ TÂN', '#1b2129', 'Reception'),
    2.2, 0.55, [-13.5, 1.7, 2.12], 0));

  // the barrier gates people badge through on the way in
  for (const x of [-3.2, -1.0, 1.0, 3.2]) {
    B.box(0.4, 1.0, 1.5, 0x5b636e, [x, 0.5, 4.6]);
    B.box(0.36, 0.06, 1.4, 0x2f353d, [x, 1.02, 4.6]);
    G.box(0.1, 0.03, 0.1, sky.night ? 0x7fffb0 : 0x4fd08a, [x, 1.06, 4.1]);
  }
}

/* --------------------------------------------------------------- the counter */

/** The café the site is named after. CafeF is not a pun anyone made up for
 *  this scene — the paper is called a café — so the floor gets one, in the
 *  corner by the doors, where the people who have given up on the board go. */
function cafeCounter(B, G, group, sky) {
  const x = 16.5;
  const z = 6.5;
  B.box(7.0, 1.1, 1.4, 0x5c4032, [x, 0.55, z]);          // the counter
  B.box(7.2, 0.09, 1.6, 0x2f2620, [x, 1.13, z]);          // its top
  B.box(7.0, 2.6, 0.5, 0x3a2f27, [x, 1.3, z - 1.6]);      // the back fitting
  for (let i = 0; i < 3; i += 1) {
    B.box(2.0, 0.08, 0.42, 0x4a3c31, [x - 2.2 + i * 2.2, 2.1, z - 1.45]); // shelves
    B.cyl(0.07, 0.2, pick(rng(31 + i), [0xd8d2c4, 0xc0392b, 0x2f4858]),
      [x - 2.2 + i * 2.2, 2.24, z - 1.45]);
  }
  // the machine, and the steam wand's little red light
  B.box(0.9, 0.55, 0.6, 0x9aa3ad, [x - 2.4, 1.45, z - 0.2]);
  B.box(0.9, 0.1, 0.62, 0x2f353d, [x - 2.4, 1.2, z - 0.2]);
  G.box(0.06, 0.04, 0.04, 0xff6b6b, [x - 2.0, 1.62, z + 0.1]);
  // glasses of cà phê sữa đá lined up on the counter, which is the whole point
  for (let i = 0; i < 5; i += 1) {
    B.cyl(0.055, 0.15, 0x3a2a1c, [x + 0.4 + i * 0.5, 1.24, z + 0.3]);
    B.cyl(0.058, 0.03, 0xd8cfc0, [x + 0.4 + i * 0.5, 1.33, z + 0.3]);
  }
  // stools
  for (let i = 0; i < 5; i += 1) {
    B.cyl(0.2, 0.05, 0x8a5a3a, [x - 2.4 + i * 1.3, 0.68, z + 1.5]);
    B.cyl(0.05, 0.66, 0x2f353d, [x - 2.4 + i * 1.3, 0.33, z + 1.5]);
  }
  const tex = signTexture('CÀ PHÊ', '#6b3f2a', 'quán trong sàn');
  group.add(signPlane(tex, 2.4, 0.6, [x, 3.1, z - 1.32], 0, { lit: sky.night }));
  if (sky.night) {
    const pl = new THREE.PointLight(0xffd6a0, 12, 12, 2);
    pl.position.set(x, 2.9, z);
    group.add(pl);
    G.sphere(0.07, 0xffe9c4, [x, 3.4, z]);
  }
}

/* ---------------------------------------------------------------- the ribbon */

/** The headline strip down both side walls, redrawn each frame by index.js. */
function ribbon(B, group, sky) {
  const c = canvas(2048, 96);
  const tex = canvasTexture(c, { anisotropy: 4 });
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const w = 20.5;
  const h = 0.96;
  const z = -15;
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(PLANE, mat);
    m.scale.set(w, h, 1);
    // BEHIND on a left-hand wall means MORE negative, not less: a bezel
    // "just behind" the plane at -21.92 has to sit at -21.96, and the first
    // attempt put it at -21.74 — in front — which rendered the ribbon black.
    // The pilasters (|x| 21.5 to 22.0) do the same thing, so the strip stands
    // clear of both, 0.6 m off the wall, with its bezel 0.03 behind it.
    m.position.set(s * (HALL.X - 0.6), 7.6, z);
    m.rotation.y = s < 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(m);
    B.box(0.3, h + 0.24, w + 0.3, 0x14181e, [s * (HALL.X - 0.42), 7.6, z]);
    // a pair of brackets back to the wall, so it is hung and not floating
    for (const dz of [-w / 2 + 0.4, 0, w / 2 - 0.4]) {
      B.box(0.62, 0.08, 0.08, STEEL, [s * (HALL.X - 0.31), 7.6, z + dz]);
    }
  }
  if (sky.night) {
    for (const s of [-1, 1]) {
      const pl = new THREE.PointLight(0xffb45a, 5, 14, 2);
      pl.position.set(s * (HALL.X - 2.4), 7.2, z);
      group.add(pl);
    }
  }
  return { canvas: c, texture: tex };
}

/* ------------------------------------------------------------------- export */

export function buildHall({
  data, market, images, sky, board,
}) {
  const B = new Batch(); // matte
  const G = new Batch(); // self-lit
  const group = new THREE.Group();
  group.name = 'cafef-hall';
  const solidMat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.9, metalness: 0.05,
  });
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const lights = new THREE.Group();
  group.add(lights);

  shell(B, G, group, sky);
  const seats = bank(B, G, sky);

  /* ---- the board, at the head of the room */
  // 22 m rather than the full wall: the foot of the board has to sit ABOVE
  // the back rail of the bank (2.6 m at z = -21) or the bottom row of prices
  // is invisible from the doors, and lifting it that far only leaves a 12 m
  // ceiling room for 22 m of board plus its header.
  const gridW = 22;
  const gridH = gridW / board.aspectGrid;      // 5.5 m
  const headH = gridW / board.aspectHead;      // 2.41 m
  const gridBottom = 3.5;
  const zPanel = HALL.Z_BOARD + 0.5;
  const gridMesh = new THREE.Mesh(PLANE, new THREE.MeshBasicMaterial({
    map: board.gridTex, toneMapped: false,
  }));
  gridMesh.scale.set(gridW, gridH, 1);
  gridMesh.position.set(0, gridBottom + gridH / 2, zPanel);
  gridMesh.name = 'board_grid';
  group.add(gridMesh);

  const headMesh = new THREE.Mesh(PLANE, new THREE.MeshBasicMaterial({
    map: board.headTex, toneMapped: false,
  }));
  headMesh.scale.set(gridW, headH, 1);
  headMesh.position.set(0, gridBottom + gridH + 0.3 + headH / 2, zPanel);
  headMesh.name = 'board_head';
  group.add(headMesh);

  // the board's own spill onto the room — the only light in here at 22:00 that
  // is not a ceiling trough, and the reason the front rows look blue
  const spill = new THREE.PointLight(0x9fd0ff, sky.night ? 34 : 16, 40, 2);
  spill.position.set(0, 7, HALL.Z_BOARD + 5);
  lights.add(spill);

  // The masthead cannot go over the board — the header panel runs to within
  // seven tenths of the ceiling — so it flanks it instead, on the two blank
  // returns either side, and hangs again over the doors for anyone leaving.
  const mast = mastheadTexture(data);
  for (const s of [-1, 1]) {
    group.add(signPlane(mast, 5.2, 1.3,
      [s * 16.9, 8.4, HALL.Z_BOARD + 0.45], 0, { lit: true }));
  }
  group.add(signPlane(mast, 5.2, 1.3,
    [0, 9.2, HALL.Z_FRONT - 0.4], Math.PI, { lit: true }));
  group.add(signPlane(
    signTexture('SÀN BẢNG ĐIỆN', '#1b2129', vnDateLine()),
    5.0, 1.25, [0, 1.5, HALL.Z_BOARD + 0.45], 0,
  ));

  /* ---- the bays, four a side */
  const pages = [];
  data.cats.forEach((cat, i) => {
    if (i >= BAY_Z.length * 2 || !cat.items.length) return;
    const side = i % 2 ? 1 : -1;
    const z = BAY_Z[Math.floor(i / 2)];
    const offset = data.cats.slice(0, i).reduce((n, c) => n + c.items.length, 0);
    pages.push(...bay(B, G, group, {
      cat,
      items: cat.items,
      images: images.slice(offset, offset + cat.items.length),
      side,
      z,
      sky,
      lights,
    }));
  });

  concourse(B, G, group, sky);
  cafeCounter(B, G, group, sky);
  const strip = ribbon(B, group, sky);

  /* ---- merge */
  const solid = B.build(solidMat);
  if (solid) group.add(solid);
  const glow = G.build(glowMat);
  if (glow) group.add(glow);

  return {
    group, pages, seats, ticker: strip, lights, market,
  };
}
