import * as THREE from 'three';

const smoothstep = (t) => t * t * (3 - 2 * t);

// Shared by Walkthrough's dwell phase and FreeMove: keeps OrbitControls'
// target a fixed distance in front of the camera so dragging only rotates
// (never pans/zooms), regardless of who last moved the camera.
export function pinTargetInFrontOf(camera, controls, lookDistance) {
  const fwd = new THREE.Vector3();
  camera.getWorldDirection(fwd);
  controls.target.copy(camera.position).addScaledVector(fwd, lookDistance);
  controls.minDistance = lookDistance;
  controls.maxDistance = lookDistance;
  controls.update();
}

// System-controlled camera rig.
//  - "travel" phase: rig drives the camera from one locus anchor to the
//    next; user input is ignored.
//  - "dwell" phase: camera is parked at the anchor and the user may drag to
//    look around (rotate only — no pan, no zoom, no walk).
export class Walkthrough {
  constructor({ camera, controls, loci, config, onLocusChange }) {
    this.camera = camera;
    this.controls = controls;
    this.loci = loci;
    this.cfg = config.walkthrough || {};
    this.onLocusChange = onLocusChange || (() => {});

    this.travelSeconds = this.cfg.travelSeconds ?? 6;
    this.dwellSeconds = this.cfg.dwellSeconds ?? 7;
    this.eyeHeight = this.cfg.eyeHeight ?? 2.4;
    this.anchorDistance = this.cfg.anchorDistance ?? 9;
    this.loop = this.cfg.loop ?? true;
    this.lookDistance = 2; // fixed radius used for rotate-in-place

    // Street / corridor scenes: instead of anchoring the camera radially from
    // the loci centroid (which shoves it along the street axis), sit it a
    // fixed distance to one side of each locus, always toward the centre line.
    // `sideView: { axis: 'x'|'z', distance, height }` — axis is the street's
    // long axis; the camera offsets on the other axis toward 0.
    this.sideView = this.cfg.sideView || null;

    // Radial anchoring measures from the centroid of *all* loci, which breaks
    // down when a scene has two separate clusters (Portal Island's gate ring
    // plus the Rosetta square on its peninsula): the shared centroid sits in
    // the empty water between them and aims the camera off to one side of
    // every gate. A locus may therefore name its own centre with
    // `anchorFrom: [x, y, z]` (three.js space; only x/z are used).

    const center = new THREE.Vector3();
    loci.forEach((l) => center.add(l.position));
    center.divideScalar(Math.max(1, loci.length));

    this.stops = loci.map((l) => {
      let anchor;
      if (this.sideView) {
        anchor = l.position.clone();
        const off = this.sideView.axis === 'x' ? 'z' : 'x';
        const sign = Math.sign(l.position[off]) || 1;
        anchor[off] -= sign * (this.sideView.distance ?? 8);
        anchor.y = l.position.y + (this.sideView.height ?? this.eyeHeight);
      } else {
        const from = l.anchorFrom
          ? new THREE.Vector3(l.anchorFrom[0], 0, l.anchorFrom[2])
          : center;
        const dir = new THREE.Vector3(
          l.position.x - from.x,
          0,
          l.position.z - from.z,
        );
        if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
        dir.normalize();
        // A locus may override the rig's stand-off distance and eye height.
        // A NEGATIVE anchorDistance puts the camera on the centroid side of
        // the locus instead of beyond it -- which for solar-system means
        // between the Sun and the planet, so every body is seen lit rather
        // than backlit.
        const dist = l.anchorDistance ?? this.anchorDistance;
        anchor = l.position.clone().addScaledVector(dir, dist);
        anchor.y = l.position.y + (l.eyeHeight ?? this.eyeHeight);
      }
      return { anchor, look: l.position.clone(), locus: l };
    });

    this.index = 0;
    this.phase = 'dwell';
    this.clock = 0;
    this.paused = false;
    this.from = null;
    this.done = false;

    // A scene may have no loci at all -- glacier-deck is a place to be in
    // rather than a sequence to be walked, so it ships none. There is nothing
    // to park the camera on and nothing to narrate, so the rig stays inert and
    // every transport method is a no-op; Viewer hides the transport bar and
    // leaves free move as the only mode.
    this.empty = this.stops.length === 0;
    if (this.empty) return;

    this._applyStop(0);
    this.onLocusChange(0, this.loci[0]);
  }

  _applyStop(i) {
    const s = this.stops[i];
    this.camera.position.copy(s.anchor);
    this.camera.lookAt(s.look);
    this._pinLookTarget();
  }

  _pinLookTarget() {
    pinTargetInFrontOf(this.camera, this.controls, this.lookDistance);
  }

  _startTravel(toIndex) {
    this.from = {
      anchor: this.camera.position.clone(),
      look: this.stops[this.index].look.clone(),
    };
    this.index = toIndex;
    this.phase = 'travel';
    this.clock = 0;
    this.controls.enabled = false;
  }

  _arrive() {
    this.phase = 'dwell';
    this.clock = 0;
    this._applyStop(this.index);
    this.controls.enabled = true;
    this.onLocusChange(this.index, this.loci[this.index]);
  }

  next() {
    if (this.empty) return;
    if (this.index >= this.stops.length - 1 && !this.loop) return;
    const to = (this.index + 1) % this.stops.length;
    this._startTravel(to);
    this.done = false;
  }

  prev() {
    if (this.empty) return;
    const to = (this.index - 1 + this.stops.length) % this.stops.length;
    this._startTravel(to);
    this.done = false;
  }

  restart() {
    if (this.empty) return;
    this.index = 0;
    this.done = false;
    this._arrive();
  }

  setPaused(p) {
    this.paused = p;
  }

  // Suspend/resume rails control for FreeMove. Entering freezes travel/dwell
  // timers so they don't fight the free camera; leaving snaps back to the
  // current stop's official anchor/look so the tour resumes predictably.
  setFreeMode(active) {
    this.freeMode = active;
    if (!active && !this.empty) this._applyStop(this.index);
  }

  update(dt) {
    if (this.freeMode || this.empty) return;

    if (this.phase === 'travel') {
      this.clock += dt;
      const t = smoothstep(Math.min(1, this.clock / this.travelSeconds));
      const pos = this.from.anchor.clone().lerp(this.stops[this.index].anchor, t);
      const look = this.from.look.clone().lerp(this.stops[this.index].look, t);
      this.camera.position.copy(pos);
      this.camera.lookAt(look);
      if (this.clock >= this.travelSeconds) this._arrive();
      return;
    }

    // dwell
    if (this.paused) return;
    this.clock += dt;
    if (this.clock >= this.dwellSeconds) {
      if (this.index < this.stops.length - 1) {
        this._startTravel(this.index + 1);
      } else if (this.loop) {
        this._startTravel(0);
      } else {
        this.done = true;
        this.clock = 0;
      }
    }
  }
}
