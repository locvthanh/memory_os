import * as THREE from 'three';

// Defaults sized for a room-scale scene (one unit ~ one metre). A scene whose
// units mean something else -- civil-war-map is a country plate at 1 unit =
// 100 km -- overrides them with `labels: { worldSize, offsetY }` in its config,
// otherwise a 1.1-unit badge covers 110 km of Virginia.
const LABEL_OFFSET_Y = 1.6;
const LABEL_WORLD_SIZE = 1.1;

function makeNumberSprite(number, worldSize) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(28, 39, 51, 0.85)';
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
  ctx.fillText(String(number), size / 2, size / 2 + 4);

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
    const sprite = makeNumberSprite(i + 1, worldSize);
    sprite.position.copy(locus.position).add(new THREE.Vector3(0, offsetY, 0));
    group.add(sprite);
  });
  return group;
}
