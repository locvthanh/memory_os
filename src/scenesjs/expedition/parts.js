// The building kit for The Endless Survey.
//
// One idea runs through all of it: a room is a polygon and everything in the
// room is placed by (face index, offset along that face, height). `facePos`
// below is the whole coordinate system. Rooms are octagons and the rotunda is
// a twelve-sided drum, but nothing else in this file cares which.
//
// Everything static goes into a Batch (see ../kit.js) and comes out as one
// merged mesh per room, because a room is roughly 500 little boxes -- panels,
// balusters, book spines, brass -- and this scene may have a dozen rooms open
// at once. Only the things that have to be READ are real meshes: door plates,
// the lectern page, the mural. Those are what the crosshair raycasts against.
import * as THREE from 'three';
import { Batch, canvas, canvasTexture, FONT, fitLines, rng } from '../kit.js';

// Oak, brass, green glass, gaslight. A Victorian expedition library, which is
// what an encyclopedia is if you make it a building.
export const PAL = {
  floorA: 0x4a331f, floorB: 0x2f2013, floorInlay: 0x8a6a34,
  skirting: 0x2a1c11,
  panel: 0x53381f, panelDark: 0x3a2616, panelLight: 0x6d4c2b,
  pier: 0x45301c, lintel: 0x5b3f24,
  plaster: 0xc9b795, plasterDark: 0x9e8c6c,
  ceiling: 0xb5a181, rib: 0x6b4f31,
  brass: 0xb98b3c, brassDark: 0x6f5320,
  marble: 0xc9c0ac, marbleDark: 0x8d8574,
  carpet: 0x6b2226, carpetTrim: 0xb8963f,
  shadeOut: 0x14472f, shadeIn: 0x8ff0bd,
  flame: 0xffd79a,
  glass: 0xbfe4ef,
  cloth: 0x2c3a44,
  books: [0x6b2226, 0x2f4a33, 0x3a3560, 0x6b4a1e, 0x4a2340, 0x25404a, 0x7a5a24],
};

/** Where a point sits on face `i` of an `n`-gon of circumradius `R`:
 *  `s` slides along that face, `y` is height. Also hands back the face's
 *  outward normal and its yaw, because everything that stands against a wall
 *  needs all three. */
export function facePos(R, n, i, s = 0, y = 0) {
  const phi = ((i + 0.5) * Math.PI * 2) / n;
  const a = R * Math.cos(Math.PI / n);
  const nx = Math.cos(phi);
  const nz = Math.sin(phi);
  const tx = -Math.sin(phi);
  const tz = Math.cos(phi);
  return {
    phi,
    apothem: a,
    width: 2 * R * Math.sin(Math.PI / n),
    normal: [nx, 0, nz],
    yaw: -phi,
    pos: [a * nx + tx * s, y, a * nz + tz * s],
    at: (depth, slide, height) => [
      (a + depth) * nx + tx * slide,
      height,
      (a + depth) * nz + tz * slide,
    ],
  };
}

/** A box lying along the segment a->b, `w` wide and `h` tall. Corridors,
 *  handrails, anything that runs from one place to another. */
export function orientedBox(bat, a, b, w, h, color) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  const len = Math.hypot(dx, dy, dz) || 1e-4;
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const yaw = Math.atan2(dx, dz);
  const pitch = Math.asin(Math.max(-1, Math.min(1, dy / len)));
  bat.box(w, h, len, color, mid, [-pitch, yaw, 0]);
}

const POLY = {};
function polyGeo(n) {
  if (!POLY[n]) POLY[n] = new THREE.CylinderGeometry(0.5, 0.5, 1, n, 1);
  return POLY[n];
}

/** A regular prism: floors, plinths, drums, lantern towers. */
export function prism(bat, n, radius, h, color, pos, yaw = 0) {
  bat.add(polyGeo(n), color, pos, [radius * 2, h, radius * 2], [0, yaw, 0]);
}

// ------------------------------------------------------------------ shell

/**
 * The room itself: floor, skirting, panelled walls with an opening cut in
 * every face listed in `openings`, a ribbed ceiling and a lantern.
 * `openings` is a Map of face index -> { width, height }.
 */
export function roomShell(bat, glow, {
  n = 8, R = 9.5, H = 6.2, openings = new Map(), seed = 1,
  floorA = PAL.floorA, floorB = PAL.floorB, carpet = true,
} = {}) {
  const r = rng(seed);
  const T = 0.55; // wall thickness

  // floor: a plate, then a ring of inlay, then a compass of wedges
  prism(bat, n, R + T, 0.4, floorB, [0, -0.2, 0]);
  prism(bat, n, R * 0.99, 0.06, floorA, [0, 0.03, 0]);
  prism(bat, n, R * 0.62, 0.07, floorB, [0, 0.05, 0]);
  prism(bat, n, R * 0.58, 0.08, PAL.floorInlay, [0, 0.06, 0]);
  prism(bat, n, R * 0.55, 0.09, floorA, [0, 0.07, 0]);
  if (carpet) {
    prism(bat, n, R * 0.34, 0.1, PAL.carpet, [0, 0.09, 0]);
    prism(bat, n, R * 0.30, 0.12, PAL.carpetTrim, [0, 0.1, 0]);
    prism(bat, n, R * 0.28, 0.13, PAL.carpet, [0, 0.11, 0]);
  }

  for (let i = 0; i < n; i += 1) {
    const f = facePos(R, n, i);
    const W = f.width;
    const cut = openings.get(i);
    const put = (w, h, slide, y, color) => {
      const t = [-Math.sin(f.phi), 0, Math.cos(f.phi)];
      bat.box(T, h, w, color, [
        f.apothem * f.normal[0] + t[0] * slide,
        y,
        f.apothem * f.normal[2] + t[2] * slide,
      ], [0, f.yaw, 0]);
    };

    if (cut) {
      const pw = (W - cut.width) / 2;
      put(pw, H, (cut.width + pw) / 2, H / 2, PAL.pier);
      put(pw, H, -(cut.width + pw) / 2, H / 2, PAL.pier);
      put(cut.width, H - cut.height, 0, cut.height + (H - cut.height) / 2, PAL.lintel);
      // an arched-looking head: three stepped courses under the lintel
      for (let k = 0; k < 3; k += 1) {
        put(cut.width - 0.5 - k * 0.55, 0.18, 0, cut.height + 0.1 + k * 0.2, PAL.brassDark);
      }
    } else {
      // dado, panels, frieze
      put(W, 1.1, 0, 0.55, PAL.panelDark);
      put(W, 0.12, 0, 1.16, PAL.brassDark);
      const panels = 3;
      const pwid = (W - 0.5) / panels;
      for (let k = 0; k < panels; k += 1) {
        const slide = -W / 2 + 0.25 + pwid * (k + 0.5);
        put(pwid - 0.22, H - 2.2, slide, 1.2 + (H - 2.2) / 2, PAL.panel);
        put(pwid - 0.7, H - 2.9, slide, 1.4 + (H - 2.9) / 2, PAL.panelLight);
      }
      put(W, 0.5, 0, H - 0.75, PAL.plaster);
      put(W, 0.22, 0, H - 0.4, PAL.brassDark);
    }
  }

  // ceiling: a coffered plate, ribs from each corner, and a lantern
  prism(bat, n, R + T, 0.5, PAL.ceiling, [0, H + 0.25, 0]);
  for (let i = 0; i < n; i += 1) {
    const f = facePos(R, n, i);
    orientedBox(bat, [0, H - 0.12, 0],
      [f.apothem * f.normal[0], H - 0.12, f.apothem * f.normal[2]],
      0.3, 0.28, PAL.rib);
  }
  prism(bat, n, R * 0.26, 0.5, PAL.rib, [0, H + 0.1, 0]);
  prism(bat, n, R * 0.22, 0.7, PAL.plaster, [0, H + 0.5, 0]);
  // the lantern glass: the room's own daylight, and the reason the ceiling
  // is never a black lid overhead
  prism(glow, n, R * 0.2, 0.12, 0xfff0cf, [0, H - 0.02, 0]);

  return { r, T };
}

// ------------------------------------------------------------- furnishings

/** A brass bracket with a green glass shade. The light in this world. */
export function sconce(bat, glow, pos, yaw, scale = 1) {
  const s = scale;
  const [x, y, z] = pos;
  const out = [Math.cos(yaw), 0, Math.sin(yaw)];
  bat.box(0.16 * s, 0.16 * s, 0.16 * s, PAL.brass, [x, y, z]);
  bat.strut([x, y, z], [x + out[0] * 0.7 * s, y + 0.28 * s, z + out[2] * 0.7 * s],
    0.09 * s, PAL.brass);
  const hx = x + out[0] * 0.75 * s;
  const hz = z + out[2] * 0.75 * s;
  bat.cone(0.34 * s, 0.3 * s, PAL.shadeOut, [hx, y + 0.44 * s, hz], [Math.PI, 0, 0]);
  glow.sphere(0.15 * s, PAL.flame, [hx, y + 0.26 * s, hz]);
}

/** A run of books along a shelf, tangentially. */
export function books(bat, r, from, to, y, depth, phi) {
  const t = [-Math.sin(phi), 0, Math.cos(phi)];
  const nrm = [Math.cos(phi), 0, Math.sin(phi)];
  let s = from;
  while (s < to - 0.06) {
    const w = 0.07 + r() * 0.09;
    const h = 0.32 + r() * 0.2;
    const x = nrm[0] * depth + t[0] * (s + w / 2);
    const z = nrm[2] * depth + t[2] * (s + w / 2);
    bat.box(0.22, h, w, PAL.books[Math.floor(r() * PAL.books.length)],
      [x, y + h / 2, z], [0, -phi, 0]);
    s += w + 0.012;
  }
}

/** A bookcase standing flat against face `i`. */
export function bookcase(bat, r, R, n, i, slide, width, height = 3.2) {
  const f = facePos(R, n, i);
  const t = [-Math.sin(f.phi), 0, Math.cos(f.phi)];
  const base = (depth, w, h, sl, y, color) => bat.box(depth, h, w, color, [
    (f.apothem - depth / 2 - 0.3) * f.normal[0] + t[0] * sl,
    y,
    (f.apothem - depth / 2 - 0.3) * f.normal[2] + t[2] * sl,
  ], [0, f.yaw, 0]);
  base(0.7, width, 0.3, slide, 0.15, PAL.panelDark);
  base(0.6, width, height, slide, height / 2 + 0.3, PAL.panelDark);
  base(0.12, width + 0.3, 0.22, slide, height + 0.42, PAL.brassDark);
  const shelves = 4;
  for (let k = 0; k < shelves; k += 1) {
    const y = 0.45 + (height / shelves) * k;
    base(0.56, width - 0.1, 0.06, slide, y, PAL.panel);
    books(bat, r, slide - width / 2 + 0.08, slide + width / 2 - 0.08, y + 0.03,
      f.apothem - 0.62, f.phi);
  }
}

// ------------------------------------------------------------------ plates

const TEX = [];

/** A canvas-backed plane. Everything readable in this world is one of these;
 *  they are real meshes so the crosshair can hit them. */
export function plate(w, h, px, py, draw, { emissive = 0x000000, intensity = 0 } = {}) {
  const c = canvas(px, py);
  draw(c.getContext('2d'), px, py);
  const tex = canvasTexture(c);
  TEX.push(tex);
  const mat = new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.85, metalness: 0.05,
    emissive: new THREE.Color(emissive), emissiveMap: tex, emissiveIntensity: intensity,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  // NOT on userData: every caller overwrites userData wholesale with what the
  // crosshair needs to read, and hanging the disposer there meant it was
  // quietly thrown away and the canvas leaked on every room taken down.
  mesh.disposePlate = () => { tex.dispose(); mat.dispose(); mesh.geometry.dispose(); };
  return mesh;
}

const BRASS_BG = '#8a6a2e';

/** The engraved brass plate under everything: a door, a case, a plinth. */
export function brassPlate(w, h, title, sub, { px = 700, py = 220 } = {}) {
  return plate(w, h, px, py, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, py);
    grad.addColorStop(0, '#c9a253');
    grad.addColorStop(0.5, BRASS_BG);
    grad.addColorStop(1, '#a7823a');
    g.fillStyle = grad;
    g.fillRect(0, 0, px, py);
    g.strokeStyle = 'rgba(50,34,10,0.55)';
    g.lineWidth = 6;
    g.strokeRect(10, 10, px - 20, py - 20);
    g.fillStyle = '#241708';
    g.textBaseline = 'top';
    const t = fitLines(g, title, px - 64, 2, 54, 30, '700');
    g.font = `700 ${t.size}px ${FONT}`;
    let y = sub ? 34 : 54;
    for (const line of t.lines) {
      g.fillText(line, 32, y);
      y += t.size * 1.12;
    }
    if (sub) {
      g.fillStyle = 'rgba(36,23,8,0.78)';
      const s = fitLines(g, sub, px - 64, 2, 30, 20, '500');
      g.font = `500 ${s.size}px ${FONT}`;
      for (const line of s.lines) {
        g.fillText(line, 32, y + 6);
        y += s.size * 1.12;
      }
    }
  }, { emissive: 0xffd79a, intensity: 0.18 });
}

/** A page of the encyclopedia, printed. Used for the lectern. */
export function pageplate(w, h, { title, description, extract, footer }) {
  const px = 1024;
  const py = Math.round((px * h) / w);
  return plate(w, h, px, py, (g) => {
    g.fillStyle = '#efe6d2';
    g.fillRect(0, 0, px, py);
    g.fillStyle = '#e4d9c0';
    g.fillRect(0, 0, px, 8);
    g.fillStyle = '#2a2118';
    g.textBaseline = 'top';
    const t = fitLines(g, (title || '').toUpperCase(), px - 120, 2, 66, 34, '700');
    g.font = `700 ${t.size}px ${FONT}`;
    let y = 52;
    for (const line of t.lines) { g.fillText(line, 60, y); y += t.size * 1.1; }
    if (description) {
      g.fillStyle = '#6a5a3f';
      const d = fitLines(g, description, px - 120, 1, 34, 24, '600');
      g.font = `italic 600 ${d.size}px ${FONT}`;
      g.fillText(d.lines[0], 60, y + 8);
      y += d.size * 1.5;
    }
    g.strokeStyle = '#9a8253';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(60, y + 14);
    g.lineTo(px - 60, y + 14);
    g.stroke();
    y += 38;
    g.fillStyle = '#332a1f';
    const maxLines = Math.max(2, Math.floor((py - y - 80) / 40));
    const b = fitLines(g, extract || '', px - 120, maxLines, 33, 22, '400');
    g.font = `400 ${b.size}px ${FONT}`;
    for (const line of b.lines) { g.fillText(line, 60, y); y += b.size * 1.34; }
    if (footer) {
      g.fillStyle = '#8a7450';
      g.font = `600 24px ${FONT}`;
      g.fillText(footer, 60, py - 52);
    }
  }, { emissive: 0xfff0cf, intensity: 0.34 });
}

/** A framed picture: the article's own photograph, or an empty mount. */
export function picture(w, h, image) {
  const px = 768;
  const py = Math.round((px * h) / w);
  return plate(w, h, px, py, (g) => {
    g.fillStyle = '#1d160f';
    g.fillRect(0, 0, px, py);
    const m = 22;
    if (image) {
      const iw = px - m * 2;
      const ih = py - m * 2;
      const scale = Math.max(iw / image.width, ih / image.height);
      const dw = image.width * scale;
      const dh = image.height * scale;
      g.save();
      g.beginPath();
      g.rect(m, m, iw, ih);
      g.clip();
      g.drawImage(image, m + (iw - dw) / 2, m + (ih - dh) / 2, dw, dh);
      g.restore();
    } else {
      g.fillStyle = '#2b2117';
      g.fillRect(m, m, px - m * 2, py - m * 2);
      g.fillStyle = '#6a5a3f';
      g.font = `600 30px ${FONT}`;
      g.textAlign = 'center';
      g.fillText('NO PLATE ENGRAVED', px / 2, py / 2 - 14);
      g.textAlign = 'left';
    }
    g.strokeStyle = '#b98b3c';
    g.lineWidth = 10;
    g.strokeRect(m - 5, m - 5, px - m * 2 + 10, py - m * 2 + 10);
  }, { emissive: 0xffffff, intensity: 0.22 });
}

export function disposeAllTextures() {
  for (const t of TEX) t.dispose();
  TEX.length = 0;
}

export { Batch };
