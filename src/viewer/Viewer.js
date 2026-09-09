import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildLoci } from './loci.js';
import { Walkthrough } from './Walkthrough.js';
import { LocusOverlay } from './LocusOverlay.js';
import { buildLocusLabels } from './LocusLabels.js';
import { FreeMove } from './FreeMove.js';
import { MusicPlayer } from './MusicPlayer.js';

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
    // Per-scene lighting / fog overrides, both optional: a scene config may
    // carry `lighting: { hemisphere, ambient, ambientColor, sun, shadowExtent }`
    // and `fog: { near, far }`. Scenes that omit them keep exactly the values
    // that were hard-coded here before. the-white-house sets both: after its
    // x1.6 rescale its interiors are lit only by the hemisphere light (the sun
    // is blocked by exterior walls that must keep casting shadows) and the old
    // constants left 6 m rooms nearly black and the far wing lost in fog.
    const L = (this.config && this.config.lighting) || {};
    const F = (this.config && this.config.fog) || {};
    this.scene.fog = new THREE.Fog(SKY, F.near ?? 60, F.far ?? 220);

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

    this.scene.add(new THREE.HemisphereLight(0xbfe0ff, 0x3a3a2e, L.hemisphere ?? 0.9));
    if (L.ambient) {
      this.scene.add(new THREE.AmbientLight(L.ambientColor ?? 0xfff1dd, L.ambient));
    }
    const sun = new THREE.DirectionalLight(0xffffff, L.sun ?? 1.4);
    sun.position.set(60, 90, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const E = L.shadowExtent ?? 80;
    Object.assign(sun.shadow.camera, {
      left: -E, right: E, top: E, bottom: -E, near: 1, far: Math.max(300, E * 4),
    });
    this.scene.add(sun);

    // Metals need reflections. With no `scene.environment`, three.js renders a
    // glTF material with metalness ~1 as BLACK -- which is why the gold
    // pedestal caps and every gilt / brass piece in the White House Library
    // read as holes punched in the model. Rather than vendor
    // examples/jsm/environments/RoomEnvironment.js, build a three-panel PMREM
    // probe here. Opt in per scene with `lighting: { environment: true }`;
    // scenes that omit it are byte-for-byte unchanged.
    if (L.environment) {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const probe = new THREE.Scene();
      probe.background = new THREE.Color(L.environmentColor ?? 0xdfe6ef);
      const box = new THREE.BoxGeometry(1, 1, 1);
      const panel = (color, p, s) => {
        const m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color }));
        m.position.set(p[0], p[1], p[2]);
        m.scale.set(s[0], s[1], s[2]);
        probe.add(m);
      };
      panel(0xfff4e2, [0, 6, 0], [14, 0.2, 14]);   // warm ceiling bounce
      panel(0x6a6255, [0, -6, 0], [16, 0.2, 16]);  // dim floor
      panel(0xffffff, [-6, 1, 0], [0.2, 8, 11]);   // window-side key
      this.scene.environment = pmrem.fromScene(probe, 0.06).texture;
      if ('environmentIntensity' in this.scene) {
        this.scene.environmentIntensity = L.environmentIntensity ?? 1;
      }
      box.dispose();
      pmrem.dispose();
    }

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
          // Roof/ceiling meshes are tagged ROOF_ by build_glb.py's merge step
          // (see MERGE_BY_MATERIAL/ROOF_MATERIALS there). They're kept in the
          // export for visual closure, but the scene's only light is a single
          // overhead directional light and every mesh casts a shadow by
          // default -- if roofs cast shadows too, the whole interior goes
          // black. Skip castShadow on them; they still receive shadows fine.
          n.castShadow = !n.name.startsWith('ROOF_');
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
      this._wireMusic();
      document.getElementById('locus-close').addEventListener('click', () => {
        this.overlay.dismiss();
      });
      this._setFreeMode(true); // free exploration is the default on entering a scene
      this._applyStartView();

      document.getElementById('loading').classList.add('hidden');
      this._animate();
      return this;
    });
  }

  // Optional per-scene opening shot. Without it a scene opens wherever the
  // walkthrough's first stop is -- i.e. already inside, nose-to-nose with the
  // first subject. `startView: { position, lookAt }` (three.js space) lets a
  // scene open on its own front door instead: the camera is placed and aimed
  // once, before the user takes over in free mode. Tour Mode still snaps back
  // to locus 1, and scenes without `startView` are unchanged.
  _applyStartView() {
    const sv = this.config.startView;
    if (!sv || !sv.position) return;
    this.camera.position.set(...sv.position);
    this.camera.lookAt(new THREE.Vector3(...(sv.lookAt || [0, 0, 0])));
    // FreeMove re-pins controls.target in front of the camera every frame, but
    // do it once here so the very first frame isn't still aimed at locus 1.
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    this.controls.target.copy(this.camera.position).addScaledVector(fwd, 2);
    this.controls.update();
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

  _wireMusic() {
    if (!this.config.music) return;
    this.music = new MusicPlayer({ src: this.config.music });

    const btn = document.getElementById('btn-music');
    btn.hidden = false;
    const sync = () => {
      btn.textContent = this.music.muted ? '\u{1F507}' : '\u{1F508}';
    };
    sync();
    btn.addEventListener('click', () => {
      this.music.toggleMute();
      sync();
    });
  }

  // Toggles between the system-controlled tour and free exploration. In free
  // mode the Prev/Pause/Next/Restart tour controls and the narration panels
  // are hidden — they describe the rails walkthrough, which is paused.
  _setFreeMode(active) {
    this.freeModeActive = active;
    this.walkthrough.setFreeMode(active);
    document.body.classList.toggle('free-mode', active);

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
        this.overlay.show(index, this.loci[index]); // show() unhides the panel
      } else {
        // Tap on empty scene = dismiss, in tour mode as well as free mode.
        // This is the "tap outside" affordance for the mobile sheet, and it is
        // safe in tour mode because the next stop calls show() again. The 6px
        // travel test above means drag-to-look never triggers it.
        this.overlay.dismiss();
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
