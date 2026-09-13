import { SCENES, sceneHref } from './scenes/index.js';

const list = document.getElementById('scene-list');
const cards = new Map(); // scene id -> card element, for the world badge below

for (const scene of SCENES) {
  const card = document.createElement('a');
  card.className = 'scene-card';
  // sceneHref knows whether this scene opens in the 3D viewer or on its own
  // 2D page, so the hub does not have to.
  card.href = sceneHref(scene);

  const thumb = document.createElement('div');
  thumb.className = 'scene-thumb';
  thumb.textContent = scene.title.charAt(0);

  // A 2D scene looks and behaves differently once opened; say so on the card
  // rather than letting it be a surprise.
  if (scene.kind === '2d') {
    const tag = document.createElement('span');
    tag.className = 'scene-tag';
    tag.textContent = '2D';
    thumb.append(tag);
    card.classList.add('is-2d');
  }

  const body = document.createElement('div');
  body.className = 'scene-card-body';
  const h = document.createElement('h2');
  h.textContent = scene.title;
  const p = document.createElement('p');
  p.textContent = scene.blurb;
  body.append(h, p);

  card.append(thumb, body);
  list.append(card);
  cards.set(scene.id, card);
}

// The living layer, on the hub. A world that moves while you are away has to
// say so somewhere you will see before you pick a scene. Entirely optional:
// if world/state.json is missing the hub is exactly what it was.
// See docs/simulated-world.md.
fetch(new URL('../world/state.json', import.meta.url), { cache: 'no-cache' })
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
  .then((state) => {
    if (state.version !== 1) return;
    let seen = 0;
    try {
      seen = parseInt(localStorage.getItem('memoryos:world:last-seen-day') || '0', 10) || 0;
    } catch {
      /* storage blocked; treat the world as freshly met */
    }
    for (const id of Object.keys(state.scenes || {})) {
      const card = cards.get(id);
      if (!card) continue;
      const n = state.chronicle.filter((c) => c.scene === id && c.day > seen).length;
      const tag = document.createElement('span');
      tag.className = 'scene-tag scene-tag-world';
      tag.textContent = n ? `Day ${state.day} · ${n} new` : `Day ${state.day}`;
      card.querySelector('.scene-thumb').append(tag);
      card.classList.add('is-living');
    }
  })
  .catch(() => {
    /* no world yet */
  });
