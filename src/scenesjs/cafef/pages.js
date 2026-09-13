// One story = one screen in a bay.
//
// Phố Báo Sáng puts its stories on newsprint behind glass, because that is
// what a Vietnamese street does with a newspaper. This room is the other half
// of the same country: CafeF is read on a monitor, at a desk, with a board
// over your shoulder — so a story here is a BACKLIT PANEL, dark and cool, with
// a hairline of its section's colour down the left edge and a timestamp that
// matters, because in this building a headline four hours old is already an
// old headline.
//
// The panel is 16:10 rather than the street's squarer page, and the photo is
// not halftoned: on a screen you want the photograph to look like a
// photograph. What it gets instead is a slight desaturation and a dark scrim
// at the bottom, so white type over it stays readable whatever the picture is.
//
// Each panel is one mesh with one canvas texture and is the click target for
// its own story — see hud.js, which raycasts the list this module fills.
import * as THREE from 'three';
import {
  canvas, canvasTexture, fitLines, FONT, PLANE,
} from '../kit.js';
import { viAgo } from './feed.js';

const W = 480;
const H = 300;

export const PAGE_W = 1.62;
export const PAGE_H = 1.0125; // 480:300

export function storyTexture(item, cat, img, rank) {
  const c = canvas(W, H);
  const g = c.getContext('2d');

  // the panel itself
  g.fillStyle = '#12161d';
  g.fillRect(0, 0, W, H);

  const photoH = rank === 0 ? 150 : 132;

  if (img) {
    const s = Math.max(W / img.width, photoH / img.height);
    const iw = img.width * s;
    const ih = img.height * s;
    g.save();
    g.beginPath();
    g.rect(0, 0, W, photoH);
    g.clip();
    g.drawImage(img, (W - iw) / 2, (photoH - ih) / 2, iw, ih);
    // cool the photo down a shade so it belongs to this room
    g.fillStyle = 'rgba(18,26,40,.18)';
    g.fillRect(0, 0, W, photoH);
    // and darken its foot, so the rule and the type below never fight it
    const grad = g.createLinearGradient(0, photoH - 60, 0, photoH);
    grad.addColorStop(0, 'rgba(18,22,29,0)');
    grad.addColorStop(1, 'rgba(18,22,29,.92)');
    g.fillStyle = grad;
    g.fillRect(0, photoH - 60, W, 60);
    g.restore();
  } else {
    g.fillStyle = cat.color;
    g.globalAlpha = 0.22;
    g.fillRect(0, 0, W, photoH);
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(230,238,246,.4)';
    g.font = `700 22px ${FONT}`;
    g.textAlign = 'center';
    g.fillText(cat.label, W / 2, photoH / 2 + 8);
    g.textAlign = 'left';
  }

  // the section's hairline, floor to ceiling down the left edge
  g.fillStyle = cat.color;
  g.fillRect(0, 0, 5, H);

  const pad = 18;
  let y = photoH + 22;

  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  g.fillStyle = cat.color;
  g.font = `700 15px ${FONT}`;
  g.fillText(cat.label.toUpperCase(), pad, y);
  g.textAlign = 'right';
  g.fillStyle = 'rgba(197,210,224,.52)';
  g.font = `500 14px ${FONT}`;
  g.fillText(viAgo(item.ts), W - pad, y);
  g.textAlign = 'left';

  // headline
  y += 27;
  g.fillStyle = '#eef3f8';
  const { lines, size } = fitLines(
    g, item.t, W - pad * 2, 4, rank === 0 ? 25 : 22, 14, '650',
  );
  for (const line of lines) {
    g.fillText(line, pad, y);
    y += size + 5;
  }

  // the standfirst, if there is room left under the headline
  if (item.desc && y < H - 46) {
    g.fillStyle = 'rgba(197,210,224,.5)';
    const d = fitLines(g, item.desc, W - pad * 2, H - y > 70 ? 3 : 2, 14, 12, '400');
    for (const line of d.lines) {
      g.fillText(line, pad, y + 6);
      y += d.size + 4;
    }
  }

  g.textAlign = 'right';
  g.fillStyle = 'rgba(197,210,224,.3)';
  g.font = `600 12px ${FONT}`;
  g.fillText('cafef.vn', W - pad, H - 12);

  return canvasTexture(c, { anisotropy: 8 });
}

/**
 * One readable panel. `position`/`yaw` place it; the mesh carries the story on
 * userData so the HUD can name it and open it.
 */
export function makePage({
  item, cat, img, rank, sky, position, yaw,
}) {
  const tex = storyTexture(item, cat, img, rank);
  // A screen is emissive at every hour — that is what makes it a screen — but
  // a little less so in daylight, or the hall flares at noon.
  const base = sky.night ? 0.92 : 0.62;
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.42,
    metalness: 0,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: base,
  });
  const mesh = new THREE.Mesh(PLANE, mat);
  mesh.scale.set(PAGE_W, PAGE_H, 1);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.y = yaw;
  mesh.userData = {
    story: item,
    cat,
    base,
    label: item.t,
    sub: `${cat.label} · ${viAgo(item.ts)}`,
    url: item.link,
  };
  mesh.name = `panel_${cat.key}_${rank + 1}`;
  return mesh;
}
