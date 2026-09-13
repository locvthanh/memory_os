// The Back Office, part 2 of 4: everything with words on it.
//
// The Blender build set real text objects in Segoe UI and exported them as
// geometry, which is a megabyte of glb and cannot change after the export.
// Here every sign is a canvas painted at load — so a door plate simply says
// whatever that scene is called in the registry right now, diacritics and all.
import * as THREE from 'three';
import { canvas, canvasTexture, FONT } from '../kit.js';

const INK = '#2b2622';
const PLATE = '#f4f0e4';

const PX = 170; // canvas pixels per metre — legible from 3.3 m, cheap to hold

function planeFor(c, w, h, { transparent = false, emissive = 0 } = {}) {
  const mat = new THREE.MeshStandardMaterial({
    map: canvasTexture(c),
    roughness: 0.86,
    metalness: 0,
    transparent,
    ...(emissive ? { emissive: new THREE.Color(emissive), emissiveIntensity: 0.35 } : {}),
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.userData.disposeSign = () => {
    mat.map.dispose();
    mat.dispose();
    mesh.geometry.dispose();
  };
  return mesh;
}

/** Face a sign: 0 = +z (into the office / down the corridor), or a wall side. */
export const FACE = {
  south: 0,                 // normal +z
  north: Math.PI,           // normal -z
  west: Math.PI / 2,        // normal +x  (a sign ON the west wall)
  east: -Math.PI / 2,       // normal -x  (a sign ON the east wall)
};

export function place(mesh, [x, y, z], yaw = 0) {
  mesh.position.set(x, y, z);
  mesh.rotation.y = yaw;
  return mesh;
}

/**
 * A door's name plate. One line, shrunk until the title fits — "THE CFA
 * FINANCIAL DISTRICT" and "THE STACK" are the same plate.
 */
export function namePlate(title, w = 1.41, h = 0.32) {
  const c = canvas(Math.round(w * PX), Math.round(h * PX));
  const g = c.getContext('2d');
  g.fillStyle = PLATE;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const text = String(title).toUpperCase();
  let size = Math.round(h * PX * 0.46);
  do {
    g.font = `600 ${size}px ${FONT}`;
    size -= 1;
  } while (g.measureText(text).width > c.width * 0.92 && size > 8);
  g.fillText(text, c.width / 2, c.height / 2 + 1);
  return planeFor(c, w, h);
}

/** The brass disc beside the handle: the door's own number. */
export function numberPlate(n, w = 0.20, h = 0.26) {
  const c = canvas(Math.round(w * PX * 2), Math.round(h * PX * 2));
  const g = c.getContext('2d');
  g.fillStyle = '#b08d3f';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#2a2114';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `700 ${Math.round(c.height * 0.52)}px ${FONT}`;
  g.fillText(String(n).padStart(2, '0'), c.width / 2, c.height / 2 + 2);
  return planeFor(c, w, h);
}

/** A wing banner hung across the corridor: NAME · count. */
export function banner(name, count, w = 5.1, h = 0.40) {
  const c = canvas(Math.round(w * PX), Math.round(h * PX));
  const g = c.getContext('2d');
  g.fillStyle = PLATE;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${Math.round(h * PX * 0.5)}px ${FONT}`;
  g.fillText(`${name.toUpperCase()}  ·  ${count}`, c.width / 2, c.height / 2 + 1);
  return planeFor(c, w, h);
}

/** Any free-standing lettering: the blank slot, KEYS, THE MAP, NOT YET BUILT. */
export function label(text, w, h, { size = 0.62, weight = '600', bg = null, color = INK } = {}) {
  const c = canvas(Math.round(w * PX), Math.round(h * PX));
  const g = c.getContext('2d');
  if (bg) {
    g.fillStyle = bg;
    g.fillRect(0, 0, c.width, c.height);
  }
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `${weight} ${Math.round(h * PX * size)}px ${FONT}`;
  g.fillText(String(text), c.width / 2, c.height / 2 + 1);
  return planeFor(c, w, h, { transparent: !bg });
}

/** The whiteboard, written on. */
export function whiteboard(lines, w = 2.86, h = 1.46) {
  const c = canvas(Math.round(w * PX), Math.round(h * PX));
  const g = c.getContext('2d');
  g.fillStyle = '#f8f9fb';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let y = c.height * 0.30;
  lines.forEach((line, i) => {
    const px = i === 0 ? 0.13 : 0.085;
    g.font = `${i === 0 ? '700' : '500'} ${Math.round(c.height * px)}px ${FONT}`;
    g.fillStyle = i === 0 ? INK : '#5a544c';
    g.fillText(line, c.width / 2, y);
    y += c.height * (i === 0 ? 0.26 : 0.17);
  });
  return planeFor(c, w, h);
}

/** The register, open on the desk: what the room is for, in two lines. */
export function register(orphans, scenes, w = 0.78, h = 0.52) {
  const c = canvas(Math.round(w * PX * 3), Math.round(h * PX * 3));
  const g = c.getContext('2d');
  g.fillStyle = '#f5f1e6';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#cdc4b2';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(c.width / 2, 6);
  g.lineTo(c.width / 2, c.height - 6);
  g.stroke();
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `700 ${Math.round(c.height * 0.17)}px ${FONT}`;
  g.fillText('ORPHANS', c.width / 2, c.height * 0.3);
  g.font = `500 ${Math.round(c.height * 0.12)}px ${FONT}`;
  g.fillStyle = '#5a544c';
  g.fillText(`${orphans} of ${scenes}`, c.width / 2, c.height * 0.52);
  // ruled lines, one per orphan, the way a ledger would carry them
  g.strokeStyle = '#ded5c2';
  g.lineWidth = 1.5;
  const rows = Math.min(orphans, 9);
  for (let i = 0; i < rows; i += 1) {
    const y = c.height * (0.66 + i * 0.035);
    g.beginPath();
    g.moveTo(c.width * 0.08, y);
    g.lineTo(c.width * 0.92, y);
    g.stroke();
  }
  return planeFor(c, w, h);
}

/** The framed plan by the arch: the corridor as actually built, in plan view. */
export function plan(bays, w = 1.38, h = 0.98) {
  const c = canvas(Math.round(w * PX * 2), Math.round(h * PX * 2));
  const g = c.getContext('2d');
  g.fillStyle = '#f5f1e6';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `600 ${Math.round(c.height * 0.085)}px ${FONT}`;
  g.fillText('THE BACK OFFICE', c.width / 2, c.height * 0.1);
  const top = c.height * 0.2;
  const bot = c.height * 0.92;
  const mid = c.width / 2;
  g.fillStyle = '#3b342c';
  g.fillRect(mid - c.width * 0.055, top, c.width * 0.11, bot - top);
  const step = (bot - top) / bays;
  for (let i = 0; i < bays; i += 1) {
    const y = top + step * (i + 0.5) - step * 0.16;
    for (const s of [-1, 1]) {
      g.fillRect(mid + s * c.width * 0.055 - (s < 0 ? c.width * 0.05 : 0),
        y, c.width * 0.05, step * 0.32);
    }
  }
  g.font = `500 ${Math.round(c.height * 0.055)}px ${FONT}`;
  g.fillStyle = '#6b6257';
  g.fillText(`${bays} bays`, mid, c.height * 0.965);
  return planeFor(c, w, h);
}
