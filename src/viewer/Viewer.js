import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildLoci } from './loci.js';
import { Walkthrough } from './Walkthrough.js';
import { LocusOverlay } from './LocusOverlay.js';
import { buildLocusLabels } from './LocusLabels.js';
import { FreeMove } from './FreeMove.js';

const SKY = 0x87b6d9;

export class Viewer {
  constructor({ canvas, modelUrl, config }) {
    this.canvas = canvas;
    this.modelUrl = modelUrl;
    this.config = config;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SKY);
    this.scene.fog = new THREE.Fog(SKY, 60, 220);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      2000,
    );
    this.camera.position.set(45, 35, 45);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.maxPolarAngle = Math.PI * 0.85;

    this.scene.add(new THREE.HemisphereLight(0xbfe0ff, 0x3a3a2e, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(60, 90, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -80, right: 80, top: 80, bottom: -80, near: 1, far: 300,
    });
    this.scene.add(sun);

    this.clock = new THREE.Clock();
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  start() {
    const loader = new GLTFLoader();
    return loader.loadAsync(this.modelUrl).then((gltf) => {
      const model = gltf.scene;
      model.traverse((n) => {
        if (n.isMesh) {
          n.castShadow = true;
          n.receiveShadow = true;
        }
      });
      this.scene.add(model);

      const loci = buildLoci(model, this.config);
      this.loci = loci;
      this.locusLabels = buildLocusLabels(loci);
      this.scene.add(this.locusLabels);
      this.overlay = new LocusOverlay(loci.length);
      this.walkthrough = new Walkthrough({
        camera: this.camera,
        controls: this.controls,
        loci,
        config: this.config,
        onLocusChange: (i, locus) => this.overlay.show(i, locus),
      });
      this.freeMove = new FreeMove({ root: document.body });
      this.freeModeActive = false;

      this._wireTransport();
      this._wireLocusPicking();
      this._setFreeMode(true); // free exploration is the default on entering a scene

      document.getElementById('loading').classList.add('hidden');
      this._animate();
      return this;
    });
  }

  _wireTransport() {
    const playpause = document.getElementById('btn-playpause');
    playpause.addEventListener('click', () => {
      const paused = !this.walkthrough.paused;
      this.walkthrough.setPaused(paused);
      playpause.textContent = paused ? 'Resume' : 'Pause';
    });
    document.getElementById('btn-next').addEventListener('click', () =>
      this.walkthrough.next(),
    );
    document.getElementById('btn-prev').addEventListener('click', () =>
      this.walkthrough.prev(),
    );
    document.getElementById('btn-restart').addEventListener('click', () => {
      this.walkthrough.restart();
      this.walkthrough.setPaused(false);
      playpause.textContent = 'Pause';
    });

    document.getElementById('btn-freemove').addEventListener('click', () => {
      this._setFreeMode(!this.freeModeActive);
    });
  }

  // Toggles between the system-controlled tour and free exploration. In free
  // mode the Prev/Pause/Next/Restart tour controls and the narration panels
  // are hidden — they describe the rails walkthrough, which is paused.
  _setFreeMode(active) {
    this.freeModeActive = active;
    this.walkthrough.setFreeMode(active);

    const freemoveBtn = document.getElementById('btn-freemove');
    const tourControls = document.getElementById('tour-controls');
    const overlay = document.getElementById('overlay');
    const locusPanel = document.getElementById('locus-panel');

    if (active) {
      this.freeMove.show();
      freemoveBtn.textContent = 'Tour Mode';
      freemoveBtn.classList.add('active');
      tourControls.hidden = true;
      overlay.hidden = true;
      locusPanel.hidden = true;
    } else {
      this.freeMove.hide();
      freemoveBtn.textContent = 'Free Move';
      freemoveBtn.classList.remove('active');
      tourControls.hidden = false;
      overlay.hidden = false;
      locusPanel.hidden = false;
    }
  }

  // Tapping a numbered locus sprite shows its title/description, even in
  // free mode where the narration panel is otherwise hidden. A drag (used
  // to look around) is distinguished from a tap by pointer travel distance.
  _wireLocusPicking() {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dom = this.renderer.domElement;
    let downPos = null;

    dom.addEventListener('pointerdown', (e) => {
      downPos = { x: e.clientX, y: e.clientY };
    });

    dom.addEventListener('pointerup', (e) => {
      if (!downPos) return;
      const dragged = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6;
      downPos = null;
      if (dragged) return;

      const rect = dom.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, this.camera);
      const hit = raycaster.intersectObjects(this.locusLabels.children)[0];

      if (hit) {
        const index = this.locusLabels.children.indexOf(hit.object);
        document.getElementById('locus-panel').hidden = false;
        this.overlay.show(index, this.loci[index]);
      } else if (this.freeModeActive) {
        document.getElementById('locus-panel').hidden = true;
      }
    });
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.freeModeActive) {
      this.freeMove.update(dt, this.camera, this.controls); // pins target + calls controls.update() itself
    } else {
      this.walkthrough.update(dt);
      if (this.controls.enabled) this.controls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }
}
