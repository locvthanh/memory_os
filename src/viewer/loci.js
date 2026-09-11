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
        // Per-locus camera overrides. solar-system needs them: its subjects
        // range from Mercury (radius 0.05) to the Sun (radius 2.0), a 40:1
        // spread that no single scene-wide anchorDistance can frame.
        anchorDistance: cfg.anchorDistance ?? null,
        eyeHeight: cfg.eyeHeight ?? null,
        // Same problem for the numbered badges: one world size cannot sit
        // legibly beside both Mercury and Jupiter.
        labelScale: cfg.labelScale ?? null,
        labelOffsetY: cfg.labelOffsetY ?? null,
        // world-war-2 parks each badge on a brass pole beside its monument
        // (labelPosition, three.js space, replaces position + offsetY) and
        // tints it with the event's year colour (labelColor, any CSS colour).
        labelPosition: cfg.labelPosition ?? null,
        labelColor: cfg.labelColor ?? null,
        link: cfg.link || null,
        // Optional text for the cross-scene link; war-museum's portals read
        // 'Enter the portal: World War II ->' instead of 'Go to scene ->'.
        linkLabel: cfg.linkLabel || null,
      };
    });

  return loci;
}
