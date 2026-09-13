import * as THREE from 'three';

// Defaults sized for a room-scale scene (one unit ~ one metre). A scene whose
// units mean something else -- civil-war-map is a country plate at 1 unit =
// 100 km -- overrides them with `labels: { worldSize, offsetY }` in its config,
// otherwise a 1.1-unit badge covers 110 km of Virginia.
const LABEL_OFFSET_Y = 1.6;
const LABEL_WORLD_SIZE = 1.1;

function makeNumberSprite(text, worldSize, color) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color || 'rgba(28, 39, 51, 0.85)';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = String(text);
  // Two characters still fit the 128px disc at 64px; anything longer is
  // stepped down so a door number like "13" and a stop number like "7" read
  // at the same weight.
  ctx.font = `bold ${label.length > 2 ? 46 : 64}px -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  ctx.fillText(label, size / 2, size / 2 + 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(worldSize, worldSize, 1);
  return sprite;
}

// Floating numbered billboards marking tour order at each locus. `loci` is
// already in tour order (see buildLoci), so the displayed number is 1-based
// index, not the locus's own `id`.
export function buildLocusLabels(loci, options = {}) {
  const worldSize = options.worldSize ?? LABEL_WORLD_SIZE;
  const offsetY = options.offsetY ?? LABEL_OFFSET_Y;
  const group = new THREE.Group();
  group.name = 'locus-labels';
  loci.forEach((locus, i) => {
    if (locus.hideLabel) return;
    // A locus may size and lift its own badge (see loci.js): solar-system's
    // subjects differ in radius by 40x, so one size fits none.
    const s = locus.labelScale ?? worldSize;
    const o = locus.labelOffsetY ?? offsetY;
    // A locus may print something other than its tour position. the-office
    // does: each door already has its own number painted on the wall beside the
    // handle, and a badge floating next to it reading the tour index instead
    // would contradict it.
    const sprite = makeNumberSprite(locus.labelText ?? i + 1, s, locus.labelColor);
    // Which locus this badge belongs to. NOT the child index: a scene that
    // hides some badges (pin-factory hides ten) leaves holes, so
    // children.indexOf() would resolve a tap to the wrong locus.
    sprite.userData.locusIndex = i;
    if (locus.labelPosition) sprite.position.set(...locus.labelPosition);
    else sprite.position.copy(locus.position).add(new THREE.Vector3(0, o, 0));
    group.add(sprite);
  });
  return group;
}
