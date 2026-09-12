// The Ledge: a timber meditation deck cantilevered off a granite cliff at
// dawn, with a sea of cloud 95 m below it and a snow range on the far side.
// Built as a place to actually sit in as much as a place to remember from —
// so the ten loci are also the ten stations of a sit: the approach (gate,
// basin, lantern, cairn), the seat itself, then attention moving outward
// (bell, edge, pine) and finally away (the cloud, the far peak).
//
// The rig is unusual for this repo: every locus names `anchorFrom: [0, 0, 0]`
// — the deck centre — instead of letting the shared centroid decide, because
// two of the loci are hundreds of metres out over the valley and would drag
// that centroid off the cliff. With the deck as the origin and every
// anchorDistance negative, the camera always stands ON the ledge and looks
// outward, which is the whole point of the room: you never leave the deck.
//
// Real positions come from the Locus_01..10 empties baked into
// models/meditation-ledge.glb (collection 09_Loci in MeditationLedge.blend,
// built by blender_models/meditation_scenegen/build_meditation.py).
// `position` below is only the three.js-space fallback
// (Blender x,y,z -> three x, z, -y).
//
// Every peg is still blank: the titles name the object, and the descriptions
// say both what it is good for holding and what it is for during a sit.
// Replace them with real content when there is some.
export default {
  background: 0xe0a877,
  fog: { near: 70, far: 1900 },
  lighting: {
    hemisphere: 1.0,
    ambient: 0.5,
    ambientColor: 0xffd9b0,
    sun: 2.1,
    shadowExtent: 45,
  },
  walkthrough: {
    travelSeconds: 7,
    dwellSeconds: 10,
    eyeHeight: 1.4,
    anchorDistance: -4.0,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Gate',
      description:
        'Two cedar posts and a lintel at the head of the path — the threshold, and nothing more. Anchor for what a sequence starts with, or for what you agree to put down before you begin.',
      position: [0, 2.35, 7.6],
      anchorFrom: [0, 0, 0],
      anchorDistance: -5.5,
      eyeHeight: -0.6,
    },
    {
      id: 2,
      title: 'The Water Basin',
      description:
        'A stone tsukubai below the gate, kept full by a bamboo spout that never stops running. Good for anything continuous or cyclical — a process that only exists while it is moving.',
      position: [-3.4, 0.62, 9.5],
      anchorFrom: [0, 0, 0],
      anchorDistance: -3.2,
      eyeHeight: 1.3,
    },
    {
      id: 3,
      title: 'The Stone Lantern',
      description:
        'One small flame inside a stone box, still burning at sunrise. Reserve it for the single thing that has to stay lit — the one item in a list you cannot afford to lose.',
      position: [3.2, 1.55, 9.0],
      anchorFrom: [0, 0, 0],
      anchorDistance: -3.4,
      eyeHeight: 0.9,
    },
    {
      id: 4,
      title: 'The Cairn',
      description:
        'Five flat stones stacked largest to smallest beside the deck. A counter: use it for an ordered set of exactly five, or for a hierarchy that narrows as it rises.',
      position: [-7.4, 1.0, 5.5],
      anchorFrom: [0, 0, 0],
      anchorDistance: -3.6,
      eyeHeight: 1.1,
    },
    {
      id: 5,
      title: 'The Cushion',
      description:
        'The zafu at the centre of the deck, a folded blanket and a brass bowl beside it. The seat — everything else in this room is arranged around it. Anchor for the centre of a thing: the thesis, the invariant, the one that the rest hangs off.',
      position: [0, 0.62, 0],
      anchorFrom: [0, 0, 7],
      anchorDistance: -3.4,
      eyeHeight: 0.9,
    },
    {
      id: 6,
      title: 'The Wind Bell',
      description:
        'A small brass bell on a slim post at the east rail, with a paper slip under it. It only sounds when something moves. Good for a trigger or a condition — the thing that happens because something else did.',
      position: [4.35, 2.35, -6.2],
      anchorFrom: [0, 0, 0],
      anchorDistance: -3.0,
      eyeHeight: 0.2,
    },
    {
      id: 7,
      title: 'The Edge',
      description:
        'The far rail, past which the deck stops and there is nothing for ninety-five metres. Use it for a boundary: the limit of a claim, the last case before something breaks.',
      position: [0, 0.95, -8.8],
      anchorFrom: [0, 0, 0],
      anchorDistance: -6.0,
      eyeHeight: 0.9,
    },
    {
      id: 8,
      title: 'The Leaning Pine',
      description:
        'A wind-shaped pine growing out of the rock west of the deck, bent almost horizontal over the drop and still alive. Anchor for the thing that survived by giving way.',
      position: [-11.5, 4.2, 2.6],
      anchorFrom: [0, 0, 0],
      anchorDistance: -6.5,
      eyeHeight: -1.8,
    },
    {
      id: 9,
      title: 'The Sea of Cloud',
      description:
        'The valley filled to the brim with cloud, moving too slowly to see. Good for the large, slow and unordered — a set too big to count, where only the shape of the whole matters.',
      // 180 m out and 40 m down, which is a 12-degree look-down from the
      // rail -- far enough that the shot reads as a valley rather than as
      // standing on top of the cloud.
      position: [30, -40, -180],
      anchorFrom: [0, 0, 0],
      anchorDistance: -172,
      eyeHeight: 42,
    },
    {
      id: 10,
      title: 'The Far Peak',
      description:
        'The snow summit across the valley with the sun cresting the saddle beside it — the furthest thing in the room and the first thing lit. Reserve it for the goal: what the whole sequence is for.',
      // aimed at the mid-flank of the big peak, 1.18 km out, so its summit
      // sits high in frame with the cloud sea running in underneath it.
      position: [-120, 240, -1180],
      anchorFrom: [0, 0, 0],
      anchorDistance: -1176,
      eyeHeight: -238,
    },
  ],
};
