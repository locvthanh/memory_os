// The reading HUD.
//
// Like Phố Báo Sáng's, and for the same reason: this scene has no loci, so the
// viewer drops the locus panel and the transport bar, and what replaces them
// is a crosshair plus whatever screen is under it, named at the bottom. E, or
// a tap, opens the real article on cafef.vn.
//
// One addition the street did not need — a QUOTE STRIP in the top right. The
// board is at one end of a fifty-metre room, so the moment you turn round to
// read a bay you cannot see the index any more; a dealer has a second screen
// for exactly that reason and so does this. It is the same data as the board,
// not a second fetch.
import * as THREE from 'three';
import { viAgo } from './feed.js';
import { bandColour, vn, signed } from './market.js';

const REACH = 14; // metres — you have to walk to a bay to read it

export function createHud({
  pages, data, market, sky,
}) {
  const wrap = document.createElement('div');
  wrap.className = 'cf-hud';
  wrap.innerHTML = `
    <div class="cf-masthead">
      <b>${data.title} · Sàn Bảng Điện</b>
      <span class="cf-chip"></span>
    </div>
    <div class="cf-quotes" hidden></div>
    <div class="cf-reticle" aria-hidden="true"></div>
    <div class="cf-read" hidden>
      <span class="cf-sec"></span>
      <h3 class="cf-headline"></h3>
      <p class="cf-desc"></p>
      <span class="cf-open">Press E, or tap, to read it on cafef.vn</span>
    </div>
  `;
  document.body.appendChild(wrap);

  const chip = wrap.querySelector('.cf-chip');
  const quotes = wrap.querySelector('.cf-quotes');
  const read = wrap.querySelector('.cf-read');
  const secEl = wrap.querySelector('.cf-sec');
  const headEl = wrap.querySelector('.cf-headline');
  const descEl = wrap.querySelector('.cf-desc');

  const hh = String(Math.floor(sky.hour)).padStart(2, '0');
  const mm = String(Math.floor((sky.hour % 1) * 60)).padStart(2, '0');
  const when = `${hh}:${mm} giờ Việt Nam · ${market.session.vi}`;
  chip.textContent = data.source === 'live'
    ? `${data.total} tin · ${when}`
    : `${data.total} tin · last edition on file · ${when}`;
  if (data.source !== 'live') chip.classList.add('cf-stale');

  if (market.ok && market.indices.length) {
    quotes.hidden = false;
    quotes.innerHTML = market.indices.map((q) => `
      <div class="cf-quote">
        <span class="cf-q-name">${q.label}</span>
        <span class="cf-q-val" style="color:${bandColour(q.pct)}">${vn(q.last, 2)}</span>
        <span class="cf-q-chg" style="color:${bandColour(q.pct)}">${signed(q.pct, 2)}%</span>
      </div>
    `).join('') + `<div class="cf-q-note">${market.at
  ? `phiên ${new Date(market.at * 1000).toLocaleDateString('vi-VN')}`
  : ''}</div>`;
  }

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
    if (current) current.material.emissiveIntensity = current.userData.base;
    current = page;
    if (!page) {
      read.hidden = true;
      wrap.classList.remove('cf-aimed');
      return;
    }
    page.material.emissiveIntensity = page.userData.base + 0.4;
    const { story, cat } = page.userData;
    secEl.textContent = `${cat.label} · ${viAgo(story.ts)}`;
    secEl.style.background = cat.color;
    headEl.textContent = story.t;
    descEl.textContent = story.desc || '';
    descEl.hidden = !story.desc;
    read.hidden = false;
    wrap.classList.add('cf-aimed');
  }

  const onKey = (e) => {
    if (e.code !== 'KeyE' && e.code !== 'Enter') return;
    if (open(current)) e.preventDefault();
  };
  window.addEventListener('keydown', onKey);

  return {
    update(dt, camera) {
      frame += 1;
      if (frame % 3) return; // 20 Hz is plenty for a crosshair
      ray.setFromCamera(centre, camera);
      ray.far = REACH;
      const hit = ray.intersectObjects(pages, false)[0];
      setCurrent(hit ? hit.object : null);
    },

    /** Viewer hands taps here before its own picking. */
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
