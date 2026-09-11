// The Civil War — 2D animated-map scene.
//
// The 3D scenes in this app put a camera on rails and fly it past loci baked
// into a .glb. This one does the same job with no WebGL at all: the "camera" is
// a translate+scale on one SVG group, and the loci are pins projected from
// lon/lat. Everything else in the app — the hub card, the locus panel, the
// transport bar, cross-scene links — behaves the same way, so a 3D scene can
// link here and this page can link back.
//
// Structure:
//   civil-war.data.js   generated geometry (states, rivers, fronts, arrows, pins)
//   ../scenes/civil-war.js  the memory content + per-stop framing
//   civil-war.css       all styling for body.cw
//
// The one piece of real machinery here is the view rig. The <svg> viewBox is
// pinned to CSS pixels and the whole map lives in #cw-world, which is
// transformed. That way strokes can opt out of scaling with
// vector-effect="non-scaling-stroke" (state borders, rivers, the front line and
// the blockade stay hairlines at every zoom), while pins and labels
// counter-scale by 1/k so they keep a constant on-screen size. Campaign arrows
// deliberately do NOT opt out — an army's line of march should get heavier as
// you lean in.

import { MAP } from './civil-war.data.js';
import CONFIG from '../scenes/civil-war.js';
import { sceneHref, getScene } from '../scenes/index.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const YEARS = MAP.fronts.map((f) => f.year); // [1861..1865]

// ---------------------------------------------------------------- utilities

function el(tag, attrs = {}, parent = null) {
  const node = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

const $ = (id) => document.getElementById(id);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
// Same easing the 3D Walkthrough rig uses, so travel between stops feels the
// same in both kinds of scene.
const smoothstep = (t) => t * t * (3 - 2 * t);
const pts = (list) => list.map(([x, y]) => `${x},${y}`).join(' ');

function fail(message) {
  const box = $('cw-error');
  box.textContent = message;
  box.hidden = false;
}

// ---------------------------------------------------------------- the rig

const svg = $('cw-map');
const gArrows = $('cw-arrows'); // read by applyView, so resolved before it runs
const world = el('g', { id: 'cw-world' });
// Re-parent the layer groups authored in the HTML into the transformed world.
for (const id of ['cw-ocean', 'cw-states', 'cw-rivers', 'cw-front', 'cw-blockade',
                  'cw-arrows', 'cw-effects', 'cw-cities', 'cw-statelabels', 'cw-pins']) {
  world.appendChild($(id));
}
svg.appendChild(world);

// view = what the rig is looking at, in map units. `w` is how many map units
// span the container's width; the height follows from the container's aspect.
const WORLD_W = MAP.world[2];
const WORLD_H = MAP.world[3];
const view = { cx: WORLD_W / 2, cy: WORLD_H / 2, w: CONFIG.startView?.w ?? 1080 };
let k = 1; // px per map unit — read by anything that counter-scales

let rect = { width: window.innerWidth, height: window.innerHeight };

function measure() {
  const r = svg.getBoundingClientRect();
  rect = { width: r.width || window.innerWidth, height: r.height || window.innerHeight };
  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
}

function applyView() {
  k = rect.width / view.w;
  const tx = rect.width / 2 - view.cx * k;
  const ty = rect.height / 2 - view.cy * k;
  world.setAttribute('transform', `translate(${tx} ${ty}) scale(${k})`);
  // Campaign arrows can't use non-scaling-stroke — their draw-on animation is a
  // dash offset measured in user units, which that would reinterpret as screen
  // units — so their weight is set here instead. It also sizes the arrowheads,
  // since markerUnits is strokeWidth: left alone, a head 5 stroke-widths across
  // becomes a 70px triangle at the tightest zoom.
  gArrows.style.strokeWidth = (4.5 / k).toFixed(3);
  const inv = 1 / k;
  for (const node of counterScaled) {
    node.setAttribute('transform', `translate(${node._x} ${node._y}) scale(${inv})`);
  }
}

// Elements that must keep a constant on-screen size: pins, city ticks, state
// abbreviations. Each carries its own map-space anchor in _x/_y.
const counterScaled = [];
function anchor(node, x, y) {
  node._x = x;
  node._y = y;
  counterScaled.push(node);
  return node;
}

// Framing for one locus: centre on its pin, with the width the content asks
// for, then keep the whole thing inside a generous bound so a stop near the
// edge of the map never strands the viewer in empty ocean.
function viewFor(locus) {
  const p = MAP.pins[String(locus.id)];
  const w = clamp(locus.w ?? 320, 110, 1400);
  const [dx, dy] = locus.pan ?? [0, 0];
  const aspect = rect.height / rect.width;
  const h = w * aspect;
  return {
    cx: clamp(p[0] + dx, -140 + w / 2, WORLD_W + 140 - w / 2),
    cy: clamp(p[1] + dy, -140 + h / 2, WORLD_H + 140 - h / 2),
    w,
  };
}

// ---------------------------------------------------------------- build map

const gStates = $('cw-states');
const stateNodes = new Map();

for (const s of MAP.states) {
  const node = el('path', {
    d: s.d,
    class: `cw-state ${s.side}`,
    'vector-effect': 'non-scaling-stroke',
  }, gStates);
  stateNodes.set(s.ab, { node, fell: s.fell ?? null });
}

const gRivers = $('cw-rivers');
const riverNodes = [];
for (const [name, line] of Object.entries(MAP.rivers)) {
  riverNodes.push(el('polyline', {
    points: pts(line),
    class: `cw-river ${name}`,
    'vector-effect': 'non-scaling-stroke',
  }, gRivers));
}

// Front line: one glow + one dashed line, both redrawn as the year morphs.
const gFront = $('cw-front');
const frontGlow = el('polyline', {
  points: pts(MAP.fronts[0].path),
  class: 'cw-front-glow',
  'vector-effect': 'non-scaling-stroke',
}, gFront);
const frontLine = el('polyline', {
  points: pts(MAP.fronts[0].path),
  class: 'cw-front-line',
  'vector-effect': 'non-scaling-stroke',
}, gFront);

const gBlockade = $('cw-blockade');
const blockadeNodes = MAP.blockade.map((b) =>
  el('polyline', {
    points: pts(b.path),
    class: 'cw-blockade',
    'vector-effect': 'non-scaling-stroke',
  }, gBlockade));

const arrowNodes = new Map();
for (const a of MAP.arrows) {
  const node = el('polyline', {
    points: pts(a.path),
    class: 'cw-arrow',
    'marker-end': 'url(#cw-arrowhead)',
  }, gArrows);
  // Prime the draw-on: hide the whole stroke behind its own dash gap, then let
  // the .on class release the offset.
  const len = node.getTotalLength ? node.getTotalLength() : 400;
  node.setAttribute('stroke-dasharray', `${len} ${len}`);
  node.setAttribute('stroke-dashoffset', len);
  arrowNodes.set(a.id, node);
}

// Orienting cities. A city that a locus pin already sits on is skipped — the
// panel names the place, and two labels on one dot just fight each other.
const gCities = $('cw-cities');
const pinPoints = Object.values(MAP.pins);
for (const c of MAP.cities) {
  const onPin = pinPoints.some((p) => Math.hypot(p[0] - c.p[0], p[1] - c.p[1]) < 6);
  if (onPin) continue;
  const g = el('g', { class: 'cw-city' }, gCities);
  el('circle', { cx: 0, cy: 0, r: 1.6 }, g);
  el('text', { x: 4, y: 2.6 }, g).textContent = c.name;
  anchor(g, c.p[0], c.p[1]);
}

const gStateLabels = $('cw-statelabels');
for (const s of MAP.states) {
  const g = el('g', { class: 'cw-state-label' }, gStateLabels);
  el('text', { x: 0, y: 0 }, g).textContent = s.ab;
  anchor(g, s.c[0], s.c[1]);
}

// Pins, in tour order.
const gPins = $('cw-pins');
const pinNodes = new Map();
for (const locus of CONFIG.loci) {
  const p = MAP.pins[String(locus.id)];
  if (!p) continue;
  const g = el('g', { class: 'cw-pin', 'data-id': String(locus.id) }, gPins);
  el('circle', { class: 'ring', cx: 0, cy: 0, r: 7 }, g);
  el('circle', { class: 'dot', cx: 0, cy: 0, r: 7 }, g);
  el('text', { class: 'num', x: 0, y: 0, 'font-size': 8 }, g).textContent = String(locus.id);
  g.addEventListener('click', () => goTo(CONFIG.loci.indexOf(locus)));
  anchor(g, p[0], p[1]);
  pinNodes.set(locus.id, g);
}

const gEffects = $('cw-effects');

// ---------------------------------------------------------------- the year

let currentYear = null;
let frontFrom = 0;      // index into MAP.fronts
let frontTo = 0;
let frontT = 1;         // 0..1 through the morph
let frontMorphLeft = 0; // seconds

function setYear(year, animate = true) {
  if (year === currentYear) return;
  const idx = Math.max(0, YEARS.indexOf(year));
  const prevIdx = currentYear === null ? idx : Math.max(0, YEARS.indexOf(currentYear));
  currentYear = year;

  // Front line morphs from the previous year's shape to this one. Both are
  // resampled to the same vertex count at build time, so a straight lerp is
  // all this needs.
  frontFrom = prevIdx;
  frontTo = idx;
  frontT = animate && prevIdx !== idx ? 0 : 1;
  frontMorphLeft = frontT === 0 ? 1.5 : 0;
  if (frontT === 1) drawFront(idx, idx, 1);

  // States drain from Confederate brick as the war reaches them.
  for (const { node, fell } of stateNodes.values()) {
    if (fell) node.classList.toggle('fallen', year >= fell);
  }

  const stamp = $('cw-year');
  const num = $('cw-year-num');
  const note = $('cw-year-note');
  const write = () => {
    num.textContent = String(year);
    note.textContent = MAP.fronts[idx]?.label ?? '';
    stamp.classList.remove('turning');
  };
  if (!animate) { write(); return; }
  stamp.classList.add('turning');
  setTimeout(write, 420);
}

function drawFront(fromIdx, toIdx, t) {
  const a = MAP.fronts[fromIdx].path;
  const b = MAP.fronts[toIdx].path;
  const e = smoothstep(clamp(t, 0, 1));
  let s = '';
  for (let i = 0; i < a.length; i++) {
    s += `${lerp(a[i][0], b[i][0], e).toFixed(1)},${lerp(a[i][1], b[i][1], e).toFixed(1)} `;
  }
  frontLine.setAttribute('points', s);
  frontGlow.setAttribute('points', s);
}

// ---------------------------------------------------------------- effects

// Each flourish is additive and self-cleaning where it should be. They are
// drawn in map units inside #cw-world, so they sit on the geography rather
// than floating over it.
const EFFECTS = {
  // Fort Sumter: shells arc in from the ring of batteries and burst on the fort.
  bombard(p) {
    const from = [[p[0] - 13, p[1] + 6], [p[0] + 11, p[1] + 9], [p[0] - 4, p[1] + 15]];
    from.forEach(([sx, sy], i) => {
      const shell = el('circle', { class: 'cw-burst', cx: 0, cy: 0, r: 1.1 }, gEffects);
      const frames = [];
      for (let s = 0; s <= 10; s++) {
        const t = s / 10;
        const x = lerp(sx, p[0], t);
        const y = lerp(sy, p[1], t) - Math.sin(t * Math.PI) * 9; // the arc
        frames.push({ transform: `translate(${x}px, ${y}px)`, opacity: t > 0.92 ? 0 : 1 });
      }
      const anim = shell.animate(frames, {
        duration: 1500, delay: i * 320, easing: 'linear', iterations: 3,
      });
      anim.finished.then(() => shell.remove()).catch(() => shell.remove());
    });
    const burst = el('circle', { class: 'cw-shell', cx: p[0], cy: p[1], r: 2 }, gEffects);
    burst.animate(
      [{ r: 2, opacity: 0.9 }, { r: 14, opacity: 0 }],
      { duration: 1500, delay: 900, iterations: 3 },
    ).finished.then(() => burst.remove()).catch(() => burst.remove());
  },

  // The Anaconda: both squadrons start crawling and never stop.
  blockade() {
    blockadeNodes.forEach((n) => n.classList.add('on'));
  },

  // Vicksburg, Petersburg: a slowly rotating ring of investment.
  siege(p) {
    const ring = el('circle', {
      class: 'cw-siege-ring', cx: p[0], cy: p[1], r: 9,
      'vector-effect': 'non-scaling-stroke',
    }, gEffects);
    ring.animate([{ opacity: 0 }, { opacity: 0.9 }], { duration: 900, fill: 'forwards' });
  },

  // The March to the Sea: fire blooms along Sherman's track, west to east.
  burn() {
    const path = MAP.arrows.find((a) => a.id === 'sherman')?.path ?? [];
    path.forEach(([x, y], i) => {
      if (i === 0) return;
      const f = el('circle', { class: 'cw-fire', cx: x, cy: y, r: 0 }, gEffects);
      f.animate(
        [{ r: 0, opacity: 0 }, { r: 4.5, opacity: 0.85 }, { r: 2.2, opacity: 0.35 }],
        { duration: 2600, delay: i * 260, fill: 'forwards', iterations: Infinity },
      );
    });
  },

  // Appomattox: the front line fades and a quiet ring opens over the village.
  surrender(p) {
    frontLine.animate([{ opacity: 1 }, { opacity: 0.15 }], { duration: 2200, fill: 'forwards' });
    for (let i = 0; i < 3; i++) {
      const ring = el('circle', {
        class: 'cw-peace', cx: p[0], cy: p[1], r: 3,
        'vector-effect': 'non-scaling-stroke',
      }, gEffects);
      ring.animate(
        [{ r: 3, opacity: 0.8 }, { r: 34, opacity: 0 }],
        { duration: 3400, delay: i * 900, iterations: Infinity },
      );
    }
  },
};

function clearEffects() {
  gEffects.replaceChildren();
  frontLine.getAnimations?.().forEach((a) => a.cancel());
  frontLine.style.opacity = '';
}

// ---------------------------------------------------------------- the tour

const loci = CONFIG.loci;
const travelSeconds = CONFIG.walkthrough?.travelSeconds ?? 2.6;
const dwellSeconds = CONFIG.walkthrough?.dwellSeconds ?? 11;
const loopTour = CONFIG.walkthrough?.loop !== false;

let index = -1;
let phase = 'intro';   // 'intro' | 'travel' | 'dwell' | 'paused' | 'free'
let phaseT = 0;
let travelFrom = null;
let travelTo = null;

const panel = $('cw-panel');
const tourControls = $('cw-tour-controls');
const btnPlayPause = $('cw-playpause');
const btnFree = $('cw-freemove');

function showPanel(i) {
  const locus = loci[i];
  panel.hidden = false;
  $('cw-progress').textContent = `${i + 1} / ${loci.length}`;
  $('cw-title').textContent = locus.title;
  $('cw-description').textContent = locus.description;
  const link = $('cw-link');
  const href = locus.link ? sceneHref(locus.link) : null;
  if (href) {
    link.href = href;
    link.textContent = `${getScene(locus.link)?.title ?? 'Go to scene'} \u2192`;
    link.hidden = false;
  } else {
    link.hidden = true;
  }
  $('cw-body').scrollTop = 0;
  // The class goes on next frame so the slide-in transition actually runs; the
  // sheet height has to be republished *after* that, not before.
  requestAnimationFrame(() => { panel.classList.add('visible'); syncSheet(); });
}

function hidePanel(dismiss = false) {
  panel.classList.remove('visible');
  if (dismiss) panel.hidden = true;
  syncSheet();
}

// On a phone the panel is docked as a bottom sheet whose height depends on how
// long the locus text is, and the transport bar and the timeline both have to
// clear it. Publish that height as --cw-sheet-h and let the stylesheet do the
// arithmetic — same trick as LocusOverlay in the 3D viewer.
//
// Observed as well as called, because `hidden`/`visible` get toggled from
// several places (travel, the close button, free-move) and one missed call
// would strand the controls under the sheet.
function syncSheet() {
  const open = !panel.hidden && panel.classList.contains('visible');
  const h = open ? panel.getBoundingClientRect().height : 0;
  document.documentElement.style.setProperty('--cw-sheet-h', `${Math.round(h)}px`);
}
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(syncSheet).observe(panel);
new MutationObserver(syncSheet).observe(panel, {
  attributes: true,
  attributeFilter: ['hidden', 'class'],
});

function arrive(i) {
  const locus = loci[i];
  setYear(locus.year);

  // The map accumulates: everything the tour has already passed stays drawn.
  // Applied over the whole prefix rather than just this stop, so jumping ahead
  // from the timeline lands you on the map as it would look had you walked
  // there — otherwise clicking 1864 shows a war with no campaigns on it.
  const seen = loci.slice(0, i + 1);
  for (const l of seen) {
    pinNodes.get(l.id)?.classList.add('seen');
    for (const id of l.reveal ?? []) arrowNodes.get(id)?.classList.add('on');
  }
  // Anything ahead of the tour is rolled back, so stepping backwards un-draws.
  for (const l of loci.slice(i + 1)) {
    pinNodes.get(l.id)?.classList.remove('seen');
    for (const id of l.reveal ?? []) arrowNodes.get(id)?.classList.remove('on');
  }
  pinNodes.forEach((n) => n.classList.remove('active'));
  pinNodes.get(locus.id)?.classList.add('active');

  clearEffects();
  if (locus.effect && EFFECTS[locus.effect]) {
    EFFECTS[locus.effect](MAP.pins[String(locus.id)]);
  }
  // The blockade, once on, stays on for the rest of the war.
  // Once the Anaconda is explained it stays on the map for the rest of the war
  // — and comes back off if you step behind it.
  blockadeNodes.forEach((n) => n.classList.toggle('on', i >= 1));

  showPanel(i);
  markTimeline(i);
}

function goTo(i, { instant = false } = {}) {
  if (i < 0 || i >= loci.length) return;
  // Leaving free-move first: setFree() parks the rig in 'dwell', which would
  // otherwise clobber the 'travel' phase this function is about to set.
  if (btnFree.classList.contains('on')) setFree(false);
  index = i;
  travelFrom = { ...view };
  travelTo = viewFor(loci[i]);
  hidePanel();
  btnPlayPause.textContent = 'Pause';
  if (instant) {
    Object.assign(view, travelTo);
    applyView();
    phase = 'dwell';
    phaseT = 0;
    arrive(i);
  } else {
    phase = 'travel';
    phaseT = 0;
  }
}

function next() {
  if (index + 1 >= loci.length) {
    if (!loopTour) { setPaused(true); return; }
    goTo(0);
  } else {
    goTo(index + 1);
  }
}
function prev() { goTo(index - 1 < 0 ? (loopTour ? loci.length - 1 : 0) : index - 1); }

function setPaused(p) {
  if (phase === 'free') return;
  if (p) {
    // Pausing mid-flight would strand the rig between two stops and skip
    // arrive(), so land it first and then hold.
    if (phase === 'travel' && travelTo) {
      Object.assign(view, travelTo);
      applyView();
      arrive(index);
    }
    phase = 'paused';
    btnPlayPause.textContent = 'Resume';
  } else {
    phase = 'dwell';
    phaseT = 0;
    btnPlayPause.textContent = 'Pause';
  }
}

function setFree(on) {
  btnFree.classList.toggle('on', on);
  tourControls.classList.toggle('disabled', on);
  if (on) {
    phase = 'free';
    hidePanel(true);
    pinNodes.forEach((n) => n.classList.remove('active'));
  } else {
    phase = 'dwell';
    phaseT = 0;
    if (index >= 0) showPanel(index);
  }
}

// ---------------------------------------------------------------- timeline

const timeline = $('cw-timeline');
const tickNodes = new Map();
{
  const byYear = new Map();
  loci.forEach((l, i) => {
    if (!byYear.has(l.year)) byYear.set(l.year, []);
    byYear.get(l.year).push(i);
  });
  for (const [year, idxs] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    const group = document.createElement('div');
    group.className = 'cw-tl-year';
    const ticks = document.createElement('div');
    ticks.className = 'cw-tl-ticks';
    for (const i of idxs) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cw-tl-tick';
      b.title = loci[i].title;
      b.setAttribute('aria-label', loci[i].title);
      b.addEventListener('click', () => goTo(i));
      ticks.append(b);
      tickNodes.set(i, b);
    }
    const label = document.createElement('span');
    label.className = 'cw-tl-label';
    label.textContent = String(year);
    group.append(ticks, label);
    timeline.append(group);
  }
}

function markTimeline(i) {
  tickNodes.forEach((node, j) => {
    node.classList.toggle('active', j === i);
    node.classList.toggle('seen', j <= i);
  });
}

// ---------------------------------------------------------------- input

let dragging = false;
const pointers = new Map();
let pinchStart = null;

svg.addEventListener('pointerdown', (e) => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  svg.setPointerCapture(e.pointerId);
  if (pointers.size === 1) {
    dragging = true;
    svg.classList.add('dragging');
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), w: view.w };
  }
});

svg.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  const prevP = pointers.get(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 2 && pinchStart) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (dist > 4) {
      view.w = clamp(pinchStart.w * (pinchStart.dist / dist), 90, 1500);
      applyView();
    }
    return;
  }
  if (!dragging) return;
  // Panning during travel would fight the rig, so let it interrupt into dwell —
  // same idea as grabbing the look-controls in a 3D scene.
  if (phase === 'travel') { phase = 'dwell'; phaseT = 0; }
  view.cx -= (e.clientX - prevP.x) / k;
  view.cy -= (e.clientY - prevP.y) / k;
  applyView();
});

function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchStart = null;
  if (pointers.size === 0) {
    dragging = false;
    svg.classList.remove('dragging');
  }
}
svg.addEventListener('pointerup', endPointer);
svg.addEventListener('pointercancel', endPointer);

svg.addEventListener('wheel', (e) => {
  e.preventDefault();
  const factor = Math.exp(e.deltaY * 0.0014);
  const before = view.w;
  view.w = clamp(view.w * factor, 90, 1500);
  // Zoom toward the cursor rather than the centre.
  const ratio = view.w / before;
  const mx = e.clientX - rect.width / 2;
  const my = e.clientY - rect.height / 2;
  view.cx += (mx / k) * (1 - ratio);
  view.cy += (my / k) * (1 - ratio);
  applyView();
}, { passive: false });

$('cw-prev').addEventListener('click', prev);
$('cw-next').addEventListener('click', next);
$('cw-restart').addEventListener('click', () => { clearEffects(); resetMap(); goTo(0); });
btnPlayPause.addEventListener('click', () => setPaused(phase !== 'paused' ? true : false));
btnFree.addEventListener('click', () => setFree(!btnFree.classList.contains('on')));
$('cw-close').addEventListener('click', () => hidePanel(true));

const legend = $('cw-legend');
const legendToggle = $('cw-legend-toggle');
legendToggle.addEventListener('click', () => {
  legend.hidden = !legend.hidden;
  legendToggle.setAttribute('aria-expanded', String(!legend.hidden));
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') next();
  else if (e.key === 'ArrowLeft') prev();
  else if (e.key === ' ') { e.preventDefault(); setPaused(phase !== 'paused'); }
});

window.addEventListener('resize', () => { measure(); applyView(); syncSheet(); });

function resetMap() {
  arrowNodes.forEach((n) => n.classList.remove('on'));
  blockadeNodes.forEach((n) => n.classList.remove('on'));
  pinNodes.forEach((n) => n.classList.remove('seen', 'active'));
  currentYear = null;
  setYear(YEARS[0], false);
}

// ---------------------------------------------------------------- run loop

let last = performance.now();

function frame(now) {
  // Capped so a stall (a background tab, a slow first paint) cannot teleport
  // the rig across the map in one frame. The cost is that a device rendering
  // below ~10fps runs the tour slightly slow rather than dropping stops.
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (frontMorphLeft > 0) {
    frontMorphLeft -= dt;
    frontT = clamp(1 - frontMorphLeft / 1.5, 0, 1);
    drawFront(frontFrom, frontTo, frontT);
  }

  if (phase === 'travel') {
    phaseT += dt;
    const t = smoothstep(clamp(phaseT / travelSeconds, 0, 1));
    view.cx = lerp(travelFrom.cx, travelTo.cx, t);
    view.cy = lerp(travelFrom.cy, travelTo.cy, t);
    // Zoom in log space, so a 10x change reads as steady motion rather than a
    // slow start and a rush at the end.
    view.w = Math.exp(lerp(Math.log(travelFrom.w), Math.log(travelTo.w), t));
    applyView();
    if (phaseT >= travelSeconds) {
      phase = 'dwell';
      phaseT = 0;
      arrive(index);
    }
  } else if (phase === 'dwell') {
    phaseT += dt;
    if (phaseT >= dwellSeconds) next();
  }

  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- start

function intro() {
  measure();
  applyView();
  setYear(CONFIG.startView?.year ?? YEARS[0], false);

  // Land washes in from the Union outward, then the water, then the labels —
  // roughly the order you would draw the map by hand.
  const nodes = [...stateNodes.values()].map((s) => s.node);
  nodes.forEach((n, i) => setTimeout(() => n.classList.add('in'), 90 + i * 11));

  const afterLand = 90 + nodes.length * 11;
  setTimeout(() => {
    document.querySelectorAll('.cw-state-label, .cw-city')
      .forEach((n, i) => setTimeout(() => n.classList.add('in'), i * 9));
  }, afterLand);

  setTimeout(() => goTo(0), afterLand + 500);
  requestAnimationFrame(frame);
}

try {
  if (!loci.length) throw new Error('no loci in the scene config');
  intro();
} catch (err) {
  console.error(err);
  fail(`Could not start the Civil War scene: ${err.message}`);
}
