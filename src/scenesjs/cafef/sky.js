// The hall's clock.
//
// Phố Báo Sáng is outdoors, so its light IS the sky. This room is not: it is a
// glazed hall with fluorescent troughs in the ceiling that are on whatever the
// hour, so the sky only reaches it through the south front and the clerestory
// — which is the point. A trading floor at 10:00 on a Tuesday is a white room
// full of people; the same floor at 21:00 is the board still lit over empty
// chairs, and the way you tell them apart is the daylight in the glass.
//
// The stops are cooler and greyer than the street's on purpose. Phố Báo Sáng
// is a warm scene about paper; this is a cold one about screens.
import * as THREE from 'three';
import { canvas, canvasTexture, lerp } from '../kit.js';
import { vnHour } from './feed.js';

// hour, [zenith, horizon], daylight level, sun colour, a name for the HUD
const STOPS = [
  [0, ['#05070e', '#0d1220'], 0.08, '#1b2740', 'khuya'],
  [4.5, ['#080e1e', '#1e2338'], 0.12, '#2f3450', 'rạng sáng'],
  [6, ['#1d2c48', '#6e5f6a'], 0.30, '#9d7f76', 'tờ mờ sáng'],
  [7, ['#3d5c86', '#b79a86'], 0.60, '#e2b491', 'sáng sớm'],
  [9, ['#4e83b8', '#c9d9e6'], 1.05, '#fbf3e2', 'phiên sáng'],
  [12, ['#3f7fc2', '#d6e3ee'], 1.22, '#fdf8ec', 'giữa trưa'],
  [15, ['#4a83bb', '#dbe1e6'], 1.02, '#f7eedd', 'phiên chiều'],
  [17.5, ['#3b5077', '#cf8b62'], 0.52, '#e9a271', 'cuối chiều'],
  [18.8, ['#1a2240', '#4f4260'], 0.20, '#645a7a', 'chập tối'],
  [20.5, ['#0a1020', '#141d33'], 0.10, '#1f2b46', 'buổi tối'],
  [24, ['#05070e', '#0d1220'], 0.08, '#1b2740', 'khuya'],
];

const mixHex = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();

export function skyFor(h = vnHour()) {
  let a = STOPS[0];
  let b = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i += 1) {
    if (h >= STOPS[i][0] && h <= STOPS[i + 1][0]) {
      a = STOPS[i];
      b = STOPS[i + 1];
      break;
    }
  }
  const t = (h - a[0]) / Math.max(0.001, b[0] - a[0]);
  const night = h < 5.9 || h > 18.4;
  const level = lerp(a[2], b[2], t);
  return {
    hour: h,
    night,
    level,
    when: t < 0.5 ? a[4] : b[4],
    top: mixHex(a[1][0], b[1][0], t),
    bottom: mixHex(a[1][1], b[1][1], t),
    sun: mixHex(a[3], b[3], t),
    // The hall's glass front faces south (+z), so the sun crosses it from the
    // left through the morning and off the right shoulder in the afternoon.
    sunPosition: (() => {
      const day = Math.max(0, Math.min(1, (h - 6) / 12.5)); // 06:00 -> 18:30
      const az = Math.PI * (1 - day);
      const el = Math.sin(day * Math.PI) * 0.9 + 0.07;
      return [Math.cos(az) * 120, 22 + el * 110, 60 + Math.sin(az) * 30];
    })(),
  };
}

/** A vertical gradient dome, seen only through the glass. Fog-exempt, unlit. */
export function skyDome(sky, radius = 620) {
  const c = canvas(8, 256);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  const hex = (v) => `#${v.toString(16).padStart(6, '0')}`;
  grad.addColorStop(0, hex(sky.top));
  grad.addColorStop(0.62, hex(sky.bottom));
  grad.addColorStop(1, hex(sky.bottom));
  g.fillStyle = grad;
  g.fillRect(0, 0, 8, 256);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 16),
    new THREE.MeshBasicMaterial({
      map: canvasTexture(c, { anisotropy: 1 }),
      side: THREE.BackSide,
      fog: false,
      toneMapped: false,
    }),
  );
  dome.name = 'sky';
  return dome;
}
