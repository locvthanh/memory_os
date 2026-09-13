// Phố Báo Sáng — build entry.
//
// This is the first MemoryOS scene with no .glb behind it. Every other scene
// is a Blender model with `Locus_*` empties baked in, loaded by `Viewer`
// through GLTFLoader; this one is assembled in the browser, at the moment the
// page opens, out of whatever tuoitre.vn is publishing right then. It has to
// be, because the content is the news: a model exported last night would be
// yesterday's paper, and the whole point is that walking in at 06:00 and at
// 21:00 gives you two different streets.
//
// `Viewer` calls the `build` below when a scene config exports one (see the
// build-hook branch in Viewer.start). It returns:
//   root    an Object3D to drop into the scene in place of the glb
//   update  per-frame, for the ticker, the loudspeaker and the people
//   pick    first refusal on taps, so tapping a page opens the article
import * as THREE from 'three';
import { loadFeed, loadImage } from './feed.js';
import { skyFor, skyDome } from './sky.js';
import { buildStreet } from './street.js';
import { buildLife, updateLife } from './life.js';
import { createHud } from './hud.js';
import { FONT } from './kit.js';

const BATCH = 8; // photos in flight at once

function tickerLine(data) {
  const bits = [];
  for (const c of data.cats) {
    if (c.items[0]) bits.push(`${c.label.toUpperCase()}: ${c.items[0].t}`);
  }
  if (!bits.length) bits.push('KHÔNG CÓ KẾT NỐI — the live feed could not be reached');
  return `${bits.join('   ★   ')}   ★   `;
}

export async function build({ setStatus = () => {} } = {}) {
  const sky = skyFor();
  const data = await loadFeed(setStatus);

  // Photos, in the same flat order the street reads them back in.
  const urls = [];
  for (const c of data.cats) for (const it of c.items) urls.push(it.img);
  const images = [];
  for (let i = 0; i < urls.length; i += BATCH) {
    setStatus(`Ảnh — ${Math.min(i + BATCH, urls.length)}/${urls.length} photos…`);
    /* eslint-disable no-await-in-loop */
    images.push(...await Promise.all(urls.slice(i, i + BATCH).map(loadImage)));
    /* eslint-enable no-await-in-loop */
  }

  setStatus('Mở phố — laying the street out…');
  const root = new THREE.Group();
  root.name = 'tuoitre-vn';
  root.add(skyDome(sky));

  const street = buildStreet({ data, images, sky });
  root.add(street.group);

  const life = buildLife({ pages: street.pages, sky });
  root.add(life.group);

  const hud = createHud({ pages: street.pages, data, sky });

  // ---- the rolling headline strip
  const tg = street.ticker.canvas.getContext('2d');
  const line = tickerLine(data);
  tg.font = `700 52px ${FONT}`;
  const lineWidth = tg.measureText(line).width || 1;
  let t = 0;

  function drawTicker() {
    tg.fillStyle = '#120d06';
    tg.fillRect(0, 0, 1024, 96);
    tg.fillStyle = '#ffb038';
    tg.font = `700 52px ${FONT}`;
    tg.textBaseline = 'middle';
    const x = -((t * 130) % lineWidth);
    tg.fillText(line, x, 50);
    tg.fillText(line, x + lineWidth, 50);
    street.ticker.texture.needsUpdate = true;
  }
  drawTicker();

  return {
    root,
    data,
    sky,

    update(dt, camera) {
      t += dt;
      drawTicker();
      // the loudspeaker sweeps the street, slowly, the way they do
      if (street.speaker) street.speaker.rotation.y = Math.sin(t * 0.11) * 0.9;
      updateLife(life, dt, t);
      hud.update(dt, camera);
    },

    pick(raycaster) {
      return hud.pick(raycaster);
    },

    dispose() {
      hud.dispose();
    },
  };
}

export default build;
