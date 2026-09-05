// Registry of available 3D scenes. Add an entry per exported .glb.
export const SCENES = [
  {
    id: 'chinatown-street',
    title: 'Chinatown Street',
    blurb: 'A lantern-lit lane past a paifang gate and red shopfronts. Six loci down the street.',
    model: 'models/chinatown-street.glb',
    config: () => import('./chinatown-street.js').then((m) => m.default),
  },
  {
    id: 'portal-island',
    title: 'Luân Hồi Đài',
    blurb: 'A floating island ringed by eight portal gates, with a causeway out to the Rosetta language square. Thirteen loci.',
    model: 'models/portal-island.glb',
    config: () => import('./portal-island.js').then((m) => m.default),
  }
];

export function getScene(id) {
  return SCENES.find((s) => s.id === id) || null;
}
