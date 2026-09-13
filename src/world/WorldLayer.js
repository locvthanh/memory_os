import * as THREE from 'three';
import { buildFigure, setCarrying } from './figures.js';
import { buildWorks, buildStack } from './works.js';
import { stageOf, STAGE_LABEL } from './stages.js';
import { WorldHud } from './WorldHud.js';

// The living layer.
//
// Canon — models/*.glb and src/scenes/*.js — is hand-built and only Tony
// changes it. world/state.json is machine-written and data only. This module is
// the seam: it reads the state and composites it onto the loaded canon at
// runtime. Nothing here ever writes; nothing the tick writes is geometry.
//
// A scene opts in with `world: { id, stairX, gateZ }` in its config. A scene
// without that key loads exactly as it did before this file existed, and every
// failure here (no state file, wrong version, bad JSON) leaves the scene
// untouched — an evolving world must never be able to break a finished one.

const STATE_URL = new URL('../../world/state.json', import.meta.url);
const SUPPORTED_VERSION = 1;
const LEG_SECONDS = 26; // how long a figure takes to walk its current leg

export async function attachWorld({ scene, model, config, camera }) {
  const wcfg = config.world;
  if (!wcfg) return null;

  let state;
  try {
    const res = await fetch(STATE_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`state ${res.status}`);
    state = await res.json();
  } catch (err) {
    console.warn('world: no state to render —', err.message);
    return null;
  }
  if (state.version !== SUPPORTED_VERSION) {
    console.warn(`world: state version ${state.version} is not ${SUPPORTED_VERSION}; skipping`);
    return null;
  }
  const w = state.scenes?.[wcfg.id];
  if (!w) return null;

  const root = new THREE.Group();
  root.name = 'world-layer';
  scene.add(root);

  // --- the ground under everything -----------------------------------------
  // The tick stores positions as a distance along the stair (z). The shape of
  // the hill is the artist's business, not the simulation's, so the height is
  // found by dropping a ray onto the model that was actually loaded.
  const ray = new THREE.Raycaster();
  const DOWN = new THREE.Vector3(0, -1, 0);
  const UP = new THREE.Vector3(0, 1, 0);
  const nrm = new THREE.Matrix3();
  const wn = new THREE.Vector3();
  // The walkable surface under (x, z), nearest to the height you expect.
  //
  // Neither "first hit" nor "lowest hit" works on a terraced hill with solid
  // houses on it: the first hit is a roof (which is how the first dedication
  // tablets ended up hovering over the mountains) and the lowest is the plate
  // the whole hill stands on, eight units underground. So: keep only
  // upward-facing faces, then take the one closest to the height the caller
  // already knows about — the house's own underside, or the last stair sample.
  const groundAt = (x, z, expect = 0) => {
    ray.set(new THREE.Vector3(x, 240, z), DOWN);
    const hits = ray.intersectObject(model, true);
    let best = null;
    for (const h of hits) {
      if (!h.object.isMesh || !h.face) continue;
      nrm.getNormalMatrix(h.object.matrixWorld);
      wn.copy(h.face.normal).applyMatrix3(nrm).normalize();
      if (wn.dot(UP) <= 0.5) continue;
      if (best === null || Math.abs(h.point.y - expect) < Math.abs(best - expect)) best = h.point.y;
    }
    return best === null ? expect : best;
  };

  const stairX = wcfg.stairX ?? 0;
  // Sample the stair once so a walking figure can be placed at any z cheaply.
  const samples = [];
  const zTop = wcfg.zTop ?? -32;
  const zBottom = wcfg.zBottom ?? 50;
  // Walk up the stair carrying the previous height as the expectation, so each
  // sample lands on the step in front of the last one rather than on a bench.
  let expect = 0;
  for (let z = zBottom; z >= zTop; z -= 2) {
    expect = groundAt(stairX, z, expect);
    samples.push([z, expect]);
  }
  const stairY = (z) => {
    if (z >= samples[0][0]) return samples[0][1];
    const last = samples[samples.length - 1];
    if (z <= last[0]) return last[1];
    for (let i = 0; i < samples.length - 1; i += 1) {
      const [z0, y0] = samples[i];
      const [z1, y1] = samples[i + 1];
      if (z <= z0 && z >= z1) {
        const t = (z0 - z) / (z0 - z1 || 1);
        return y0 + (y1 - y0) * t;
      }
    }
    return 0;
  };

  // --- the hand-built houses, measured -------------------------------------
  // Scaffolding has to fit a silhouette nobody described to it, so measure the
  // canon instead of guessing: union the meshes standing near each plot.
  const anchors = new Map(); // plot id -> THREE.Vector3
  for (const l of config.loci || []) {
    if (l.position) anchors.set(l.id, new THREE.Vector3(...l.position));
  }
  // A locus baked into the glb wins over the config fallback, same rule the
  // tour uses.
  model.updateWorldMatrix(true, true);
  model.traverse((n) => {
    const m = n.name && n.name.match(/^Locus[_-]?(\d+)/i);
    if (!m) return;
    const p = new THREE.Vector3();
    n.getWorldPosition(p);
    anchors.set(parseInt(m[1], 10), p);
  });

  const boxes = new Map();
  const tmp = new THREE.Box3();
  model.traverse((n) => {
    if (!n.isMesh) return;
    tmp.setFromObject(n);
    const sx = tmp.max.x - tmp.min.x;
    const sz = tmp.max.z - tmp.min.z;
    const sy = tmp.max.y - tmp.min.y;
    if (sx > 22 || sz > 22 || sy < 1.2) return; // terraces, paths, lawns
    const c = tmp.getCenter(new THREE.Vector3());
    for (const [id, a] of anchors) {
      if (Math.hypot(c.x - a.x, c.z - a.z) > 6.5) continue;
      const b = boxes.get(id);
      if (b) b.union(tmp);
      else boxes.set(id, tmp.clone());
      break;
    }
  });

  // --- the works ------------------------------------------------------------
  const worksGroups = [];
  const pickables = [];
  for (const plot of w.plots) {
    const anchor = anchors.get(plot.id);
    if (!anchor) continue;
    // Houses flank the stair, so "the front" is the side facing x = stairX.
    const faceSign = anchor.x >= stairX ? -1 : 1;
    const g = buildWorks({
      plot,
      anchor,
      box: boxes.get(plot.id),
      faceSign,
      groundAt,
    });
    if (!g.children.length) continue;
    g.traverse((n) => {
      if (n.isMesh) {
        n.userData.pickPlot = plot;
        pickables.push(n);
      }
    });
    root.add(g);
    worksGroups.push(g);
    if (window.__worldDebug) {
      const b = boxes.get(plot.id);
      console.log(
        `plot ${plot.id}`, stageOf(plot), 'ground', groundAt(anchor.x, anchor.z, anchor.y).toFixed(2),
        b ? `box ${(b.max.x - b.min.x).toFixed(1)}x${(b.max.z - b.min.z).toFixed(1)}x${(b.max.y - b.min.y).toFixed(1)} @ ${((b.max.x+b.min.x)/2).toFixed(1)},${((b.max.z+b.min.z)/2).toFixed(1)}` : 'no box',
      );
    }
  }

  // The gate yard: his commits, stacked, waiting to be carried up.
  if (w.yard.blocks.length) {
    const gz = w.gateZ ?? 45;
    const stack = buildStack(w.yard.blocks);
    stack.position.set(stairX + 4.2, groundAt(stairX + 4.2, gz, 0), gz);
    stack.traverse((n) => {
      if (n.isMesh) {
        n.userData.pickYard = w.yard;
        pickables.push(n);
      }
    });
    root.add(stack);
  }
  if (w.site.blocks.length) {
    const active = w.plots.find((p) => p.active);
    const a = active && anchors.get(active.id);
    if (a) {
      const x = a.x + (a.x >= stairX ? -5.2 : 5.2);
      const stack = buildStack(w.site.blocks);
      stack.position.set(x, groundAt(x, a.z, a.y), a.z);
      stack.traverse((n) => {
        if (n.isMesh) {
          n.userData.pickYard = w.site;
          pickables.push(n);
        }
      });
      root.add(stack);
    }
  }

  // --- the inhabitants ------------------------------------------------------
  const people = w.inhabitants.map((person, i) => {
    const fig = buildFigure(person);
    setCarrying(fig, person.carrying);
    // Four figures on one stair would stand inside each other; give each a lane.
    const lane = stairX + (i - (w.inhabitants.length - 1) / 2) * 1.7;
    root.add(fig);
    pickables.push(fig.userData.hit);
    return { person, fig, lane, phase: i * 0.23 };
  });

  const hud = new WorldHud({ state, sceneId: wcfg.id, stageLabel: STAGE_LABEL, stageOf });

  let t = 0;
  const api = {
    state,
    update(dt) {
      t += dt;
      for (const p of people) {
        const { person, fig, lane } = p;
        const a = person.z;
        const b = person.targetZ;
        let z;
        let dir = 0;
        if (a === b) {
          z = a; // arrived: they stand and work
        } else {
          // Mid-journey. Ping-pong along the leg so the village is visibly in
          // motion without pretending to know where they are between ticks.
          const u = (Math.sin(((t + p.phase * LEG_SECONDS) / LEG_SECONDS) * Math.PI * 2) + 1) / 2;
          z = a + (b - a) * u;
          dir = Math.sign(b - a) * Math.cos(((t + p.phase * LEG_SECONDS) / LEG_SECONDS) * Math.PI * 2);
        }
        const y = stairY(z);
        fig.position.set(lane, y, z);
        // Facing: down the stair is +z, up is -z. Standing figures face it.
        fig.rotation.y = dir === 0 ? Math.PI : dir > 0 ? 0 : Math.PI;
        // A small bob, faster while walking, so nobody reads as a statue.
        fig.position.y += Math.sin(t * (a === b ? 1.6 : 5.2) + p.phase * 6) * 0.035;
      }
    },
    // Called from Viewer's existing tap handler before it falls through to the
    // locus badges, so a tap on a person never dismisses the locus panel.
    pick(raycaster) {
      const hit = raycaster.intersectObjects(pickables, false)[0];
      if (!hit) return false;
      const d = hit.object.userData;
      if (d.pickPerson) hud.showPerson(d.pickPerson);
      else if (d.pickPlot) hud.showPlot(d.pickPlot);
      else if (d.pickYard) hud.showYard(d.pickYard);
      else return false;
      return true;
    },
    dispose() {
      hud.dispose();
      scene.remove(root);
    },
  };
  return api;
}
