// Sàn Bảng Điện — build entry.
//
// The second MemoryOS scene with no .glb behind it, and for the same reason as
// the first: the content is today. `Viewer` calls the `build` below when a
// scene config exports one (see the build-hook branch in Viewer.start) and it
// returns:
//   root    an Object3D to drop into the scene in place of the glb
//   update  per-frame, for the ribbon, the board's clock and the people
//   pick    first refusal on taps, so tapping a screen opens the article
//
// The order of work matters and is the reason the loading line says what it
// says: the news and the numbers are fetched TOGETHER (they are different
// hosts and neither waits on the other), then the photographs in batches, and
// only then is anything built — because the bays are sized from how many
// stories actually arrived, and the board draws prices or headlines depending
// on whether the market data came back at all.
import * as THREE from 'three';
import { loadFeed, loadImage } from './feed.js';
import { loadMarket } from './market.js';
import { skyFor, skyDome } from './sky.js';
import { createBoard, ribbonLine } from './board.js';
import { buildHall } from './hall.js';
import { buildLife, updateLife } from './life.js';
import { createHud } from './hud.js';
import { FONT } from '../kit.js';

const BATCH = 8; // photos in flight at once

export async function build({ setStatus = () => {} } = {}) {
  const sky = skyFor();

  const [data, market] = await Promise.all([
    loadFeed(setStatus),
    loadMarket(() => {}),
  ]);

  // Photos, in the same flat order the hall reads them back in.
  const urls = [];
  for (const c of data.cats) for (const it of c.items) urls.push(it.img);
  const images = [];
  for (let i = 0; i < urls.length; i += BATCH) {
    setStatus(`Ảnh — ${Math.min(i + BATCH, urls.length)}/${urls.length} photos…`);
    /* eslint-disable no-await-in-loop */
    images.push(...await Promise.all(urls.slice(i, i + BATCH).map(loadImage)));
    /* eslint-enable no-await-in-loop */
  }

  setStatus('Mở sàn — laying the floor out…');
  const root = new THREE.Group();
  root.name = 'cafef-vn';
  root.add(skyDome(sky));

  const board = createBoard({ market, data });
  const hall = buildHall({
    data, market, images, sky, board,
  });
  root.add(hall.group);

  const life = buildLife({
    seats: hall.seats, pages: hall.pages, sky, market,
  });
  root.add(life.group);

  const hud = createHud({
    pages: hall.pages, data, market, sky,
  });

  /* ---- the ribbon down both walls */
  const tg = hall.ticker.canvas.getContext('2d');
  const line = ribbonLine(data, market);
  tg.font = `700 52px ${FONT}`;
  const lineWidth = tg.measureText(line).width || 1;
  let t = 0;

  function drawRibbon() {
    tg.fillStyle = '#0a0d12';
    tg.fillRect(0, 0, 2048, 96);
    tg.fillStyle = '#ffb038';
    tg.font = `700 52px ${FONT}`;
    tg.textBaseline = 'middle';
    const x = -((t * 150) % lineWidth);
    tg.fillText(line, x, 50);
    tg.fillText(line, x + lineWidth, 50);
    hall.ticker.texture.needsUpdate = true;
  }
  drawRibbon();

  return {
    root,
    data,
    market,
    sky,

    update(dt, camera) {
      t += dt;
      drawRibbon();
      board.update(dt);
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
