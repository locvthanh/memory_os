import { getScene } from './scenes/index.js';
import { Viewer } from './viewer/Viewer.js';

const params = new URLSearchParams(location.search);
const scene = getScene(params.get('id'));

const errorBox = document.getElementById('error-box');
function fail(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
  document.getElementById('loading').classList.add('hidden');
}

if (!scene) {
  fail('Unknown scene. Return to the scene list.');
} else {
  document.getElementById('scene-title').textContent = scene.title;
  document.title = `memoryOS — ${scene.title}`;

  scene
    .config()
    .then((config) => {
      const viewer = new Viewer({
        canvas: document.getElementById('viewer-canvas'),
        modelUrl: scene.model,
        config,
      });
      return viewer.start();
    })
    .catch((err) => {
      console.error(err);
      fail('Could not load this scene. ' + (err?.message || ''));
    });
}
