// The Seaside Bungalow — a realistic beach-house living room at midday.
//
// A whitewashed room with a teak-beamed ceiling. The whole front wall is a
// glass sliding door onto a teak deck, the beach, two leaning coconut palms,
// the sea, and a hazy island on the horizon. Unlike most scenes in this app it
// has no subject yet: it is an EMPTY palace. Sixteen distinct objects, eleven
// inside and five outside, each a ready-made peg -- including one that
// doesn't belong: a wizard's hat floating over the coffee table. The tour runs round the room
// clockwise from the sofa, through the glass, and down to the waterline.
// Every locus description ends with "PEG: empty": replace that with whatever
// you want to remember.
//
// Source: blender_models/SeasideBungalow.blend, generated through Blender MCP by
// blender_models/seaside_bungalow_scenegen/ (sb_*.py). Locus_01..16 are baked
// into the .blend (collection 10_Loci, on each object's aim point), so
// build_glb.py's SCENES entry is empty; export prep is in
// scripts/seaside_bungalow_export.py. No recentring. Numbers below are three.js
// space (Blender x, z, -y), generated from sb_build.py LOCI -- keep in step.
//
// Camera: every stop parks the camera at anchorFrom (a negative anchorDistance
// = the horizontal distance to the locus) at eyeHeight above the aim point
// (negative = below it, looking up -- the pendant).

export default {
  // Open where the Blender hero still is taken: back of the room, facing the glass.
  startView: {
    position: [0.3, 1.4, 6.5],
    lookAt: [0, 1.4, -0.2],
  },
  walkthrough: {
    travelSeconds: 3.5,
    dwellSeconds: 12,
    eyeHeight: 1.5,
    anchorDistance: -3,
    loop: true,
  },
  background: 0xbcd9ec,
  fog: { near: 400, far: 3000 },
  lighting: {
    hemisphere: 1.0,
    ambient: 0.35,
    ambientColor: 0xfff0dc,
    sun: 1.3,
    // Deck + beach are ~14 m x 30 m in front of the 7 m x 7 m room.
    shadowExtent: 22,
    // The glass door and the brass handle need something to reflect.
    environment: true,
    environmentIntensity: 0.5,
    environmentColor: 0xe8eef0,
  },
  labels: { worldSize: 0.3, offsetY: 0.45 },
  loci: [
    {
      id: 1,
      title: "The long linen sofa",
      description: "A deep three-seat sofa in oatmeal linen along the left wall, its back to the side window, facing across the room. Four throw pillows: two sea-blue, one sand, one white, all leaning in the corners.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [-2.3, 0.55, 2.6],
      anchorFrom: [-0.5, 0, 4.7],
      anchorDistance: -2.77,
      eyeHeight: 1.0,
    },
    {
      id: 2,
      title: "The round teak coffee table",
      description: "A low round table of dark teak on a jute rug, with a flat sea-blue ceramic bowl, two stacked books (cream on top of slate blue) and a small white shell resting on them.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [-0.85, 0.42, 2.6],
      anchorFrom: [0.4, 0, 4.2],
      anchorDistance: -2.03,
      eyeHeight: 1.13,
    },
    {
      id: 3,
      title: "The wizard’s hat",
      description: "The one thing in this room that shouldn’t be here: a tall, midnight-blue felt wizard’s hat floating in mid-air above the coffee table, slowly tilted, its crooked tip flopping over to one side. A gold band round the crown, gold stars and a crescent moon stitched on the felt, and tiny sparks of light drifting around it.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [-0.85, 1.25, 2.6],
      anchorFrom: [0.55, 0, 4.4],
      anchorDistance: -2.28,
      eyeHeight: 0.25,
    },
    {
      id: 4,
      title: "The rattan pendant",
      description: "An open-weave rattan globe hanging on a black cord over the coffee table, a bare warm bulb glowing at its centre. Look up: you can see the ceiling boards and dark beams through the weave.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [-0.85, 2.45, 2.6],
      anchorFrom: [0.6, 0, 4.8],
      anchorDistance: -2.63,
      eyeHeight: -0.95,
    },
    {
      id: 5,
      title: "The side window",
      description: "A two-pane teak window in the left wall. Through it: the beach running away to the left, a hazy island and the sea. The sun comes in low across the sill.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [-3.55, 1.6, 1.65],
      anchorFrom: [-0.8, 0, 3.0],
      anchorDistance: -3.06,
      eyeHeight: 0.00,
    },
    {
      id: 6,
      title: "The table lamp by the door",
      description: "A white ceramic lamp with a linen drum shade on a little round teak side table at the end of the sofa, next to a pot of upright snake plant leaves.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [-2.3, 0.85, 0.95],
      anchorFrom: [-0.4, 0, 2.2],
      anchorDistance: -2.27,
      eyeHeight: 0.65,
    },
    {
      id: 7,
      title: "The glass sliding door",
      description: "The whole front wall is glass: two big teak-framed sliding panels with a brass pull handle where they meet, sheer white curtains gathered either side. Sunlight throws the shadow of the frame across the floor.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [0.0, 1.35, -0.12],
      anchorFrom: [0.2, 0, 3.6],
      anchorDistance: -3.73,
      eyeHeight: 0.25,
    },
    {
      id: 8,
      title: "The areca palm in terracotta",
      description: "An indoor palm in a flared terracotta pot in the right-hand corner by the glass, its thin fronds arching out over the floor.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [2.9, 1.0, 0.5],
      anchorFrom: [1.0, 0, 2.2],
      anchorDistance: -2.55,
      eyeHeight: 0.60,
    },
    {
      id: 9,
      title: "The teak sideboard and the pampas vase",
      description: "A long low teak sideboard against the right wall with slatted doors. On it: a tall rust-red vase of dried pampas plumes, and two books under a round white coral ornament.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [3.26, 0.9, 1.8],
      anchorFrom: [0.9, 0, 1.4],
      anchorDistance: -2.39,
      eyeHeight: 0.65,
    },
    {
      id: 10,
      title: "The sea print",
      description: "A wide framed print above the sideboard: deep teal water fading up through mist into a pale cream sky, the same colours as the view outside.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [3.46, 1.75, 1.7],
      anchorFrom: [0.5, 0, 2.0],
      anchorDistance: -2.98,
      eyeHeight: -0.10,
    },
    {
      id: 11,
      title: "The cane armchair",
      description: "A mid-century teak armchair with a woven cane seat and back, a white seat cushion and a sand-coloured pillow, angled to face both the sofa and the sea.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [1.35, 0.5, 2.55],
      anchorFrom: [-0.6, 0, 4.3],
      anchorDistance: -2.62,
      eyeHeight: 1.05,
    },
    {
      id: 12,
      title: "The two sun loungers",
      description: "Outside on the deck: two teak loungers with white cushions, their backs raised toward the house, a small round teak table between them.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [3.05, 0.35, -1.2],
      anchorFrom: [0.8, 0, -1.9],
      anchorDistance: -2.36,
      eyeHeight: 1.15,
    },
    {
      id: 13,
      title: "The deck steps",
      description: "Three wide teak steps at the front of the deck, dropping down onto the warm sand.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [0.0, -0.4, -3.9],
      anchorFrom: [0.3, 0, -1.2],
      anchorDistance: -2.72,
      eyeHeight: 1.90,
    },
    {
      id: 14,
      title: "The leaning coconut palm",
      description: "A tall coconut palm leaning out toward the sea, ringed grey trunk, a crown of long drooping fronds and a cluster of green coconuts. It frames the view from the living room.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [-3.8, 1.5, -8.4],
      anchorFrom: [-0.5, 0, -4.5],
      anchorDistance: -5.11,
      eyeHeight: -0.80,
    },
    {
      id: 15,
      title: "The waterline",
      description: "Where the sand turns dark and wet and small waves run up in a line of white foam, with a few smooth dark rocks sitting in the shallows.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [1.5, -1.3, -27.0],
      anchorFrom: [0.5, 0, -22.0],
      anchorDistance: -5.10,
      eyeHeight: 1.60,
    },
    {
      id: 16,
      title: "The island on the horizon",
      description: "Out over the turquoise shallows and the deep blue beyond: a low, hazy green island on the horizon, the last thing you see.\n\nPEG: empty — attach whatever you want to remember here.",
      position: [-15.0, 2.0, -55.0],
      anchorFrom: [-2.0, 0, -26.0],
      anchorDistance: -31.78,
      eyeHeight: -1.70,
    },
  ],
};
