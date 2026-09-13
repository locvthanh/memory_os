import * as THREE from 'three';
import { pinTargetInFrontOf } from './Walkthrough.js';

// Fly mode. This used to be a walk: forward was flattened to the ground plane
// and you climbed only with the up/down buttons. It now flies -- forward goes
// exactly where the camera is pointed, so you gain and lose height by aiming --
// because the scenes outgrew walking. Future City is ~1 km across and The Stack
// is a pit you want to drop into; a 4 units/sec ground walk made both of them a
// chore. Strafing stays level on purpose: rolling the horizon while sliding
// sideways is what makes free cameras nauseating.
const BASE_SPEED = 8;      // units/sec along the look direction
const VERTICAL_RATIO = 0.7; // rise/descend, as a fraction of BASE_SPEED
const BOOST_FACTOR = 5;     // while boost is held
const RESPONSE = 0.12;      // seconds to reach ~63% of target velocity
const LOOK_DISTANCE = 2;    // matches Walkthrough's rotate-in-place radius
const BOOST_FOV = 6;        // degrees of extra FOV at full boost, for speed feel

const KEY_MAP = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  Space: 'up', KeyE: 'up',
  KeyC: 'down', KeyQ: 'down', ControlLeft: 'down', ControlRight: 'down',
  ShiftLeft: 'boost', ShiftRight: 'boost',
};

const DESKTOP_HINT = 'Drag to look &middot; WASD flies where you are looking &middot; '
  + 'Space/E up, C/Q down &middot; hold Shift to boost';
const TOUCH_HINT = 'Drag to look &middot; joystick to fly where you are looking &middot; '
  + '&uarr;&darr; to rise/descend &middot; hold &raquo; to boost';

// Free-fly movement layered on top of the existing OrbitControls drag-to-look.
// Owns the on-screen joystick, up/down and boost buttons (for touch/mobile) and
// the WASD/Space/Shift keyboard equivalent (for desktop). Every frame it
// translates the camera by the current input, then re-pins the OrbitControls
// target in front of the (now moved) camera so dragging keeps rotating only.
//
// Per-scene overrides, all optional: `fly: { speed, boost, minY }` on the scene
// config. `speed` is the base units/sec (a body-scale interior wants less than a
// city), `boost` the multiplier while boost is held, `minY` a floor the camera
// may not sink below. Scenes that set none fly at the constants above.
export class FreeMove {
  constructor({ root, options = {} } = {}) {
    this.root = root;
    this.speed = options.speed ?? BASE_SPEED;
    this.boostFactor = options.boost ?? BOOST_FACTOR;
    this.minY = options.minY ?? null;
    this.keys = new Set();
    this.joystick = { active: false, x: 0, y: 0, pointerId: null };
    this.vertical = 0;       // -1, 0, 1 from the up/down buttons
    this.touchBoost = false; // from the on-screen boost button
    // Velocity is smoothed rather than applied raw: a camera that starts and
    // stops on the exact frame a key goes down reads as a jump cut, not flight.
    this.velocity = new THREE.Vector3();
    this._baseFov = null;

    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._target = new THREE.Vector3();

    this._buildDom();
    this._onKeyDown = (e) => {
      const action = KEY_MAP[e.code];
      if (!action) return;
      // Space scrolls the page and Ctrl+key is a browser shortcut surface;
      // neither should leak out of a scene you are flying through.
      if (e.code === 'Space') e.preventDefault();
      this.keys.add(action);
    };
    this._onKeyUp = (e) => { if (KEY_MAP[e.code]) this.keys.delete(KEY_MAP[e.code]); };
    // Alt-tabbing away with a key down used to leave the camera drifting
    // forever, because the keyup landed in another window.
    this._onBlur = () => { this.keys.clear(); };
  }

  _buildDom() {
    const wrap = document.createElement('div');
    wrap.className = 'freemove-ui';
    wrap.hidden = true;
    const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    wrap.innerHTML = `
      <p class="freemove-hint">${touch ? TOUCH_HINT : DESKTOP_HINT}</p>
      <div class="joystick-base">
        <div class="joystick-knob"></div>
      </div>
      <button type="button" class="fly-boost" aria-label="Boost">&raquo;</button>
      <div class="vertical-controls">
        <button type="button" data-dir="up" aria-label="Rise">&uarr;</button>
        <button type="button" data-dir="down" aria-label="Descend">&darr;</button>
      </div>
    `;
    this.root.appendChild(wrap);
    this.dom = wrap;

    const base = wrap.querySelector('.joystick-base');
    const knob = wrap.querySelector('.joystick-knob');
    this._joystickBase = base;
    this._joystickKnob = knob;

    const maxRadius = 34;
    const setKnob = (dx, dy) => {
      const len = Math.hypot(dx, dy) || 1;
      const clamped = Math.min(len, maxRadius);
      const nx = (dx / len) * clamped;
      const ny = (dy / len) * clamped;
      knob.style.transform = `translate(${nx}px, ${ny}px)`;
      this.joystick.x = nx / maxRadius;
      this.joystick.y = ny / maxRadius;
    };

    const start = (e) => {
      this.joystick.active = true;
      this.joystick.pointerId = e.pointerId;
      base.setPointerCapture(e.pointerId);
      move(e);
    };
    const move = (e) => {
      if (!this.joystick.active || e.pointerId !== this.joystick.pointerId) return;
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setKnob(e.clientX - cx, e.clientY - cy);
    };
    const end = (e) => {
      if (e.pointerId !== this.joystick.pointerId) return;
      this.joystick.active = false;
      this.joystick.x = 0;
      this.joystick.y = 0;
      knob.style.transform = 'translate(0, 0)';
    };
    base.addEventListener('pointerdown', start);
    base.addEventListener('pointermove', move);
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);

    wrap.querySelectorAll('.vertical-controls button').forEach((btn) => {
      const dir = btn.dataset.dir === 'up' ? 1 : -1;
      const press = (e) => { e.preventDefault(); this.vertical = dir; };
      const release = () => { this.vertical = 0; };
      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('pointerleave', release);
    });

    const boostBtn = wrap.querySelector('.fly-boost');
    this._boostBtn = boostBtn;
    const boostOn = (e) => {
      e.preventDefault();
      this.touchBoost = true;
      boostBtn.classList.add('active');
    };
    const boostOff = () => {
      this.touchBoost = false;
      boostBtn.classList.remove('active');
    };
    boostBtn.addEventListener('pointerdown', boostOn);
    boostBtn.addEventListener('pointerup', boostOff);
    boostBtn.addEventListener('pointercancel', boostOff);
    boostBtn.addEventListener('pointerleave', boostOff);
  }

  show() {
    this.dom.hidden = false;
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
  }

  hide() {
    this.dom.hidden = true;
    this.keys.clear();
    this.vertical = 0;
    this.touchBoost = false;
    this.velocity.set(0, 0, 0);
    this.joystick.active = false;
    this.joystick.x = 0;
    this.joystick.y = 0;
    this._joystickKnob.style.transform = 'translate(0, 0)';
    this._boostBtn.classList.remove('active');
    // Leaving fly mode mid-boost must not hand Tour Mode a widened lens.
    if (this._camera && this._baseFov !== null && this._camera.fov !== this._baseFov) {
      this._camera.fov = this._baseFov;
      this._camera.updateProjectionMatrix();
    }
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
  }

  update(dt, camera, controls) {
    if (this._baseFov === null) this._baseFov = camera.fov;
    this._camera = camera; // kept so hide() can put the lens back

    let ix = this.joystick.x;
    let iy = -this.joystick.y; // screen-down is backward
    if (this.keys.has('forward')) iy += 1;
    if (this.keys.has('back')) iy -= 1;
    if (this.keys.has('right')) ix += 1;
    if (this.keys.has('left')) ix -= 1;
    ix = Math.max(-1, Math.min(1, ix));
    iy = Math.max(-1, Math.min(1, iy));

    let iv = this.vertical;
    if (this.keys.has('up')) iv = 1;
    if (this.keys.has('down')) iv = -1;

    const boosting = this.touchBoost || this.keys.has('boost');
    const speed = this.speed * (boosting ? this.boostFactor : 1);

    // Forward is the true look direction -- pitch included -- so aiming up
    // climbs and aiming down dives. Strafe is deliberately flattened: sliding
    // sideways along a tilted right vector rolls the world and reads as drift.
    camera.getWorldDirection(this._forward);
    if (this._forward.lengthSq() < 1e-6) this._forward.set(0, 0, -1);
    this._forward.normalize();
    this._right.crossVectors(this._forward, camera.up);
    this._right.y = 0;
    if (this._right.lengthSq() < 1e-6) {
      // Looking straight up or straight down: the cross product degenerates,
      // so borrow a horizontal axis from the camera's own right column.
      this._right.setFromMatrixColumn(camera.matrixWorld, 0);
      this._right.y = 0;
    }
    if (this._right.lengthSq() < 1e-6) this._right.set(1, 0, 0);
    this._right.normalize();

    this._target.set(0, 0, 0);
    this._target.addScaledVector(this._forward, iy * speed);
    this._target.addScaledVector(this._right, ix * speed);
    this._target.y += iv * speed * VERTICAL_RATIO;

    // Exponential approach to the target velocity: instant enough to feel
    // responsive, damped enough that stopping coasts rather than slams.
    const k = 1 - Math.exp(-dt / RESPONSE);
    this.velocity.lerp(this._target, k);
    if (this.velocity.lengthSq() < 1e-8) this.velocity.set(0, 0, 0);
    camera.position.addScaledVector(this.velocity, dt);
    if (this.minY !== null && camera.position.y < this.minY) {
      camera.position.y = this.minY;
      if (this.velocity.y < 0) this.velocity.y = 0;
    }

    // A touch of FOV with speed. Small on purpose: enough to register as going
    // fast, not enough to bend the architecture the loci are built on.
    const wantFov = this._baseFov + (boosting ? BOOST_FOV : 0);
    if (Math.abs(camera.fov - wantFov) > 0.01) {
      camera.fov += (wantFov - camera.fov) * Math.min(1, dt * 6);
      camera.updateProjectionMatrix();
    }

    pinTargetInFrontOf(camera, controls, LOOK_DISTANCE);
  }
}
