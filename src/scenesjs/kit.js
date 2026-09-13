// Small geometry / canvas kit for the procedural scenes under src/scenesjs/.
//
// The one idea worth knowing: `Batch`. A street like Phố Báo Sáng is a few
// thousand little boxes — shutters, kerbstones, stools, cables, leaves — and a
// mesh each would be a few thousand draw calls, which a phone will not do. So
// every static piece is pushed into a Batch: the geometry is cloned, baked
// through its own matrix, given a flat vertex colour, and at the end the whole
// pile is merged into ONE mesh with one `vertexColors: true` material. The
// street ends up as two draw calls (solid + glow) instead of two thousand.
//
// Cost of that trick: nothing is individually movable or pickable afterwards.
// Anything that has to move (people, the loudspeaker's sweep) or be clicked
// (a story page) is built as a real mesh instead — see life.js and pages.js.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Deterministic LCG — the street must look the same on every visit. */
export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const UNIT = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10, 1),
  sph: new THREE.SphereGeometry(0.5, 10, 7),
  cone: new THREE.ConeGeometry(0.5, 1, 10),
  plane: new THREE.PlaneGeometry(1, 1),
};

const _pos = new THREE.Vector3();
const _scl = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _eul = new THREE.Euler();
const _mat = new THREE.Matrix4();
const _col = new THREE.Color();

function tint(geo, color) {
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  _col.setHex(color); // setHex converts sRGB -> working space, which is what
  const { r, g, b } = _col; // a vertexColors material expects
  for (let i = 0; i < n; i += 1) {
    arr[i * 3] = r;
    arr[i * 3 + 1] = g;
    arr[i * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

export class Batch {
  constructor() {
    this.parts = [];
  }

  /** geo: a unit geometry; pos/scale [x,y,z]; rot [rx,ry,rz] radians. */
  add(geo, color, pos, scale, rot) {
    const g = geo.clone();
    _eul.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
    _quat.setFromEuler(_eul);
    _pos.set(pos[0], pos[1], pos[2]);
    _scl.set(scale[0], scale[1], scale[2]);
    _mat.compose(_pos, _quat, _scl);
    g.applyMatrix4(_mat);
    this.parts.push(tint(g, color));
    return this;
  }

  box(w, h, d, color, pos, rot) {
    return this.add(UNIT.box, color, pos, [w, h, d], rot);
  }

  /** A box given by its two opposite corners — easier for walls and kerbs. */
  span(x0, y0, z0, x1, y1, z1, color) {
    return this.box(
      Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), color,
      [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
    );
  }

  cyl(radius, h, color, pos, rot) {
    return this.add(UNIT.cyl, color, pos, [radius * 2, h, radius * 2], rot);
  }

  sphere(radius, color, pos, scale) {
    const s = scale || [1, 1, 1];
    return this.add(UNIT.sph, color, pos,
      [radius * 2 * s[0], radius * 2 * s[1], radius * 2 * s[2]]);
  }

  cone(radius, h, color, pos, rot) {
    return this.add(UNIT.cone, color, pos, [radius * 2, h, radius * 2], rot);
  }

  /** A thin box drawn from a to b — cables, wires, washing lines. */
  strut(a, b, thickness, color) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const len = Math.hypot(dx, dy, dz) || 1e-4;
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const yaw = Math.atan2(dx, dz);
    const pitch = Math.asin(clamp(dy / len, -1, 1));
    return this.box(thickness, thickness, len, color, mid, [-pitch, yaw, 0]);
  }

  build(material) {
    if (!this.parts.length) return null;
    const geo = mergeGeometries(this.parts, false);
    this.parts.length = 0;
    const mesh = new THREE.Mesh(geo, material);
    mesh.frustumCulled = false; // one mesh spanning the whole street
    return mesh;
  }
}

export function solidMaterial() {
  return new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.94, metalness: 0.02,
  });
}

/** Lit things — bulbs, LED strips, lamp heads. Unlit so night reads as night. */
export function glowMaterial() {
  return new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
}

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function canvasTexture(c, { repeat, anisotropy = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  if (repeat) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

export const FONT = '"Segoe UI", "Be Vietnam Pro", "Noto Sans", system-ui, sans-serif';

/** Wrap `text` into at most `maxLines` lines that fit `maxWidth`, shrinking
 *  the font if it has to. Returns the size actually used. Vietnamese headlines
 *  are long, so this gets used on every page in the street. */
export function fitLines(g, text, maxWidth, maxLines, startSize, minSize, weight = '600') {
  let size = startSize;
  const layout = () => {
    g.font = `${weight} ${size}px ${FONT}`;
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      const cand = line ? `${line} ${w}` : w;
      if (g.measureText(cand).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else line = cand;
    }
    if (line) lines.push(line);
    return lines;
  };
  let lines = layout();
  while (lines.length > maxLines && size > minSize) {
    size -= 1;
    lines = layout();
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -2)}…`;
  }
  return { lines, size };
}

export const PLANE = UNIT.plane;
export const UNIT_GEO = UNIT;
