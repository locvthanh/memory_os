import * as THREE from 'three';

const LABEL_OFFSET_Y = 1.6;
const LABEL_WORLD_SIZE = 1.1;

function makeNumberSprite(number) {
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
  sprite.scale.set(LABEL_WORLD_SIZE, LABEL_WORLD_SIZE, 1);
  return sprite;
}

// Floating numbered billboards marking tour order at each locus. `loci` is
// already in tour order (see buildLoci), so the displayed number is 1-based
// index, not the locus's own `id`.
export function buildLocusLabels(loci) {
  const group = new THREE.Group();
  group.name = 'locus-labels';
  loci.forEach((locus, i) => {
    const sprite = makeNumberSprite(i + 1);
    sprite.position.copy(locus.position).add(new THREE.Vector3(0, LABEL_OFFSET_Y, 0));
    group.add(sprite);
  });
  return group;
}
