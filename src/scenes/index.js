// Registry of available scenes.
//
// Most scenes are 3D: a .glb exported from Blender, opened by scene.html and
// flown past by the camera rig in src/viewer/. A scene can also be **2D** — its
// own standalone page built from HTML, CSS and SVG with no Three.js at all. Set
// `kind: '2d'` and give it an `href`; everything that links to a scene goes
// through `sceneHref()` below, so a 2D scene appears on the hub and can be
// reached from a 3D locus exactly like any other.
//
// Entry shape:
//   id      slug, unique; what `?id=` and cross-scene `link:` values use
//   title   card heading
//   blurb   card copy
//   kind    '3d' (default) or '2d'
//   model   3D only — path to the .glb
//   href    2D only — path to the scene's own page
//   config  () => Promise of the scene's config module default export
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
    // Replaces the 3D `civil-war-map` relief plate. Same eighteen loci, same
    // Albers projection, no WebGL: the map is SVG and the camera is a transform.
    id: 'civil-war',
    title: 'The Civil War',
    blurb: 'A drawn map of the United States with the war of 1861–65 animated over it: states coloured by allegiance and draining as they fall, the front line morphing year by year, the blockade closing on both coasts, and the great campaigns drawing themselves as you reach them. Eighteen pins in chronological order from Fort Sumter to Appomattox — the tour follows the calendar, not the geography.',
    kind: '2d',
    href: 'civil-war.html',
    config: () => import('./civil-war.js').then((m) => m.default),
  },
  {
    id: 'solar-system',
    title: 'The Solar System',
    blurb: 'The Sun, the eight planets, both belts and three dwarf planets, built at readable scale: planet sizes are true relative to each other, but distances are square-root compressed so the whole system fits in one view. Axial tilts, orbital inclinations, the Cassini Division and the Kirkwood gaps are all real. The tour runs outward from the Sun to the Kuiper Belt. Twelve loci.',
    model: 'models/solar-system.glb',
    config: () => import('./solar-system.js').then((m) => m.default),
  },
  {
    id: 'india-history',
    title: 'River of Time: India',
    blurb: 'A low-poly valley where a road winds beside a river past 4,500 years of Indian history — from the Great Bath of Mohenjo-daro to the Constitution of 1950. Each stop is a monument you can picture (Ashoka’s lion pillar, the Chola temple, Babur’s cannon, the Taj Mahal, Gandhi’s glasses) beside a numbered sign, and six coloured era gates mark where the story turns. Twenty-five loci, in chronological order.',
    model: 'models/india-history.glb',
    config: () => import('./india-history.js').then((m) => m.default),
  },
  {
    id: 'world-war-2',
    title: 'World War II: Theatre of War',
    blurb: 'A low-poly war-room map table of the whole world at war, 1937–1945. Thirty-two turning points stand where they happened — from the Marco Polo Bridge to the surrender on the USS Missouri — each with a monument you can picture (a lightning bolt for Blitzkrieg, a loaf of bread for besieged Leningrad, a literal torch for Operation Torch) and glowing arcs joining them in date order, so the tour jumps between Europe and the Pacific the way the war did. Colour tells the year.',
    model: 'models/world-war-2.glb',
    config: () => import('./world-war-2.js').then((m) => m.default),
  },
  {
    id: 'war-museum',
    title: 'War Museum: Hall of Sand Tables',
    blurb: 'A grand stone gallery of seven military sand tables, walked in date order down a red carpet with a brass timeline: Cannae (216 BC), Bạch Đằng (1288), Gettysburg (1863), the Somme (1916), D-Day (1944), Điện Biên Phủ (1954) and the Fall of Sài Gòn (1975). Every table is a miniature battlefield with its armies, arrows and flags; behind each, a glowing arch is a portal to that war’s own scene, and a glass case opposite holds one artifact. An eternal flame closes the hall. Nine loci.',
    model: 'models/war-museum.glb',
    config: () => import('./war-museum.js').then((m) => m.default),
  }
];

export function getScene(id) {
  return SCENES.find((s) => s.id === id) || null;
}

// The one place that knows how to open a scene. Both the hub cards and the
// cross-scene "Go to scene →" links in a locus panel go through here, so
// pointing a link at a 2D scene needs nothing more than its id.
//
// Paths are relative and every page that calls this sits at the repo root,
// which is what GitHub Pages needs — the site is served under /memory_os/, so a
// site-absolute path would 404 there.
export function sceneHref(idOrScene) {
  const scene = typeof idOrScene === 'string' ? getScene(idOrScene) : idOrScene;
  if (!scene) return null;
  if (scene.kind === '2d') return scene.href;
  return `scene.html?id=${encodeURIComponent(scene.id)}`;
}
