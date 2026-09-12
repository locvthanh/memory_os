// Lunar Base — the observation lounge of a Moon settlement, and the settlement
// itself seen through its window. Recreated from a reference illustration: the
// camera projection was solved first (35 mm on a 36 mm sensor, eye 12 m above
// the plain, 1.9 deg of down-pitch, horizon on pixel row 462 of 1536x1024), then
// every landmark in the picture — the dome's base ring, the rover, the landing
// pad, the comms mast, Earth's disc — was back-projected from pixels into world
// coordinates. `startView` below is the illustration's own framing.
//
// The room sits on a crater-rim mesa 10.5 m above the regolith, which is why the
// ground only reappears ~60 m out: the sill cuts off everything nearer. Three
// pegs are indoors at human scale and seven are outdoors at base scale, so the
// rig cannot use one shared stand-off — each locus names its own `anchorFrom`
// (the spot the camera stands on) with a negative `anchorDistance` equal to the
// distance from that spot to the peg.
//
// Real positions come from the Locus_01..10 empties baked into
// models/lunar-base.glb by blender_models/scenegen_lunar/build_lunar.py;
// `position` here is only the three.js-space fallback (Blender x,y,z -> x,z,-y).
//
// Depth note: the regolith is authored out to 1.7 km and Earth sits 4 km away at
// radius 308 so its angular size matches the reference. scripts/lunar_base_export.py
// compresses the far terrain radially beyond 300 m and pulls Earth in to 900,
// which leaves the opening view untouched and keeps everything inside the
// viewer's 2000-unit far plane.
//
// Sibling rooms: [[sky-loft]] and [[seaside-bungalow]] are the other
// interior-looking-out scenes; this one is the vacuum version of that instinct.
//
// Every peg below is still blank: the titles name the object, the descriptions
// say what shape of fact that object is built to hold. Replace the second
// sentence of each with real content when there is some.
export default {
  startView: {
    position: [0, 12, 0],
    lookAt: [0, 11.66, -10],
  },
  background: 0x070f1c,
  lighting: {
    hemisphere: 0.3,
    ambient: 0.42,
    ambientColor: 0xc6d2e6,
    sun: 2.6,
    shadowExtent: 120,
  },
  walkthrough: {
    travelSeconds: 6,
    dwellSeconds: 8,
    eyeHeight: 1.6,
    anchorDistance: -8,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Low Table',
      description: 'Two books, a cold mug, a tablet and a potted fern on warm oak, right against the glass. The arrival peg: whatever the whole set is called goes here.',
      position: [-1.1, 11.05, -4.7],
      anchorFrom: [1.6, 0, -1.0],
      anchorDistance: -4.58,
      eyeHeight: 1.05,
    },
    {
      id: 2,
      title: 'The Shelf',
      description: 'A timber bookcase in the alcove with five shelves of blue-spined volumes and a small plant on top. Built for an ordered list — one item per shelf, left to right.',
      position: [-3.55, 11.7, -7.7],
      anchorFrom: [-1.2, 0, -5.6],
      anchorDistance: -3.15,
      eyeHeight: 0.45,
    },
    {
      id: 3,
      title: 'A Brighter Future Together',
      description: 'The narrow navy mission panel beside the shelf, a ringed planet above three lines of type. The slogan peg: the one sentence the whole room is supposed to stand for.',
      position: [-3.24, 12.25, -8.1],
      anchorFrom: [-1.6, 0, -5.8],
      anchorDistance: -2.82,
      eyeHeight: -0.1,
    },
    {
      id: 4,
      title: 'The Habitat Dome',
      description: 'The main module: a faceted white drum 21 m across under a shallow blue glass dome, two lit airlock doors facing the lounge. The centre of the settlement and the biggest single peg here.',
      position: [3.6, 12.6, -95.3],
      anchorFrom: [3.6, 0, -70.0],
      anchorDistance: -25.3,
      eyeHeight: -4.0,
    },
    {
      id: 5,
      title: 'The Connector Tube',
      description: 'A pressurised walkway on stub legs running out to the west outpost, banded with window glass, an airlock drum at its far end. Good for anything that is a link between two other things.',
      position: [-10.3, 4.2, -112.7],
      anchorFrom: [-4.0, 0, -100.0],
      anchorDistance: -14.18,
      eyeHeight: 1.6,
    },
    {
      id: 6,
      title: 'The Solar Field',
      description: 'Fourteen tilted panels in two rows on the near apron, the closest built thing to the window. Built for a repeating series — one cell per item.',
      position: [14.0, 3.2, -64.0],
      anchorFrom: [8.0, 0, -48.0],
      anchorDistance: -17.09,
      eyeHeight: 3.2,
    },
    {
      id: 7,
      title: 'The Rover',
      description: 'A six-wheeled pressurised truck parked short of the main door, cab forward, flatbed empty. The peg for whatever moves, carries or changes hands.',
      position: [-2.0, 3.4, -90.5],
      anchorFrom: [-2.0, 0, -80.0],
      anchorDistance: -10.5,
      eyeHeight: 1.2,
    },
    {
      id: 8,
      title: 'The Comms Mast',
      description: 'A lattice tower behind the dome, 22 m to the red beacon, with a dish angled back at Earth. The peg for anything about signals, messages or the link home.',
      position: [3.2, 19.5, -117.0],
      anchorFrom: [3.2, 0, -95.0],
      anchorDistance: -22.0,
      eyeHeight: -6.0,
    },
    {
      id: 9,
      title: 'The Landing Pad',
      description: 'A yellow-marked circle east of the base with a four-legged lander standing on it, perimeter lamps all round. The peg for arrivals, departures and deadlines.',
      position: [25.1, 4.5, -78.6],
      anchorFrom: [12.0, 0, -62.0],
      anchorDistance: -21.1,
      eyeHeight: 4.0,
    },
    {
      id: 10,
      title: 'The Outer Modules',
      description: 'The last two drums out on the plain where the apron gives way to regolith, with Earth hanging over them. The horizon peg: whatever comes after everything else on the list.',
      position: [46.0, 10.0, -150.0],
      anchorFrom: [30.0, 0, -120.0],
      anchorDistance: -34.0,
      eyeHeight: 2.0,
    },
  ],
};
