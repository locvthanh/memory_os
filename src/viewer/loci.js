import * as THREE from 'three';

const LOCUS_RE = /^Locus[_-]?(\d+)/i;

// Build the ordered locus list for a scene.
// Position priority: Blender Empty (named Locus_NN) in the glb, else the
// fallback `position` from the scene config. Title/description always come
// from the config, keyed by numeric id, as does the optional per-locus camera
// hint `anchorFrom` (see Walkthrough).
export function buildLoci(gltfScene, config) {
  const configById = new Map((config.loci || []).map((l) => [l.id, l]));
  const fromGlb = new Map();

  gltfScene.updateWorldMatrix(true, true);
  gltfScene.traverse((node) => {
    const m = node.name && node.name.match(LOCUS_RE);
    if (!m) return;
    const id = parseInt(m[1], 10);
    const pos = new THREE.Vector3();
    node.getWorldPosition(pos);
    fromGlb.set(id, pos);
  });

  const ids = new Set([...configById.keys(), ...fromGlb.keys()]);
  const loci = [...ids]
    .sort((a, b) => a - b)
    .map((id) => {
      const cfg = configById.get(id) || {};
      const glbPos = fromGlb.get(id);
      const p = glbPos || new THREE.Vector3(...(cfg.position || [0, 0, 0]));
      return {
        id,
        title: cfg.title || `Locus ${id}`,
        description: cfg.description || '',
        position: p,
        anchorFrom: cfg.anchorFrom || null,
      };
    });

  return loci;
}
