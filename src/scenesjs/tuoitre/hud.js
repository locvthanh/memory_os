// The reading HUD.
//
// This scene has no loci, so it has no locus panel and no transport bar — the
// viewer drops both when `loci` is empty. What it needs instead is a way to
// read: a crosshair in the middle of the screen, and whatever page is under
// that crosshair named at the bottom with its headline, its section and how
// old it is. E or a tap opens the real article.
//
// Centre-of-screen raycasting rather than pointer-following is on purpose.
// Free move is drag-to-look, so on a phone the pointer is busy turning your
// head and there is no hover at all; the crosshair works the same on both.
import * as THREE from 'three';
import { viAgo } from './feed.js';

const REACH = 16; // metres — you have to walk up to a case to read it

export function createHud({ pages, data, sky }) {
  const wrap = document.createElement('div');
  wrap.className = 'tt-hud';
  wrap.innerHTML = `
    <div class="tt-masthead">
      <b>${data.title}</b>
      <span class="tt-chip"></span>
    </div>
    <div class="tt-reticle" aria-hidden="true"></div>
    <div class="tt-read" hidden>
      <span class="tt-sec"></span>
      <h3 class="tt-headline"></h3>
      <p class="tt-desc"></p>
      <span class="tt-open">Press E, or tap, to read it on tuoitre.vn</span>
    </div>
  `;
  document.body.appendChild(wrap);

  const chip = wrap.querySelector('.tt-chip');
  const read = wrap.querySelector('.tt-read');
  const secEl = wrap.querySelector('.tt-sec');
  const headEl = wrap.querySelector('.tt-headline');
  const descEl = wrap.querySelector('.tt-desc');

  const hh = String(Math.floor(sky.hour)).padStart(2, '0');
  const mm = String(Math.floor((sky.hour % 1) * 60)).padStart(2, '0');
  chip.textContent = data.source === 'live'
    ? `${data.total} tin · ${hh}:${mm} giờ Việt Nam · ${sky.when}`
    : `${data.total} tin · last edition on file · ${hh}:${mm} giờ Việt Nam`;
  if (data.source !== 'live') chip.classList.add('tt-stale');

  const ray = new THREE.Raycaster();
  const centre = new THREE.Vector2(0, 0);
  let current = null;
  let frame = 0;

  function open(page) {
    const url = page && page.userData && page.userData.url;
    if (!url) return false;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }

  function setCurrent(page) {
    if (page === current) return;
    if (current) current.material.emissiveIntensity = sky.night ? 0.42 : 0.08;
    current = page;
    if (!page) {
      read.hidden = true;
      wrap.classList.remove('tt-aimed');
      return;
    }
    page.material.emissiveIntensity = sky.night ? 0.75 : 0.34;
    const { story, cat } = page.userData;
    secEl.textContent = `${cat.label} · ${viAgo(story.ts)}`;
    secEl.style.background = cat.color;
    headEl.textContent = story.t;
    descEl.textContent = story.desc || '';
    descEl.hidden = !story.desc;
    read.hidden = false;
    wrap.classList.add('tt-aimed');
  }

  const onKey = (e) => {
    if (e.code !== 'KeyE' && e.code !== 'Enter') return;
    if (open(current)) e.preventDefault();
  };
  window.addEventListener('keydown', onKey);

  return {
    /** Called every frame by the scene; `camera` moves, the pages do not. */
    update(dt, camera) {
      frame += 1;
      if (frame % 3) return; // 20 Hz is plenty for a crosshair
      ray.setFromCamera(centre, camera);
      ray.far = REACH;
      const hit = ray.intersectObjects(pages, false)[0];
      setCurrent(hit ? hit.object : null);
    },

    /** Viewer hands taps here before its own locus picking. */
    pick(raycaster) {
      const hit = raycaster.intersectObjects(pages, false)[0];
      if (!hit) return false;
      setCurrent(hit.object);
      return open(hit.object);
    },

    dispose() {
      window.removeEventListener('keydown', onKey);
      wrap.remove();
    },
  };
}
