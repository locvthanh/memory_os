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
    blurb: 'A floating island ringed by eight portal gates, with a causeway out to the Rosetta language square and a small library rotunda that leads onward to the Chronicler’s Athenaeum. Fourteen loci.',
    model: 'models/portal-island.glb',
    config: () => import('./portal-island.js').then((m) => m.default),
  },
  {
    id: 'chroniclers-athenaeum',
    title: "The Chroniclers' Athenaeum",
    blurb: 'A great library: a nave of book stacks under a domed reading room, with an alchemist’s lab, a manuscript vault, a glass herbarium and a star observatory off its wings. The Statue of Liberty standing mid-nave is a door through to the White House. Thirteen loci.',
    model: 'models/chroniclers-athenaeum.glb',
    config: () => import('./chroniclers-athenaeum.js').then((m) => m.default),
  },
  {
    id: 'the-white-house',
    title: 'The White House',
    blurb: 'The real building, room by room — Executive Residence, West Wing, East Wing and grounds — holding all 47 American presidencies. The tour climbs the house as it climbs the timeline: the founders on the Ground Floor, Lincoln at the foot of the Grand Staircase, and the modern presidency out in the West Wing. Entered from the Athenaeum through the Statue of Liberty, and its own Library leads back. Forty-seven loci.',
    model: 'models/the-white-house.glb',
    config: () => import('./the-white-house.js').then((m) => m.default),
  },
  {
    id: 'wisdom-village',
    title: 'Village of the Sages',
    blurb: 'A terraced hill village for the thinkers: a timber gate, the Founder’s statue on the plaza, a switchback stone stair climbing five terraces, and the Rotunda of Assembly at the summit. Twelve numbered plots flank the stair — each a different silhouette, all still empty, waiting for a thinker to move in. Tour order is altitude. Twelve loci.',
    model: 'models/wisdom-village.glb',
    config: () => import('./wisdom-village.js').then((m) => m.default),
  },
  {
    id: 'civil-war-map',
    title: 'The Civil War',
    blurb: 'A relief map of the United States built from real ETOPO elevation on an Albers equal-area projection, with the war of 1861\u201365 laid over it: states coloured by allegiance, the front line redrawn for each year, movement arrows for the blockade and the great campaigns, and eighteen numbered pins in chronological order from Fort Sumter to Appomattox. The tour follows the calendar, not the geography. Eighteen loci.',
    model: 'models/civil-war-map.glb',
    config: () => import('./civil-war-map.js').then((m) => m.default),
  }
];

export function getScene(id) {
  return SCENES.find((s) => s.id === id) || null;
}
