// Portal Island: a floating island with a ring of eight portal gates around a
// central plaza, plus a cabin, garden and rocky outcrops. Replaces Luan Hoi
// Dai as the hub-of-gates scene — same "eight thresholds around a centre"
// idea, reskinned as a sunlit sky island instead of a dark cosmological
// altar.
//
// The road behind Gate 4 now carries on across a causeway to a second lobe of
// land holding the Rosetta language square — four language gates around the
// Rosetta Stone, which is where language-learning pegs live (loci 10–13).
//
// Real positions come from the Locus_* empties baked directly into
// PortalIsland.blend (not injected by scripts/build_glb.py — see that
// script's SCENES dict, which has an empty list for this id); `position`
// below is only the three.js-space fallback if the glb ever loses them.
//
// Titles and descriptions are still placeholder text — they name what each
// locus *is* rather than what it should hold. The language gates (10–13) in
// particular are waiting for real pegs.
//
// `anchorFrom` matters here: this scene has two separate clusters, so the
// centroid of all thirteen loci falls in the empty air between the island and
// the peninsula. Each locus names its own cluster centre instead, so the
// camera always backs off toward the plaza (or the square) and looks outward
// at its gate.
//
// The language loci sit at y 4.90 — the gates' mid-height, not head height.
// The rig parks the camera `eyeHeight` above the locus and looks down at it,
// so a locus at plinth level aims the shot at the gate's base and crops the
// roof off. Standing further back is not an option here: the square's centre
// is occupied by the Rosetta Stone, and a larger `anchorDistance` puts the
// camera inside it. Raising the aim point is what frames the whole gate.
const PLAZA = [-0.51, 0, -0.79]; // gate-ring centre, three.js space
const SQUARE = [-23.14, 0, -23.42]; // Rosetta square centre

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
      anchorFrom: PLAZA,
    },
    {
      id: 2,
      title: 'The Ember Gate',
      description: 'Angled toward the cabin’s glow. A warm peg for something personal or hard-won.',
      position: [6.6, 3.41, -7.9],
      anchorFrom: PLAZA,
    },
    {
      id: 3,
      title: 'The Tower',
      description: 'The one break in the ring: an apartment tower stands where the north gate used to. A tall, modern landmark — good for something that stacks up in layers, or that stands apart from the rest of the set.',
      position: [-0.51, 3.41, -12.99],
      anchorFrom: PLAZA,
    },
    {
      id: 4,
      title: 'The Verdant Gate',
      description: 'Looks down over the garden beds, and the road behind it runs out to the Rosetta square. A natural peg for anything that grows or develops over time — or as the doorway into the language set.',
      position: [-7.62, 3.41, -7.9],
      anchorFrom: PLAZA,
    },
    {
      id: 5,
      title: 'The Dusk Gate',
      description: 'Facing away from the sun, half in shadow. Good for an ending, a caveat, or something still unresolved.',
      position: [-12.7, 3.41, -0.83],
      anchorFrom: PLAZA,
    },
    {
      id: 6,
      title: 'The Stone Gate',
      description: 'Overlooking the bare rock outcrops below. A solid, load-bearing peg for a fact or foundation.',
      position: [-7.55, 3.41, 6.25],
      anchorFrom: PLAZA,
    },
    {
      id: 7,
      title: 'The Tide Gate',
      description: 'Facing the open drop past the cliff edge. Good for a turning point or a risk.',
      position: [-0.51, 3.41, 11.31],
      anchorFrom: PLAZA,
    },
    {
      id: 8,
      title: 'The Hearth Gate',
      description: 'Closest to the cabin door, the last stop before the ring repeats. A homely peg for something familiar.',
      position: [6.53, 3.41, 6.25],
      anchorFrom: PLAZA,
    },
    {
      id: 9,
      title: 'The Piano',
      description: 'A grand piano out on the lawn between the gates, lid open to the sky. Off the ring and unmistakable — good for the one item that belongs to no category.',
      position: [7.99, 1.22, 10.51],
      anchorFrom: PLAZA,
    },
    {
      id: 10,
      title: 'हिन्दी — Hindi',
      description: 'Sandstone gate on the south side of the square, corner towers capped with chhatris under a stepped shikhara. First stop after the causeway. Placeholder — Hindi pegs go here.',
      position: [-23.14, 4.9, -12.62],
      anchorFrom: SQUARE,
    },
    {
      id: 11,
      title: '中文 — Chinese',
      description: 'Three-bay paifang on the west side, red posts under tiered teal roofs. Placeholder — Chinese pegs go here.',
      position: [-33.94, 4.9, -23.42],
      anchorFrom: SQUARE,
    },
    {
      id: 12,
      title: 'Français — French',
      description: 'Limestone triumphal arch on the north side, navy roofs and side pavilions. Placeholder — French pegs go here.',
      position: [-23.14, 4.9, -34.22],
      anchorFrom: SQUARE,
    },
    {
      id: 13,
      title: 'العربية — Arabic',
      description: 'Domed gate on the east side, merlon parapet and corner turrets. Last stop before the tour returns across the causeway. Placeholder — Arabic pegs go here.',
      position: [-12.34, 4.9, -23.42],
      anchorFrom: SQUARE,
    },
  ],
};
