import * as THREE from 'three';
import { MATERIAL_COLOR, stageOf } from './stages.js';

// Everything the village builds. All of it is generated here at runtime from
// world/state.json, so a night's work never touches models/wisdom-village.glb:
// the hand-built village stays exactly as it was authored and the machine only
// ever adds a layer on top of it. That separation is the whole safety story —
// see docs/simulated-world.md.

const POST = 0.09;

function post(h, color = 0x8a6338) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(POST, h, POST),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9 }),
  );
  m.castShadow = true;
  return m;
}

function rail(len, axis, color = 0x8a6338) {
  const g =
    axis === 'x'
      ? new THREE.BoxGeometry(len, POST * 0.8, POST * 0.8)
      : new THREE.BoxGeometry(POST * 0.8, POST * 0.8, len);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
  m.castShadow = true;
  return m;
}

// A stone tablet carrying the commit the house was founded on. This is the
// payoff of the whole intake chain: the wall can be read back to the work.
function tablet(inscription, sub) {
  const g = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4a5057';
  ctx.fillRect(0, 0, 640, 360);
  ctx.strokeStyle = '#8b939b';
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, 608, 328);

  ctx.fillStyle = '#e9edf1';
  ctx.textAlign = 'center';
  ctx.font = 'bold 34px Georgia, "Times New Roman", serif';

  const words = String(inscription || '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > 540 && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, 4);
  const y0 = 180 - (shown.length - 1) * 24;
  shown.forEach((l, i) => ctx.fillText(l, 320, y0 + i * 48));

  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillStyle = '#9fa8b0';
  ctx.fillText(sub, 320, 318);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  // Unlit on purpose, the same choice the numbered locus badges make: a
  // tablet on the shaded side of a house is still the thing you came to read.
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.24),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  face.position.y = 1.35;
  face.castShadow = true;
  g.add(face);

  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.26, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x6f767d, roughness: 1 }),
  );
  slab.position.y = 0.13;
  slab.receiveShadow = true;
  slab.castShadow = true;
  g.add(slab);

  const backer = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 1.5, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x545a60, roughness: 1 }),
  );
  backer.position.set(0, 1.0, -0.12);
  backer.castShadow = true;
  g.add(backer);

  return g;
}

function lamp(wear) {
  const g = new THREE.Group();
  const pole = post(2.4, 0x4c4237);
  pole.position.y = 1.2;
  g.add(pole);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 10, 8),
    new THREE.MeshStandardMaterial({
      color: 0xffe6ad,
      emissive: 0xffb648,
      // Wear is what the lamplighter is fighting. A house nobody maintains
      // does not fall down; its light just gets dimmer.
      emissiveIntensity: 2.2 * (1 - Math.min(1, wear)),
      roughness: 1,
    }),
  );
  glow.position.y = 2.5;
  g.add(glow);
  return g;
}

// A pile of blocks — at the gate, or delivered to a site. Each box is one
// commit, which makes the backlog physical: a busy week is a visible heap.
export function buildStack(blocks, max = 14) {
  const g = new THREE.Group();
  const n = Math.min(blocks.length, max);
  for (let i = 0; i < n; i += 1) {
    const b = blocks[i];
    const col = i % 3;
    const row = Math.floor(i / 3);
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.34, 0.44),
      new THREE.MeshStandardMaterial({
        color: MATERIAL_COLOR[b.material] ?? 0x9aa3a9,
        roughness: 0.95,
      }),
    );
    m.position.set((col - 1) * 0.68, 0.17 + row * 0.36, (row % 2) * 0.06);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  return g;
}

// The works on one plot. `box` is the hand-built house's bounding box, found by
// measuring the loaded glb — so the scaffolding fits whatever silhouette the
// plot happens to have instead of a number guessed here.
export function buildWorks({ plot, anchor, box, faceSign, groundAt }) {
  const stage = stageOf(plot);
  const g = new THREE.Group();
  g.name = `works-plot-${plot.id}`;
  if (stage === 'bare') return g;

  const halfX = box ? Math.max(2.5, (box.max.x - box.min.x) / 2 + 0.9) : 4.2;
  const halfZ = box ? Math.max(2.5, (box.max.z - box.min.z) / 2 + 0.9) : 4.2;
  const cx = box ? (box.max.x + box.min.x) / 2 : anchor.x;
  const cz = box ? (box.max.z + box.min.z) / 2 : anchor.z;
  // The house's own underside is the most reliable ground there is — it was
  // put there by hand, sitting on the terrace.
  const ground = box ? box.min.y : groundAt(cx, cz, anchor.y);
  const top = box ? box.max.y - ground : 5.5;

  const corners = [
    [cx - halfX, cz - halfZ],
    [cx + halfX, cz - halfZ],
    [cx + halfX, cz + halfZ],
    [cx - halfX, cz + halfZ],
  ];

  if (stage === 'yard') {
    // Staked out: four stakes and a string line, the way a site starts.
    for (const [x, z] of corners) {
      const p = post(1.2);
      p.position.set(x, ground + 0.6, z);
      g.add(p);
    }
    const string = new THREE.Mesh(
      new THREE.BoxGeometry(halfX * 2, 0.03, halfZ * 2),
      new THREE.MeshBasicMaterial({ color: 0xe8e2c8, wireframe: true }),
    );
    string.position.set(cx, ground + 1.1, cz);
    g.add(string);
  }

  if (stage === 'scaffold' || stage === 'fitting') {
    const h = top + 1.0;
    for (const [x, z] of corners) {
      const p = post(h);
      p.position.set(x, ground + h / 2, z);
      g.add(p);
    }
    for (const lvl of [0.38, 0.72]) {
      const y = ground + h * lvl;
      const a = rail(halfX * 2, 'x');
      a.position.set(cx, y, cz - halfZ);
      const b = rail(halfX * 2, 'x');
      b.position.set(cx, y, cz + halfZ);
      const c = rail(halfZ * 2, 'z');
      c.position.set(cx - halfX, y, cz);
      const d = rail(halfZ * 2, 'z');
      d.position.set(cx + halfX, y, cz);
      g.add(a, b, c, d);
    }
    // A plank walk on the front face, so the scaffolding reads as used.
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.08, halfZ * 1.7),
      new THREE.MeshStandardMaterial({ color: 0xa8834f, roughness: 0.95 }),
    );
    plank.position.set(cx + faceSign * halfX, ground + h * 0.38 + 0.09, cz);
    plank.castShadow = true;
    g.add(plank);
  }

  if (stage === 'fitting') {
    // Glass waiting to go in, leaning against the frame.
    for (let i = 0; i < 3; i += 1) {
      const pane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 1.8),
        new THREE.MeshStandardMaterial({
          color: MATERIAL_COLOR.glass,
          transparent: true,
          opacity: 0.55,
          roughness: 0.25,
          side: THREE.DoubleSide,
        }),
      );
      pane.position.set(cx + faceSign * (halfX - 0.35), ground + 0.9, cz - halfZ + 0.9 + i * 1.3);
      pane.rotation.y = faceSign * (Math.PI / 2 + 0.2);
      g.add(pane);
    }
  }

  // Put a thing on the terrace in front of the house, not in the air off the
  // edge of it. Terraces are narrow here, so walk the offset inward until the
  // ground under it is the same ground the house is standing on.
  const onTerrace = (offsets, z) => {
    for (const o of offsets) {
      const x = cx + faceSign * o;
      const y = groundAt(x, z, ground);
      if (Math.abs(y - ground) < 0.8) return { x, y };
    }
    return { x: cx + faceSign * offsets[offsets.length - 1], y: ground };
  };

  if (stage === 'dedicated') {
    // The tablet stands on the stair side of the house, facing the path, so
    // you read it on the way past rather than having to walk round the back.
    const spot = onTerrace([halfX + 1.4, halfX + 0.8, halfX + 0.3, halfX - 0.4], cz);
    const front = new THREE.Vector3(spot.x, spot.y, cz);
    const t = tablet(plot.inscription, `Plot ${String(plot.id).padStart(2, '0')} · day ${plot.dedicatedOn}`);
    t.position.copy(front);
    // lookAt rather than a hand-computed rotation.y: it aims local +z (the
    // written face) at a point out toward the stair, and gets the sign right
    // without anyone having to reason about Euler conventions.
    t.lookAt(front.x + faceSign * 5, front.y, front.z);
    g.add(t);

    const l = lamp(plot.wear);
    const lz = cz - halfZ * 0.6;
    const lspot = onTerrace([halfX + 1.0, halfX + 0.5, halfX - 0.3], lz);
    l.position.set(lspot.x, lspot.y, lz);
    g.add(l);

    // Wear shows as moss creeping onto the flags in front of the house.
    if (plot.wear > 0.15) {
      const moss = new THREE.Mesh(
        new THREE.CircleGeometry(1.1 + plot.wear, 12),
        new THREE.MeshStandardMaterial({
          color: 0x5c7a45,
          transparent: true,
          opacity: Math.min(0.6, plot.wear),
          roughness: 1,
        }),
      );
      moss.rotation.x = -Math.PI / 2;
      const mspot = onTerrace([halfX + 0.9, halfX + 0.3], cz);
      moss.position.set(mspot.x, mspot.y + 0.03, cz);
      g.add(moss);
    }
  }

  return g;
}
