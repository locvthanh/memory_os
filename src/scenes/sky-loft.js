// The Sky Loft — a clean sci-fi apartment high in a tower, at midday.
//
// A pale, minimal room: glazed wall from floor to ceiling, ribbed ceiling with
// lit coves, glowing inlays running across the floor to the sill, a lounge
// chair hovering over a lit plinth, a holo panel and a console. Beyond the
// glass, a balcony ledge with a glass railing and then the city: tapered,
// twisted and portal towers, a tilted ring tower, an hourglass, an orb on a
// shaft, elevated skyways on piers, and eight flying cars working the lanes.
//
// Like [[seaside-bungalow]] this is an EMPTY palace — sixteen distinct objects,
// eight inside and eight out through the glass, each a ready-made peg. Every
// description ends with "PEG: empty"; replace that with what you want to
// remember. The tour works outward: round the room first, then through the
// window, near to far, ending on the skyway at the horizon.
//
// Source: blender_models/SkyLoft.blend, built through Blender MCP.
// Locus_01..16 are baked into the .blend (collection 10_Loci, Locus_NN_<key>),
// so build_glb.py's SCENES entry is empty; export prep is in
// scripts/sky_loft_export.py. No recentring. Numbers below are three.js space
// (Blender x, z, -y) — Blender +Y points out of the window, so the city sits at
// large negative z.
//
// Camera: the tour never leaves the room. Each locus names its own anchorFrom
// (a standpoint on the floor) with a NEGATIVE anchorDistance equal to the
// horizontal distance to the locus, which parks the camera exactly there, and
// an eyeHeight relative to the locus — strongly negative for the towers, whose
// aim points are 40–65 m above the floor.

export default {
  // Where the Blender hero still is taken: back of the room, facing the glass.
  startView: {
    position: [-1.35, 1.6, 6.25],
    lookAt: [0, 1.5, -2],
  },
  walkthrough: {
    travelSeconds: 3.5,
    dwellSeconds: 12,
    eyeHeight: 1.6,
    anchorDistance: -3,
    loop: true,
  },
  background: 0xb7d4ec,
  // Replaces the per-material aerial haze the Blender scene shades in: the
  // furthest towers are ~1 km out, well inside the viewer's 2 km far plane.
  fog: { near: 260, far: 1700 },
  lighting: {
    hemisphere: 1.0,
    ambient: 0.38,
    ambientColor: 0xeaf2ff,
    sun: 1.25,
    // The room is only 9 x 9 m; the city is lit by the hemisphere light.
    shadowExtent: 24,
    // Brushed metal mullions, the glass wall and the flying cars need
    // something to reflect.
    environment: true,
    environmentIntensity: 0.55,
    environmentColor: 0xe8eef6,
  },
  labels: { worldSize: 0.3, offsetY: 0.45 },
  loci: [
    {
      id: 1,
      title: 'The hovering lounge chair',
      description: 'A pale grey lounge chair floating a hand\'s width above a dark plinth, held up by a cyan light pad. It is angled away from you, toward the glass and the city.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [-3.05, 0.72, 2.25],
      anchorFrom: [-1.5, 0, 4.7],
      anchorDistance: -2.9,
      eyeHeight: 0.78,
    },
    {
      id: 2,
      title: 'The white cube on the low table',
      description: 'A black low table on a slim metal stem, and standing on it a single white cube lit from inside. The one hard, bright object in a room of soft greys.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [-0.75, 0.55, 2.55],
      anchorFrom: [-0.2, 0, 4.8],
      anchorDistance: -2.32,
      eyeHeight: 0.9,
    },
    {
      id: 3,
      title: 'The holo panel',
      description: 'A pane of blue light standing on a thin stem by the right-hand glass, turned slightly toward the room. Translucent: the city shows straight through it.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [2.85, 1.55, 1.35],
      anchorFrom: [1.2, 0, 3.7],
      anchorDistance: -2.87,
      eyeHeight: 0.05,
    },
    {
      id: 4,
      title: 'The console by the window',
      description: 'A dark slab console floating on a single stem at the left of the glass, its top face a strip of cyan light. Nothing on it.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [-3.55, 0.68, 1.25],
      anchorFrom: [-1.9, 0, 3.8],
      anchorDistance: -3.04,
      eyeHeight: 0.92,
    },
    {
      id: 5,
      title: 'The sideboard and its light line',
      description: 'A long low sideboard the colour of the wall, running down the left side of the room, with one continuous cyan line cut along its top edge.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [-4.15, 0.62, 4.4],
      anchorFrom: [-2.1, 0, 4.4],
      anchorDistance: -2.05,
      eyeHeight: 0.93,
    },
    {
      id: 6,
      title: 'The lit doorway',
      description: 'The way out: a deep recess in the back wall, the only dark surface in the room, with a tall panel of white light filling it end to end.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [0.65, 1.6, 8.8],
      anchorFrom: [0.4, 0, 6.0],
      anchorDistance: -2.81,
      eyeHeight: 0.0,
    },
    {
      id: 7,
      title: 'The ribbed ceiling and its coves',
      description: 'Look up: seven shallow ribs running front to back, with three long recessed light strips glowing between them and a cyan reveal where the ceiling meets the window head.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [0.0, 3.12, 3.5],
      anchorFrom: [0.0, 0, 5.6],
      anchorDistance: -2.1,
      eyeHeight: -1.57,
    },
    {
      id: 8,
      title: 'The sill and the floor inlays',
      description: 'Three thin cyan lines set into the floor, running the length of the room and stopping dead at the metal sill of the glass wall. The last thing inside.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [0.0, 0.16, 0.3],
      anchorFrom: [0.0, 0, 3.6],
      anchorDistance: -3.3,
      eyeHeight: 1.44,
    },
    {
      id: 9,
      title: 'The balcony ledge',
      description: 'Through the glass: a narrow ledge running the full width of the window, edged by a glass railing on a slim metal top rail, with a straight drop behind it.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [0.0, 0.18, -1.5],
      anchorFrom: [0.0, 0, 2.8],
      anchorDistance: -4.3,
      eyeHeight: 1.42,
    },
    {
      id: 10,
      title: 'The flying car passing the window',
      description: 'A white four-pod flying car crossing left to right about thirty metres out, banked into its turn, four blue thruster jets lit underneath and an orange tail light behind.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [7.0, 1.0, -27.0],
      anchorFrom: [-1.0, 0, 4.5],
      anchorDistance: -32.5,
      eyeHeight: 0.6,
    },
    {
      id: 11,
      title: 'The ring tower',
      description: 'Right of centre on the skyline: a vast glass torus tilted off vertical, carried between two concrete cores — a building with a hole through it.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [185.0, 50.0, -380.0],
      anchorFrom: [-1.0, 0, 4.5],
      anchorDistance: -427.13,
      eyeHeight: -48.4,
    },
    {
      id: 12,
      title: 'The twin towers and their sky bridge',
      description: 'Two identical tapered towers straight ahead, joined near the top by a single bridge with a lit underside.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [60.0, 45.0, -330.0],
      anchorFrom: [-1.0, 0, 4.5],
      anchorDistance: -340.02,
      eyeHeight: -43.4,
    },
    {
      id: 13,
      title: 'The twisting supertall',
      description: 'The tallest thing in the view, away to the left: five stacked sections each rotated a little on the one below, tapering to a needle spire.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [-150.0, 60.0, -470.0],
      anchorFrom: [-1.4, 0, 4.6],
      anchorDistance: -497.32,
      eyeHeight: -58.4,
    },
    {
      id: 14,
      title: 'The hourglass tower',
      description: 'Far left: a tower pinched in at its waist — a cone narrowing upward, then another widening again, capped in metal.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [-230.0, 40.0, -300.0],
      anchorFrom: [-2.6, 0, 4.4],
      anchorDistance: -379.96,
      eyeHeight: -38.4,
    },
    {
      id: 15,
      title: 'The orb tower',
      description: 'Far right and furthest away: a plain shaft with an enormous glass sphere impaled two-thirds of the way up it.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [355.0, 65.0, -480.0],
      anchorFrom: [1.8, 0, 4.4],
      anchorDistance: -599.49,
      eyeHeight: -63.4,
    },
    {
      id: 16,
      title: 'The skyway on piers',
      description: 'The last stop, low and to the left: an elevated road running between towers on stubby piers, a cyan line glowing along its underside.\n\nPEG: empty — attach whatever you want to remember here.',
      position: [-140.0, 12.0, -340.0],
      anchorFrom: [-1.8, 0, 4.2],
      anchorDistance: -370.91,
      eyeHeight: -10.4,
    },
  ],
};
