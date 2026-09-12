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
  },
  {
    id: 'pin-factory',
    title: 'The Pin Factory',
    blurb: 'Adam Smith’s division of labour, walked down one low-poly Georgian street in Kirkcaldy. First the lone pin-maker in his cottage, doing all eighteen steps himself for one pin a day; then the manufactory next door, where ten workers at one long bench each do a single step, in Smith’s own words (one draws the wire, another straightens it, a third cuts it…), and together make 48,000 pins a day. Then Smith’s three reasons, the ship that carries the pins to market, and an open door on two questions still argued about. Sixteen loci.',
    model: 'models/pin-factory.glb',
    config: () => import('./pin-factory.js').then((m) => m.default),
  },
  {
    id: 'nobel-hall',
    title: 'The Nobel Medal Hall',
    blurb: 'Every Nobel Prize from 2021 to 2025 — all six prizes, 64 laureates — on a low-poly plaza shaped like a gold medal lying on the water. Six coloured paths run out from a giant medal in the order of Nobel’s will (Physics, Chemistry, Medicine, Literature, Peace, Economics), and the years grow outward like tree rings. Each prize-year stands on its own plinth as one object you can picture: a globe with a fever for climate models, a whale on a circus wagon for Krasznahorkai, a burger split by a state line for natural experiments. Empty plinths at the rim wait for 2026. Thirty-two loci.',
    model: 'models/nobel-hall.glb',
    config: () => import('./nobel-hall.js').then((m) => m.default),
  },
  {
    id: 'macro-hydraulic-hall',
    title: 'The Hydraulic Hall',
    blurb: 'Scene 0 of the macroeconomics series, and its hub: a steampunk engine hall around a giant MONIAC, Bill Phillips’s 1949 computer that modelled an economy with coloured water. The circular flow is laid out on one brass-and-glass board: households and firms as two tall tanks, spending pumped along the bottom, income returning across the top, and the three side circuits between them (saving and investment through the banks, taxes and government spending, imports and exports). The series’ recurring cast (the Baker, the Banker, the Governor, the Treasurer and the Trader) stands at the foot of the machine, with the price-tagged loaf. Then the GDP gauge, the nine doors to the rest of the series, and an open question. Eleven loci.',
    model: 'models/macro-hydraulic-hall.glb',
    config: () => import('./macro-hydraulic-hall.js').then((m) => m.default),
  },
  {
    id: 'sky-loft',
    title: 'The Sky Loft',
    blurb: 'Another empty palace, this one in the future: a pale sci-fi apartment high in a tower at midday. A glazed wall floor to ceiling, a ribbed ceiling with lit coves, cyan inlays running across the floor to the sill, a lounge chair hovering over its plinth, a holo panel and a console. Outside: a balcony ledge, a flying car banking past thirty metres out, and a skyline of twisted, tapered and portal towers — a tilted ring, an hourglass, a sphere on a shaft, skyways on piers. Eight stops inside, eight through the glass, near to far. Every peg is still blank. Sixteen loci.',
    model: 'models/sky-loft.glb',
    config: () => import('./sky-loft.js').then((m) => m.default),
  },
  {
    id: 'cfa-level-1',
    title: 'The CFA Financial District',
    blurb: 'The whole CFA Level I curriculum as one low-poly island city, walked in 27 stops. The rule the island encodes: EVERY BUILDING\'S HEIGHT IS ITS EXAM WEIGHT — a 28 m marble Ethics courthouse (15–20%), three equal 20 m slabs for Financial Statement Analysis, Equity and Fixed Income, and a 10.4 m Derivatives pit (5–8%), so the skyline you see from the gate is the weighting. Ten buildings ring a plaza in curriculum order, each in its own architecture — a colonnaded courthouse, a bell-curve observatory, a central bank over a market square, a glass ledger block lit on three floors, a boardroom crown, a stepped exchange with a ticker, a bond vault with its door open, a steel pit standing over water, a warehouse yard, a harbour lighthouse. On the forecourts, 25 plinths carry the pegs: the Code open under six gold pips, the seven Standards as seven columns, duration as a plank balancing its coupons on a fulcrum, put–call parity as a scale, the efficient frontier with the capital allocation line lifting off it. Twenty-seven loci.',
    model: 'models/cfa-level-1.glb',
    config: () => import('./cfa-level-1.js').then((m) => m.default),
  },
  {
    id: 'seaside-bungalow',
    title: 'The Seaside Bungalow',
    blurb: 'An empty palace, ready for anything you want to remember: a sunlit beach-house living room at midday. White walls under dark teak beams, a linen sofa, a rattan pendant, a cane armchair, and a whole wall of glass sliding doors opening onto a teak deck, the sand, two leaning coconut palms, turquoise water and a hazy island on the horizon. And one thing that doesn’t belong: a wizard’s hat floating over the coffee table. Eleven stops inside, five outside, from the sofa round the room, through the glass and down to the waterline. Every peg is still blank. Sixteen loci.',
    model: 'models/seaside-bungalow.glb',
    config: () => import('./seaside-bungalow.js').then((m) => m.default),
  },
  {
    id: 'the-stack',
    title: 'The Stack',
    blurb: 'The whole of software engineering as one city — a round stepped pit at night, six concentric terraces going up and out, and one rule holding it together: ALTITUDE = ABSTRACTION. The pit floor is the machine; every terrace out is one layer further from it, so from any ledge you can look down through the entire stack. THE BEDROCK (indigo): Grace Hopper\'s moth taped into the 1947 logbook, a transistor as a lever gate under its NAND table, the CPU as a four-station assembly line, memory as numbered pigeonholes, the call stack as a spiral of plates beside the heap\'s junkyard. THE MINES (teal): mailbox arrays, barges each carrying the next one\'s address, a hash-map cloakroom, a B-tree filing cabinet, graphs as a metro map, merge sort as a railway hump yard, Big-O as five ramps from flat to vertical, recursion as a hall of mirrors, a mutex as a toll gate on a one-track bridge. THE ARTISANS\' QUARTER (amber, the only warm-lit level): the sign painter who names things, one-job machines with a drain pipe for side effects, coupling alley, SOLID as five columns with one of them short, the pattern book shop, a tenement under scaffolding since 1992, the test pyramid and its upside-down twin, the guild hall with Brooks\' law on the wall, a renovation beside the cleared lot where someone chose the rewrite. THE GRID (cyan): a load-balancer traffic circle, warehouses and their lagging mirrors, a split ledger with one hot shard, the cache vendor cart, a canal of queues, CAP as three bridges in a storm, consensus as three lighthouses, idempotency at the post office, a token-bucket booth, and the monolith facing the bazaar. THE RIM (green): the branch orchard, the CI funicular with a red gate, three model houses that have drifted apart, blue/green bridges with a literal canary, the control tower\'s metrics, logs and traces, the fire station with no accusation chair, a chaos monkey with a wrench, the gatehouse where every crate is inspected, and the tally office under Goodhart\'s law. THE SUMMIT (violet): the bug\'s price at each level, ten times the last; Brooks\' empty silver-bullet case; and the Antilibrary Gate, whose five arches are the five open questions the tour could not answer. The northern half of every ring is deliberately empty — the Unbuilt Quarter, pegged out and waiting. Fifty-one loci.',
    model: 'models/the-stack.glb',
    config: () => import('./the-stack.js').then((m) => m.default),
  },
  {
    id: 'misty-valley',
    title: 'The Misty Valley',
    blurb: 'An empty palace the size of a landscape: a Tolkien-flavoured river valley under a ridged, snow-capped range. Eight landmarks, walked south to north up the valley — the ford at the mouth, a ring of eight standing stones (one fallen) on the east knoll, a broken watchtower on its bluff with the stair still climbing the inside wall, a three-arch stone bridge, dark pine wood on the western slope, the boulder-strewn east moor, the gorge at the head of the valley, and the snow peak beyond it, seen from half a kilometre out. Nothing here is a place from the books or the films — every landmark is invented, and picked to be big, silhouetted and impossible to confuse with its neighbour. Every peg is still blank. Eight loci.',
    model: 'models/misty-valley.glb',
    config: () => import('./misty-valley.js').then((m) => m.default),
  },
  {
    id: 'grab-workplace',
    title: 'The Green Court',
    blurb: 'Tony\u2019s Grab workplace as one building, walked in 25 stops. A hexagonal court in Grab green with a wing off each of its six edges, and the rule it encodes: THE CENTRE IS WHAT MATTERS NOW, THE WINGS ARE WHERE THE WORK LIVES. Six wings, because there are six things \u2014 one org he belongs to (Tech Infra, due north), one site he leads (VN R&D), and four teams he manages (Finapps, UCM, Temporal, Web Platforms), each behind its own coloured portal with its charter under the name, a team room of desks and whiteboards, one plinth, and its own named meeting room at the far end. On the plinths are the six pegs: a model of this whole building for Tech Infra, because infra carries the room you are standing in; a hiring board of filled green tiles and hollow amber outlines; a brass balance with coins on one pan and a receipt tape on the other; a switchboard fanning one jack out to six little screens; an escapement whose pawl is dropped into one tooth, so it still knows its place a week later; and a shopfront facade standing on scaffolding with nothing behind it. The six corners of the court, which fall between the wings, hold everything that moves: reception and the plan of the building, the Now / Next / Waiting wall, a mezzanine balcony that sees down every wing at once, a two-chair glass booth marked 1:1, a standup circle with no chair backs \u2014 and a free-standing door, ajar onto warm light and nothing else, for what he does not yet know about his own org. At the centre, a glass obelisk with five lit slots, all of them deliberately blank. Twenty-five loci.',
    model: 'models/grab-workplace.glb',
    config: () => import('./grab-workplace.js').then((m) => m.default),
  },
  {
    id: 'hutong-corner',
    title: 'Hutong Corner',
    blurb: 'A grey-brick Beijing alley that turns a corner, walked in 14 stops. North up the lane first \u2014 the carved name stone at its mouth, five red lanterns on a sagging cord, the corner shop under its striped awning, the courtyard gate with drum stones and vermilion doors half open, the spirit screen standing behind them so nothing enters in a straight line, washing strung wall to wall, a stone chess table mid-game, the notice board, two bikes and a loaded three-wheeler, the shared standpipe with winter cabbage and coal stacked beside it \u2014 then the turn east at the old scholar tree, past a birdcage on a low limb and a power pole trailing wires, to the round moon gate at the far end with a willow showing through it. Chosen as a memory room because every peg is a different kind of object at a different height: stone at eye level, lanterns overhead, a fridge on the ground, a cage in a tree. Every peg is still blank. Fourteen loci.',
    model: 'models/hutong-corner.glb',
    config: () => import('./hutong-corner.js').then((m) => m.default),
  },
  {
    id: 'meditation-ledge',
    title: 'The Ledge',
    blurb: 'A timber deck cantilevered off a granite cliff at dawn, with a sea of cloud ninety-five metres below it and a snow range on the far side. Built to sit in as much as to remember from, so the ten stops are also the ten stations of a sit \u2014 the approach first (a cedar gate, a stone basin fed by a bamboo spout, a lantern still lit at sunrise, a cairn of five stones), then the cushion at the centre of the deck, then attention moving outward (the wind bell on the east rail, the far rail with nothing past it, a pine bent flat over the drop by the wind and still alive), and finally away (the cloud filling the valley, and the snow summit with the sun cresting the saddle beside it). The camera never leaves the deck. Every peg is still blank. Ten loci.',
    model: 'models/meditation-ledge.glb',
    config: () => import('./meditation-ledge.js').then((m) => m.default),
  },
  {
    id: 'glacier-deck',
    title: 'The Glacier Deck',
    blurb:
      'A timber sitting platform on a cobbled promontory at sunset, a gnarled pine leaning over it, and a crevassed glacier two hundred metres below running out to a snow range still holding the last light. Recreated from a photograph: the camera projection was solved first, so the opening frame is the photograph\u2019s frame. The only room here with no loci and no tour \u2014 no pegs, no numbers, no rails. It is a place to be in: open it and look around.',
    model: 'models/glacier-deck.glb',
    config: () => import('./glacier-deck.js').then((m) => m.default),
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
