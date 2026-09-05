import * as THREE from 'three';
import { pinTargetInFrontOf } from './Walkthrough.js';

const MOVE_SPEED = 4; // units/sec, horizontal
const VERTICAL_SPEED = 3; // units/sec, up/down
const LOOK_DISTANCE = 2; // matches Walkthrough's rotate-in-place radius

const KEY_MAP = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  Space: 'up',
  ShiftLeft: 'down', ShiftRight: 'down',
};

// Free-fly movement layered on top of the existing OrbitControls drag-to-look.
// Owns the on-screen joystick + up/down buttons (for touch/mobile) and the
// WASD/Space/Shift keyboard equivalent (for desktop). Every frame it
// translates the camera by the current input, then re-pins the OrbitControls
// target in front of the (now moved) camera so dragging keeps rotating only.
export class FreeMove {
  constructor({ root }) {
    this.root = root;
    this.keys = new Set();
    this.joystick = { active: false, x: 0, y: 0, pointerId: null };
    this.vertical = 0; // -1, 0, 1 from up/down buttons

    this._buildDom();
    this._onKeyDown = (e) => { if (KEY_MAP[e.code]) this.keys.add(KEY_MAP[e.code]); };
    this._onKeyUp = (e) => { if (KEY_MAP[e.code]) this.keys.delete(KEY_MAP[e.code]); };
  }

  _buildDom() {
    const wrap = document.createElement('div');
    wrap.className = 'freemove-ui';
    wrap.hidden = true;
    wrap.innerHTML = `
      <p class="freemove-hint">Drag to look &middot; joystick to move &middot; hold &uarr;&darr; to rise/descend</p>
      <div class="joystick-base">
        <div class="joystick-knob"></div>
      </div>
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
  }

  show() {
    this.dom.hidden = false;
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  hide() {
    this.dom.hidden = true;
    this.keys.clear();
    this.vertical = 0;
    this.joystick.active = false;
    this.joystick.x = 0;
    this.joystick.y = 0;
    this._joystickKnob.style.transform = 'translate(0, 0)';
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  update(dt, camera, controls) {
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

    if (ix || iy || iv) {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

      camera.position.addScaledVector(forward, iy * MOVE_SPEED * dt);
      camera.position.addScaledVector(right, ix * MOVE_SPEED * dt);
      camera.position.y += iv * VERTICAL_SPEED * dt;
    }

    pinTargetInFrontOf(camera, controls, LOOK_DISTANCE);
  }
}
