// The street's clock. Everything about the light in Phố Báo Sáng comes from
// one number: what time it is in Vietnam at the moment the page loads. Open it
// at 06:00 Hanoi time and you get the paper coming off the van in a grey-pink
// dawn; open it at 21:00 and the lane bulbs are the only thing reading by.
//
// The stops below are hand-tuned rather than physical: a sun elevation model
// gives you a correct but drab sky, and this is a scene about a city waking up.
import * as THREE from 'three';
import { canvas, canvasTexture, lerp } from './kit.js';
import { vnHour } from './feed.js';

// hour, [zenith, horizon], light level, sun colour, a name for the HUD
const STOPS = [
  [0, ['#060912', '#121a2c'], 0.10, '#243350', 'khuya'],
  [4, ['#0b1226', '#2a2a44'], 0.14, '#3d3a5e', 'rạng sáng'],
  [5.5, ['#1b2a4a', '#7a5a66'], 0.28, '#b4785e', 'tờ mờ sáng'],
  [6.5, ['#3a5480', '#d59366'], 0.55, '#f0a86e', 'sáng sớm'],
  [8, ['#4f86bd', '#c8dcea'], 1.00, '#fff0d4', 'buổi sáng'],
  [12, ['#3d81c8', '#d3e4f1'], 1.20, '#fff7e6', 'giữa trưa'],
  [16, ['#4a84bd', '#dbe2e6'], 1.00, '#ffeccd', 'buổi chiều'],
  [18, ['#3a4f7a', '#e08a4e'], 0.45, '#f0a35e', 'hoàng hôn'],
  [19.5, ['#18203c', '#57405e'], 0.18, '#6a5578', 'chập tối'],
  [21, ['#0a0f20', '#141e36'], 0.11, '#243350', 'buổi tối'],
  [24, ['#060912', '#121a2c'], 0.10, '#243350', 'khuya'],
];

const mixHex = (a, b, t) =>
  new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();

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
  const night = h < 5.6 || h > 18.6;
  const level = lerp(a[2], b[2], t);
  return {
    hour: h,
    night,
    level,
    when: t < 0.5 ? a[4] : b[4],
    top: mixHex(a[1][0], b[1][0], t),
    bottom: mixHex(a[1][1], b[1][1], t),
    sun: mixHex(a[3], b[3], t),
    // Sun low and eastern in the morning, low and western in the evening; the
    // street runs north-south, so a low sun rakes it from the side.
    sunPosition: (() => {
      const day = Math.max(0, Math.min(1, (h - 5.5) / 13)); // 05:30 -> 18:30
      const az = Math.PI * (1 - day); // east -> west
      const el = Math.sin(day * Math.PI) * 0.92 + 0.06;
      return [Math.cos(az) * 90, 14 + el * 86, Math.sin(az) * 40 - 20];
    })(),
  };
}

/** A vertical gradient dome. Deliberately fog-exempt and unlit. */
export function skyDome(sky, radius = 560) {
  const c = canvas(8, 256);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, `#${sky.top.toString(16).padStart(6, '0')}`);
  grad.addColorStop(0.6, `#${sky.bottom.toString(16).padStart(6, '0')}`);
  grad.addColorStop(1, `#${sky.bottom.toString(16).padStart(6, '0')}`);
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
