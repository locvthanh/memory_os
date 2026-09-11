import { SCENES, sceneHref } from './scenes/index.js';

const list = document.getElementById('scene-list');

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
}
