import { SCENES } from './scenes/index.js';

const list = document.getElementById('scene-list');

for (const scene of SCENES) {
  const card = document.createElement('a');
  card.className = 'scene-card';
  card.href = `scene.html?id=${encodeURIComponent(scene.id)}`;

  const thumb = document.createElement('div');
  thumb.className = 'scene-thumb';
  thumb.textContent = scene.title.charAt(0);

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
