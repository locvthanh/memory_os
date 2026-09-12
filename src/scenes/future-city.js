// Future City — a solarpunk river capital at the end of a bright afternoon,
// seen from a planted terrace ninety metres above the water. Recreated from a
// reference illustration, camera first: the elevation was solved from the
// ellipse ratios of the sky ring and the ring road (24.6 mm on a 36 mm sensor,
// eye 90 m above the water, 4.2 deg of down-pitch, horizon on pixel row 435 of
// 1536x1024), and then every landmark in the picture — the spire tip, the halo
// ring, the glass dome, the near bridge deck, the monorail train, the figure at
// the rail, both holo signs, the sun and the moon — was back-projected from its
// pixel position into world coordinates. `startView` is the illustration's own
// frame.
//
// The city is authored at true scale (1 unit = 1 m) across roughly 30 km, so
// scripts/future_city_export.py compresses it radially about the hero eye:
// everything inside 700 m is untouched, and 30 km folds into a 1.9 km disc with
// angular size preserved. That is why the numbers below look inconsistent —
// the terrace pegs are metres apart and the skyline pegs are a kilometre out.
// For the same reason every locus names its own `anchorFrom` (the ground point
// under the opening viewpoint) with a NEGATIVE `anchorDistance`, so the camera
// always stands on the viewer's side of the peg and looks the way the
// illustration looks, instead of flying past it and turning back.
//
// Real positions come from the Locus_01..12 empties baked into
// models/future-city.glb by blender_models/futurecity_scenegen/build_city.py;
// `position` here is only the three.js-space fallback (Blender x,y,z -> x,z,-y),
// already carrying the same compression.
//
// Sibling rooms: [[the-stack]] is the other city built as one continuous place,
// but it is a night city of abstractions; this one is a daylight city of
// things. [[lunar-base]], [[sky-loft]] and [[glacier-deck]] are the other
// scenes solved from a picture before anything was modelled.
//
// Every peg below is still blank: the titles name the object, the descriptions
// say what shape of fact each is built to hold. Replace the second sentence of
// each with real content when there is some.
export default {
  startView: {
    position: [0, 90, 0],
    lookAt: [0, 82.68, -99.73],
  },
  background: 0x9cc3e6,
  fog: { near: 750, far: 2050 },
  lighting: {
    hemisphere: 0.7,
    ambient: 0.45,
    ambientColor: 0xdcebf7,
    sun: 1.9,
    shadowExtent: 420,
  },
  walkthrough: {
    travelSeconds: 7,
    dwellSeconds: 8,
    eyeHeight: 2,
    anchorDistance: -40,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Terrace',
      description: 'The planted deck you start on: a glass rail, a narrow bed of shrubs along the parapet, and one person standing at the edge looking out. The arrival peg — whatever the whole set is called goes here.',
      position: [-9, 89, -12],
      anchorFrom: [0, 0, 0],
      anchorDistance: -9,
      eyeHeight: 1,
    },
    {
      id: 2,
      title: 'The Pledge Wall',
      description: 'The dark fascia under the neighbouring tower’s overhang, three lines deep: Clean Energy / Better Health / A Brighter Future. The slogan peg — the one sentence the whole room is supposed to stand for.',
      position: [-52, 93, -94],
      anchorFrom: [0, 0, 0],
      anchorDistance: -45,
      eyeHeight: -3,
    },
    {
      id: 3,
      title: 'The Feed',
      description: 'The lit civic screen on the block across the way, a rising chart under four stacked words: A Greener, Cleaner, Smarter Tomorrow. Built for anything that is a claim plus the number behind it.',
      position: [64, 58, -95],
      anchorFrom: [0, 0, 0],
      anchorDistance: -50,
      eyeHeight: 26,
    },
    {
      id: 4,
      title: 'The River',
      description: 'The water itself, seventy metres wide between stone quays, two small craft working upstream with their wakes fanning out behind them. The peg for whatever flows, carries or connects. The only stop that turns round: the near bridge stands between the terrace and the boats, so the camera goes past it and looks back the way you came.',
      position: [20, 4, -214],
      anchorFrom: [0, 0, -400],
      anchorDistance: -60,
      eyeHeight: 50,
    },
    {
      id: 5,
      title: 'The Crossing',
      description: 'The broad near bridge on its three round piers, parapets running the full span. Good for anything that joins two things that were separate.',
      position: [10, 24, -196],
      anchorFrom: [0, 0, 0],
      anchorDistance: -55,
      eyeHeight: 44,
    },
    {
      id: 6,
      title: 'The Line',
      description: 'A three-car train stopped on the elevated guideway along the right bank, window band lit. Built for a repeating series — one car, one stop, one item.',
      position: [72, 36, -224],
      anchorFrom: [-40, 0, -120],
      anchorDistance: -70,
      eyeHeight: 30,
    },
    {
      id: 7,
      title: 'The Dome',
      description: 'A ninety-metre glass dome on a stone drum in the middle distance, ribbed in twelve. The peg for anything that is one big enclosing idea with the detail inside it.',
      position: [86, 62, -523],
      anchorFrom: [0, 0, 0],
      anchorDistance: -150,
      eyeHeight: 48,
    },
    {
      id: 8,
      title: 'The Ring Road',
      description: 'Two concentric elevated decks circling the podium on splayed columns, the inner one higher than the outer. This peg sits on the west arc, where the ring crosses the river. Built for a cycle — something that comes back round to where it started.',
      position: [-124.53, 23.95, -794.99],
      anchorFrom: [0, 0, 0],
      anchorDistance: -210,
      eyeHeight: 72,
    },
    {
      id: 9,
      title: 'The Spire',
      description: 'The tallest shard of the central cluster, five hundred metres to the mast, a blue light slot running most of its height. The landmark peg — the single fact everything else is arranged around.',
      position: [98.31, 384.32, -1027.82],
      anchorFrom: [0, 0, 0],
      anchorDistance: -420,
      eyeHeight: -64,
    },
    {
      id: 10,
      title: 'The Halo',
      description: 'The ring threaded around the tower cluster at a hundred and eighty metres, a wide deck and two thinner rails above it \u2014 this peg sits on its near arc, not at the towers. For anything that surrounds or contains the thing at Nine.',
      position: [103.09, 168.7, -864.12],
      anchorFrom: [0, 0, 0],
      anchorDistance: -330,
      eyeHeight: 34,
    },
    {
      id: 11,
      title: 'The Sky Garden',
      description: 'A saucer platform hanging three hundred metres up over the left bank, trees planted round its rim and a mast on top. The peg for something deliberately lifted out of its usual place.',
      position: [-256.99, 291.57, -841.06],
      anchorFrom: [0, 0, 0],
      anchorDistance: -330,
      eyeHeight: -7,
    },
    {
      id: 12,
      title: 'The Airship Lane',
      description: 'A hundred-and-forty-metre passenger airship crossing high over the west quarter, window stripe lit, a fin at its tail. The departure peg — whatever is on its way somewhere else.',
      position: [-359.24, 275.74, -679.65],
      anchorFrom: [0, 0, 0],
      anchorDistance: -300,
      eyeHeight: -8,
    },
  ],
};
