// One story = one page of newsprint pasted behind glass.
//
// Room OS hangs each story on a lit board on a post out in an open plaza. This
// street does the other thing Vietnamese cities actually do with a newspaper:
// the bảng tin — a long glazed case bolted to a wall with the day's pages
// pinned inside it, and people standing in front of it reading for free. So
// the page here is newsprint, not a screen: warm paper, black headline, a rule
// in the section's colour, and the photo halftoned a touch so it reads as
// print rather than as a monitor hanging in an alley.
//
// Each page is one mesh with one canvas texture and is the click target for
// its own story (see hud.js). Everything around it — the case, the glass, the
// hood, the bulb — is batched into the street's single static mesh.
import * as THREE from 'three';
import { canvas, canvasTexture, fitLines, FONT, PLANE } from './kit.js';
import { viAgo } from './feed.js';

const W = 448;
const H = 336;

export const PAGE_W = 1.46;
export const PAGE_H = 1.095; // 448:336

function halftone(g, x, y, w, h, strength) {
  // A very cheap print texture: a fine dark grid at low alpha. Enough to stop
  // the photo reading as a glowing rectangle, cheap enough to run 56 times.
  g.save();
  g.globalAlpha = strength;
  g.fillStyle = '#2a2620';
  for (let j = 0; j < h; j += 3) {
    for (let i = (j / 3) % 2 ? 0 : 1; i < w; i += 3) g.fillRect(x + i, y + j, 1, 1);
  }
  g.restore();
}

export function storyTexture(item, cat, img, rank) {
  const c = canvas(W, H);
  const g = c.getContext('2d');

  // newsprint
  g.fillStyle = '#efe8d9';
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(140,120,86,.07)';
  for (let i = 0; i < 220; i += 1) {
    g.fillRect(Math.random() * W, Math.random() * H, 1.6, 1.6);
  }

  const pad = 13;
  const ph = 168;

  // photo
  if (img) {
    const s = Math.max((W - pad * 2) / img.width, ph / img.height);
    const iw = img.width * s;
    const ih = img.height * s;
    g.save();
    g.beginPath();
    g.rect(pad, pad, W - pad * 2, ph);
    g.clip();
    g.drawImage(img, pad + (W - pad * 2 - iw) / 2, pad + (ph - ih) / 2, iw, ih);
    g.restore();
    halftone(g, pad, pad, W - pad * 2, ph, 0.16);
  } else {
    g.fillStyle = cat.color;
    g.globalAlpha = 0.16;
    g.fillRect(pad, pad, W - pad * 2, ph);
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(40,36,30,.35)';
    g.font = `700 20px ${FONT}`;
    g.textAlign = 'center';
    g.fillText(cat.label, W / 2, pad + ph / 2);
    g.textAlign = 'left';
  }

  // section rule
  let y = pad + ph + 16;
  g.fillStyle = cat.color;
  g.fillRect(pad, y - 10, W - pad * 2, 3);
  g.font = `700 15px ${FONT}`;
  g.textBaseline = 'top';
  g.fillText(cat.label.toUpperCase(), pad, y);
  g.textAlign = 'right';
  g.fillStyle = 'rgba(52,46,38,.62)';
  g.font = `500 14px ${FONT}`;
  g.fillText(viAgo(item.ts), W - pad, y);
  g.textAlign = 'left';

  // headline — the biggest thing on the page, as on a real front page. The
  // first story in a lane gets the lead treatment.
  y += 26;
  g.fillStyle = '#1d1a15';
  const { lines, size } = fitLines(
    g, item.t, W - pad * 2, rank === 0 ? 4 : 4, rank === 0 ? 27 : 23, 15, '700',
  );
  for (const line of lines) {
    g.fillText(line, pad, y);
    y += size + 5;
  }

  if (item.author) {
    g.fillStyle = 'rgba(52,46,38,.5)';
    g.font = `500 13px ${FONT}`;
    g.fillText(item.author, pad, H - 24);
  }
  g.textAlign = 'right';
  g.fillStyle = 'rgba(52,46,38,.32)';
  g.font = `400 12px ${FONT}`;
  g.fillText('tuoitre.vn', W - pad, H - 24);

  return canvasTexture(c, { anisotropy: 8 });
}

/**
 * One readable page. `place` puts it in the world; the mesh carries the story
 * on userData so the HUD can name it and open it.
 */
export function makePage({ item, cat, img, rank, sky, position, yaw }) {
  const tex = storyTexture(item, cat, img, rank);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.85,
    // paper does not glow, but an unlit alley at 21:00 is unreadable and this
    // is a scene you are meant to read. A small self-lit term under the bulbs
    // is the compromise; by day it is invisible.
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: sky.night ? 0.42 : 0.08,
  });
  const mesh = new THREE.Mesh(PLANE, mat);
  mesh.scale.set(PAGE_W, PAGE_H, 1);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.y = yaw;
  mesh.userData = {
    story: item,
    cat,
    label: item.t,
    sub: `${cat.label} · ${viAgo(item.ts)}`,
    url: item.link,
  };
  mesh.name = `page_${cat.key}_${rank + 1}`;
  return mesh;
}
