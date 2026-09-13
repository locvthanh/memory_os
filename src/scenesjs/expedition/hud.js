// The reading HUD.
//
// This scene has no loci, so the viewer drops the transport bar and the locus
// panel entirely and there is nothing on screen but the world. What it needs
// instead is a way to read a door before you take it: a crosshair, and
// whatever is under that crosshair named at the bottom of the screen.
//
// Centre-of-screen raycasting rather than pointer-following, for the same
// reason Pho Bao Sang does it: free move is drag-to-look, so on a phone the
// pointer is busy turning your head and there is no hover at all.
import * as THREE from 'three';

const REACH = 26;

export function createHud({ getReadables, onOpen, subtitle }) {
  const wrap = document.createElement('div');
  wrap.className = 'ex-hud';
  wrap.innerHTML = `
    <div class="ex-masthead">
      <b>The Endless Survey</b>
      <span class="ex-chip"></span>
      <span class="ex-trail"></span>
    </div>
    <div class="ex-reticle" aria-hidden="true"></div>
    <div class="ex-hint" hidden></div>
    <div class="ex-status" hidden></div>
    <div class="ex-read" hidden>
      <span class="ex-kind"></span>
      <h3 class="ex-title"></h3>
      <p class="ex-desc"></p>
      <span class="ex-open"></span>
    </div>
  `;
  document.body.appendChild(wrap);

  const chip = wrap.querySelector('.ex-chip');
  const trailEl = wrap.querySelector('.ex-trail');
  const statusEl = wrap.querySelector('.ex-status');
  const hintEl = wrap.querySelector('.ex-hint');
  const read = wrap.querySelector('.ex-read');
  const kindEl = wrap.querySelector('.ex-kind');
  const titleEl = wrap.querySelector('.ex-title');
  const descEl = wrap.querySelector('.ex-desc');
  const openEl = wrap.querySelector('.ex-open');

  chip.textContent = subtitle;

  const ray = new THREE.Raycaster();
  const centre = new THREE.Vector2(0, 0);
  let current = null;
  let frame = 0;

  function act(mesh) {
    if (!mesh) return false;
    const d = mesh.userData || {};
    if (d.kind === 'door') {
      onOpen(d.door);
      return true;
    }
    if (d.kind === 'article' && d.url) {
      window.open(d.url, '_blank', 'noopener,noreferrer');
      return true;
    }
    return false;
  }

  function setCurrent(mesh) {
    if (mesh === current) return;
    if (current) current.material.emissiveIntensity = current.userData.baseGlow ?? 0.18;
    current = mesh;
    if (!mesh) {
      read.hidden = true;
      wrap.classList.remove('ex-aimed');
      return;
    }
    if (mesh.userData.baseGlow === undefined) {
      mesh.userData.baseGlow = mesh.material.emissiveIntensity;
    }
    mesh.material.emissiveIntensity = mesh.userData.baseGlow + 0.4;
    const d = mesh.userData;
    if (d.kind === 'door') {
      kindEl.textContent = d.door.opened ? 'Opened' : 'Door';
      kindEl.className = 'ex-kind ex-door';
      titleEl.textContent = d.door.title;
      descEl.textContent = d.door.text || d.door.description || '';
      openEl.textContent = d.door.opened
        ? 'Walk through — the room is already there'
        : 'Walk in, or press E, to open the room beyond';
    } else {
      const site = d.site || 'Wikipedia';
      kindEl.textContent = site === 'Britannica' ? 'Way out' : 'Article';
      kindEl.className = `ex-kind ${site === 'Britannica' ? 'ex-brit' : 'ex-article'}`;
      titleEl.textContent = d.title;
      descEl.textContent = site === 'Britannica'
        ? 'Britannica cannot be read inside this world — it answers everything but a real browser with a Cloudflare challenge. This opens it in one.'
        : '';
      openEl.textContent = `Press E, or tap, to read it on ${site}`;
    }
    descEl.hidden = !descEl.textContent;
    read.hidden = false;
    wrap.classList.add('ex-aimed');
  }

  const onKey = (e) => {
    if (e.code !== 'KeyE' && e.code !== 'Enter') return;
    if (act(current)) e.preventDefault();
  };
  window.addEventListener('keydown', onKey);

  return {
    /** The standing instruction, until the first room has been walked into. */
    hint(text) {
      hintEl.textContent = text || '';
      hintEl.hidden = !text;
    },
    status(text) {
      statusEl.textContent = text || '';
      statusEl.hidden = !text;
    },
    trail(names, depth) {
      trailEl.textContent = `${names.join('  ›  ')}${depth ? `   ·   depth ${depth}` : ''}`;
    },
    update(dt, camera) {
      frame += 1;
      if (frame % 3) return;
      ray.setFromCamera(centre, camera);
      ray.far = REACH;
      const hit = ray.intersectObjects(getReadables(), false)[0];
      setCurrent(hit ? hit.object : null);
    },
    pick(raycaster) {
      const hit = raycaster.intersectObjects(getReadables(), false)[0];
      if (!hit) return false;
      setCurrent(hit.object);
      return act(hit.object);
    },
    dispose() {
      window.removeEventListener('keydown', onKey);
      wrap.remove();
    },
  };
}
