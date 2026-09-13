// The Endless Survey — build entry and the delving itself.
//
// There is no map of this world because there cannot be one: it is laid out
// as you walk it. The Rotunda of the Day stands at the origin; every door you
// approach fetches its article, builds an octagonal room out of it and bolts
// that room onto the far end of a sloping corridor running out through that
// door. The new room's own cross-references become six more doors, and so on
// for as long as you keep going. Each level sits a little lower than the last,
// so the survey reads as a descent.
//
// Two limits keep it honest. A room is never built where one already stands
// (the placement walks outward until it finds clear ground, and gives up
// rather than overlap), and only MAX_ROOMS are kept: cross the limit and the
// furthest dead-end room behind you is disposed and its door closes again.
// Walk back to it and it is rebuilt — from the encyclopedia as it is then,
// not as it was.
import * as THREE from 'three';
import { Batch, solidMaterial, glowMaterial } from '../kit.js';
import { PAL, orientedBox, sconce } from './parts.js';
import { buildRotunda } from './rotunda.js';
import { buildChamber, ENTRY_FACE, N as CHAMBER_N, DOOR } from './chamber.js';
import { createHud } from './hud.js';
import { loadDay, loadArticle, todayParts } from './wiki.js';

const CORRIDOR = 13;        // metres of tunnel between two rooms
const DESCENT = 2.4;        // how far each level sits below the one before
const MAX_ROOMS = 10;
const OPEN_RANGE = 7.5;     // walk this close to a door and it opens
const HYDRATE_RANGE = 46;   // pictures load for rooms this close
const LIGHTS = 4;

const ENTRY_PHI = ((ENTRY_FACE + 0.5) * Math.PI * 2) / CHAMBER_N;

export async function build({ setStatus = () => {} } = {}) {
  const solid = solidMaterial();
  const glow = glowMaterial();
  const root = new THREE.Group();
  root.name = 'endless-survey';

  const day = await loadDay(setStatus);
  setStatus('Opening the rotunda…');

  const rooms = [];
  const lights = [];
  for (let i = 0; i < LIGHTS; i += 1) {
    const l = new THREE.PointLight(0xffdfae, 0, 60, 1.6);
    l.visible = false;
    root.add(l);
    lights.push(l);
  }

  function addRoom(room, parent, door) {
    const entry = {
      room, parent, door, children: 0, corridor: null,
      centre: new THREE.Vector3(),
    };
    rooms.push(entry);
    root.add(room.group);
    room.group.updateMatrixWorld(true);
    entry.centre.setFromMatrixPosition(room.group.matrixWorld);
    return entry;
  }

  const rotunda = buildRotunda({ day, solid, glow });
  const home = addRoom(rotunda, null, null);
  rotunda.hydrate();

  // ------------------------------------------------------------ placement

  const _v = new THREE.Vector3();

  function worldDirOf(entry, door) {
    return door.dir.clone().applyQuaternion(entry.room.group.quaternion)
      .setY(0).normalize();
  }

  function worldAnchorOf(entry, door) {
    return entry.room.group.localToWorld(door.anchor.clone());
  }

  /** Walk outward from the door until the new room clears everything already
   *  standing. Returns null if there is simply no room for it. */
  function findSpot(from, dir, childApothem, childRadius) {
    let dist = 0;
    const base = from.room.apothem + CORRIDOR + childApothem;
    for (let k = 0; k < 7; k += 1) {
      dist = base + k * 7;
      const p = from.centre.clone().addScaledVector(dir, dist);
      p.y = from.centre.y - DESCENT;
      const clash = rooms.some((e) => {
        const min = (e.room.radius + childRadius) * 0.92;
        return _v.copy(e.centre).sub(p).setY(0).length() < min;
      });
      if (!clash) return { pos: p, dist };
    }
    return null;
  }

  function buildCorridor(aMouth, bMouth) {
    const bat = new Batch();
    const gbat = new Batch();
    const dir = bMouth.clone().sub(aMouth);
    const len = dir.length();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    const w = DOOR.width;
    const A = [aMouth.x, aMouth.y, aMouth.z];
    const B = [bMouth.x, bMouth.y, bMouth.z];
    const off = (p, s, dy) => [p[0] + perp.x * s, p[1] + dy, p[2] + perp.z * s];
    orientedBox(bat, off(A, 0, -0.3), off(B, 0, -0.3), w + 1.2, 0.6, PAL.floorB);
    orientedBox(bat, off(A, 0, 0.02), off(B, 0, 0.02), w, 0.08, PAL.floorA);
    orientedBox(bat, off(A, 0, DOOR.height + 0.3), off(B, 0, DOOR.height + 0.3),
      w + 1.2, 0.6, PAL.ceiling);
    for (const s of [-(w / 2 + 0.3), w / 2 + 0.3]) {
      orientedBox(bat, off(A, s, DOOR.height / 2), off(B, s, DOOR.height / 2),
        0.6, DOOR.height, PAL.panel);
      orientedBox(bat, off(A, s, 0.55), off(B, s, 0.55), 0.72, 1.1, PAL.panelDark);
    }
    // lamps down the tunnel, and the brass rail that follows the fall
    const lamps = Math.max(1, Math.round(len / 5));
    for (let i = 1; i <= lamps; i += 1) {
      const t = i / (lamps + 1);
      const p = aMouth.clone().lerp(bMouth, t);
      const yaw = Math.atan2(perp.z, perp.x);
      sconce(bat, gbat, [p.x + perp.x * (w / 2 + 0.1), p.y + 3.1, p.z + perp.z * (w / 2 + 0.1)],
        yaw + Math.PI, 0.85);
    }
    orientedBox(bat, off(A, w / 2 + 0.02, 1.0), off(B, w / 2 + 0.02, 1.0), 0.1, 0.1, PAL.brass);
    orientedBox(bat, off(A, -(w / 2 + 0.02), 1.0), off(B, -(w / 2 + 0.02), 1.0), 0.1, 0.1, PAL.brass);

    const group = new THREE.Group();
    const m = bat.build(solid);
    const g = gbat.build(glow);
    if (m) group.add(m);
    if (g) group.add(g);
    return group;
  }

  // --------------------------------------------------------------- doors

  let pending = 0;

  async function openDoor(door) {
    if (door.opened || door.pending || door.sealed) return;
    if (door.retryAt && door.retryAt > Date.now()) return;
    const parent = rooms.find((e) => e.room.doors.includes(door));
    if (!parent) return;
    door.pending = true;
    pending += 1;
    hud.status(`Fetching — ${door.title}…`);
    try {
      const article = await loadArticle(door.title);
      if (!article) {
        door.sealed = true;
        door.description = 'this one could not be read — the door is bricked up';
        return;
      }
      const dir = worldDirOf(parent, door);
      const probe = buildChamber({ article, depth: parent.room.depth + 1, solid, glow });
      const spot = findSpot(parent, dir, probe.apothem, probe.radius);
      if (!spot) {
        probe.dispose();
        door.sealed = true;
        door.description = 'the survey is already standing here — no room for another';
        return;
      }
      // aim the new room's entry arch back down the corridor
      const back = Math.atan2(-dir.z, -dir.x);
      probe.group.position.copy(spot.pos);
      probe.group.rotation.y = ENTRY_PHI - back;
      const child = addRoom(probe, parent, door);
      parent.children += 1;

      const aMouth = parent.centre.clone().addScaledVector(dir, parent.room.apothem);
      const bMouth = child.centre.clone().addScaledVector(dir, -probe.apothem);
      child.corridor = buildCorridor(aMouth, bMouth);
      root.add(child.corridor);

      door.opened = true;
      door.child = child;
      probe.hydrate();
      prune();
    } catch (err) {
      // Not sealed: the encyclopedia was simply unreachable just then. Back
      // off and let the next approach try again.
      console.warn('expedition: could not open', door.title, err);
      door.retryAt = Date.now() + 6000;
    } finally {
      door.pending = false;
      pending -= 1;
      if (!pending) hud.status('');
    }
  }

  function disposeRoom(entry) {
    root.remove(entry.room.group);
    if (entry.corridor) root.remove(entry.corridor);
    entry.room.dispose();
    if (entry.parent) entry.parent.children -= 1;
    if (entry.door) {
      entry.door.opened = false;
      entry.door.child = null;
    }
    rooms.splice(rooms.indexOf(entry), 1);
  }

  let camPos = new THREE.Vector3();

  function prune() {
    while (rooms.length > MAX_ROOMS) {
      let worst = null;
      for (const e of rooms) {
        if (!e.parent || e.children) continue;       // never the rotunda, never a junction
        const d = e.centre.distanceTo(camPos);
        if (d < 40) continue;                        // never one you can still see
        if (!worst || d > worst.centre.distanceTo(camPos)) worst = e;
      }
      if (!worst) return;
      disposeRoom(worst);
    }
  }

  // ----------------------------------------------------------------- hud

  const readables = [];
  function collectReadables() {
    readables.length = 0;
    for (const e of rooms) {
      if (e.centre.distanceTo(camPos) > 70) continue;
      for (const m of e.room.readable) readables.push(m);
    }
    return readables;
  }

  const { label } = todayParts();
  const hud = createHud({
    getReadables: collectReadables,
    onOpen: openDoor,
    subtitle: day.source === 'live'
      ? `${label} · live from Wikipedia`
      : `${label} · the day could not be read — standing exhibition`,
  });
  hud.trail([rotunda.title], 0);

  let here = home;
  let frame = 0;

  return {
    root,
    day,

    update(dt, camera) {
      camPos.copy(camera.position);
      frame += 1;

      // which room are we in?
      let nearest = null;
      let nd = Infinity;
      for (const e of rooms) {
        const d = e.centre.distanceTo(camPos);
        if (d < nd) { nd = d; nearest = e; }
      }
      if (nearest && nearest !== here) {
        here = nearest;
        const names = [];
        for (let e = here; e; e = e.parent) names.unshift(e.room.title);
        hud.trail(names.slice(-4), here.room.depth);
      }

      // doors open as you walk up to them
      if (frame % 4 === 0) {
        for (const e of rooms) {
          if (e.centre.distanceTo(camPos) > 60) continue;
          for (const door of e.room.doors) {
            if (door.opened || door.pending || door.sealed) continue;
            if (door.retryAt && door.retryAt > Date.now()) continue;
            if (worldAnchorOf(e, door).distanceTo(camPos) < OPEN_RANGE) openDoor(door);
          }
          if (e.centre.distanceTo(camPos) < HYDRATE_RANGE) e.room.hydrate();
        }
      }

      // four lamps follow you: the nearest rooms are lit, the rest are not
      if (frame % 6 === 0) {
        const near = rooms
          .map((e) => ({ e, d: e.centre.distanceTo(camPos) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, LIGHTS);
        lights.forEach((l, i) => {
          const pick = near[i];
          l.visible = !!pick;
          if (!pick) return;
          l.position.set(pick.e.centre.x, pick.e.centre.y + pick.e.room.height * 0.62,
            pick.e.centre.z);
          l.distance = pick.e.room.radius * 3.4;
          l.intensity = 34;
        });
      }

      hud.update(dt, camera);
    },

    pick(raycaster) {
      return hud.pick(raycaster);
    },

    dispose() {
      hud.dispose();
      for (const e of [...rooms]) disposeRoom(e);
    },
  };
}

export default build;
