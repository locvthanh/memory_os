// Portal Island: a floating island with a ring of eight portal gates around a
// central plaza, plus a cabin, garden and rocky outcrops. Replaces Luan Hoi
// Dai as the hub-of-gates scene — same "eight thresholds around a centre"
// idea, reskinned as a sunlit sky island instead of a dark cosmological
// altar. Eight loci, one per gate, walking the ring. Placeholder text.
//
// Real positions come from the Locus_01..08 empties baked directly into
// PortalIsland.blend (not injected by scripts/build_glb.py — see that
// script's SCENES dict, which has an empty list for this id); `position`
// below is only the three.js-space fallback if the glb ever loses them.
export default {
  walkthrough: {
    travelSeconds: 5,
    dwellSeconds: 6,
    eyeHeight: 1.8,
    anchorDistance: -6,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Sunrise Gate',
      description: 'Facing the open sea to the east, the first threshold past the ring’s start. Good for whatever kicks off a sequence.',
      position: [11.68, 3.41, -0.83],
    },
    {
      id: 2,
      title: 'The Ember Gate',
      description: 'Angled toward the cabin’s glow. A warm peg for something personal or hard-won.',
      position: [6.6, 3.41, -7.9],
    },
    {
      id: 3,
      title: 'The Sky Gate',
      description: 'The high point of the ring, framed by drifting clouds. Good for a big-picture idea or an overview.',
      position: [-0.51, 3.41, -12.99],
    },
    {
      id: 4,
      title: 'The Verdant Gate',
      description: 'Looks down over the garden beds. A natural peg for anything that grows or develops over time.',
      position: [-7.62, 3.41, -7.9],
    },
    {
      id: 5,
      title: 'The Dusk Gate',
      description: 'Facing away from the sun, half in shadow. Good for an ending, a caveat, or something still unresolved.',
      position: [-12.7, 3.41, -0.83],
    },
    {
      id: 6,
      title: 'The Stone Gate',
      description: 'Overlooking the bare rock outcrops below. A solid, load-bearing peg for a fact or foundation.',
      position: [-7.55, 3.41, 6.25],
    },
    {
      id: 7,
      title: 'The Tide Gate',
      description: 'Facing the open drop past the cliff edge. Good for a turning point or a risk.',
      position: [-0.51, 3.41, 11.31],
    },
    {
      id: 8,
      title: 'The Hearth Gate',
      description: 'Closest to the cabin door, the last stop before the ring repeats. A homely peg for something familiar.',
      position: [6.53, 3.41, 6.25],
    },
  ],
};
