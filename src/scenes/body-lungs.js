// The Bellows Cathedral — the lungs as a building, walked in the direction
// the air goes.
//
// Scene 2 of the Human Body series (docs/human-body-series.md). Deliberately
// the opposite room to [[body-heart]]: that one is a dark machine hall, this
// one is pale, tall and full of light, because the thing it is about is
// surface — 70 square metres of it, held open inside your chest.
//
// The walk is one-way and it is the air's way: in at the portico (nose), past
// the gate that shuts when you swallow, down the ribbed nave (trachea) with
// the mucus escalator running the other way under your feet, through the fork,
// out across the branching hall where the pipes multiply until the air stops
// moving, through a bronchiole with muscle but no cartilage, and up onto the
// cathedral floor — the respiratory zone — where the domes are alveoli. The
// floor you are standing on up there is held up by the diaphragm.
//
// Real positions come from the Locus_01..14 empties baked into
// models/body-lungs.glb (collection 09_Loci in BellowsCathedral.blend, built
// by blender_models/lungs_scenegen/build_lungs.py). `position` below is only
// the three.js-space fallback (Blender x,y,z -> three x, z, -y).
//
// Every stop names its own `anchorFrom` with a negative `anchorDistance` —
// the pattern this series uses for interiors. The scene is 300 m long, so the
// stand-off distances are much larger than in the other rooms.
export default {
  background: 0xdfe7ec,
  fog: { near: 140, far: 900 },
  lighting: {
    hemisphere: 1.2,
    ambient: 0.95,
    ambientColor: 0xfff0e6,
    sun: 2.2,
    shadowExtent: 120,
  },
  walkthrough: {
    travelSeconds: 7,
    dwellSeconds: 12,
    eyeHeight: 2,
    anchorDistance: -24,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Door',
      description:
        'The nose, built as a portico, because this is the only part of the airway that is architecture rather than plumbing. The scrolled baffles inside are the turbinates: they force every breath to touch a wet wall, so that air arrives at body temperature, fully humidified and stripped of most of what was floating in it. Breathe through your mouth and you skip all three.',
      position: [0, 9, 127],
      anchorFrom: [0, 0, 160],
      anchorDistance: -34,
      eyeHeight: 8,
    },
    {
      id: 2,
      title: 'The Gate',
      description:
        'The larynx. One aperture, two jobs that must never overlap: open to breathe, shut to swallow. The leaf hinged above it is the epiglottis, which folds back over the opening as you swallow; the two shelves across the middle are the vocal folds, and the slit between them is where your voice is. Everything you have ever said came out of a gap about a centimetre wide.',
      position: [0, 12, 112],
      anchorFrom: [0, 0, 140],
      anchorDistance: -12,
      eyeHeight: 4,
    },
    {
      id: 3,
      title: 'The Ribbed Nave',
      description:
        'The trachea, held permanently open by about twenty rings of cartilage. They are C-shaped, not O-shaped, and the gap in the C is at the back — which is exactly where the oesophagus runs. The one soft strip in an otherwise rigid tube is there so that a swallowed mouthful has somewhere to bulge into.',
      position: [0, 10, 80],
      anchorFrom: [0, 0, 105],
      anchorDistance: -26,
      eyeHeight: 2,
    },
    {
      id: 4,
      title: 'The Escalator',
      description:
        'Under your feet, running the wrong way: a carpet of cilia beating about twelve times a second, pushing a sheet of mucus back up towards the door at roughly a centimetre a minute. Anything you breathe in that is bigger than a few microns is caught in that sheet, carried out, and swallowed. Smoke paralyses the cilia — which is why the escalator has to be run manually, as a cough, every morning.',
      position: [0, 2.5, 70],
      anchorFrom: [0, 0, 95],
      anchorDistance: -14,
      eyeHeight: 5,
    },
    {
      id: 5,
      title: 'The Fork',
      description:
        'The carina, and the first asymmetry in the building: the right bronchus leaves at a shallower angle and is the wider of the two, so anything you inhale by accident — the peanut down there — tends to end up in the right lung. A radiologist reading a chest film knows where to look first because of the shape of this junction.',
      position: [0, 10, 48],
      anchorFrom: [0, 0, 72],
      anchorDistance: -34,
      eyeHeight: 2,
    },
    {
      id: 6,
      title: 'The Branching Hall',
      description:
        'Twenty-three generations of branching, each one splitting in two — six of them built here. Every daughter pipe is narrower than its parent, which feels like it should speed the air up, and does the opposite: there are twice as many of them, so the total cross-section explodes. By the time air reaches the far end it has slowed almost to a standstill and the last few millimetres are crossed by diffusion alone. The bars on the floor are that total area, generation by generation.',
      position: [0, 24, 10],
      anchorFrom: [0, 0, 60],
      anchorDistance: -46,
      eyeHeight: 14,
    },
    {
      id: 7,
      title: 'The Bronchiole',
      description:
        'Two of them side by side: one at rest, one in spasm. Out here there is no cartilage left — just a wrap of smooth muscle around a tube about half a millimetre wide. That muscle is the whole trouble with asthma: resistance goes up with the fourth power of the radius, so halving the bore makes it sixteen times harder to move air through, and the difficulty is in getting it back OUT, because breathing in pulls these tubes open and breathing out lets them close.',
      position: [0, 38, -34],
      anchorFrom: [0, 0, 10],
      anchorDistance: -22,
      eyeHeight: 3,
    },
    {
      id: 8,
      title: 'The Line',
      description:
        'The boundary between the conducting zone and the respiratory zone. Everything behind you is dead space: about 150 ml of air that goes in and out with every breath and never exchanges anything, which is why shallow panting ventilates almost nothing. Past this line the walls start budding alveoli and gas begins to cross. It is the one line in the building worth remembering the position of.',
      position: [0, 34, -50],
      anchorFrom: [0, 0, 0],
      anchorDistance: -24,
      eyeHeight: 8,
    },
    {
      id: 9,
      title: 'The Dome',
      description:
        'One alveolus, cut open. In life it is about 0.2 mm across and there are roughly five hundred million of them, sharing their walls with their neighbours the way bubbles in a foam do. Nothing here is a container: the sac is a surface, and the only reason the lung is shaped the way it is, is to hold as much of that surface open as will fit in a chest.',
      position: [0, 40, -64],
      anchorFrom: [0, 0, -20],
      anchorDistance: -24,
      eyeHeight: 6,
    },
    {
      id: 10,
      title: 'Half a Micron',
      description:
        'The wall itself, cut and mounted: a film of water with surfactant in it, one flattened alveolar cell, the capillary’s own cell, then blood. About half a micron in total — the thinnest working surface in the body. Oxygen crosses it in one direction and carbon dioxide in the other, driven by nothing but the difference in partial pressure; no pump, no carrier, no energy spent. The surfactant in the film is what stops the small sacs emptying into the big ones, and making it is the last thing a lung learns to do before birth.',
      position: [0, 44, -85],
      anchorFrom: [0, 0, -64],
      anchorDistance: -18,
      eyeHeight: 3,
    },
    {
      id: 11,
      title: 'The Mesh',
      description:
        'The capillary net laid over the sac like a string bag, so dense that the blood inside it is nearer to a sheet than to a stream. A red cell squeezes through single file and spends about three quarters of a second against the wall, which is roughly three times longer than it needs — the margin is why you can climb stairs. Blue arriving on one side of the dome, red leaving on the other.',
      position: [13, 46, -76],
      anchorFrom: [40, 0, -76],
      anchorDistance: -18,
      eyeHeight: 2,
    },
    {
      id: 12,
      title: 'Both Traffics',
      description:
        'The big pair are the pulmonary circulation, and the thing to hold about them is the volume: every drop of blood the right side of the heart puts out comes through this one organ, every time round. No other organ takes all of it. The thin red line running along the airway is the bronchial artery — the lung’s own supply, off the aorta, because the blood inside the big pipes is passing through, not stopping to feed anything.',
      position: [40, 44, -60],
      anchorFrom: [70, 0, -20],
      anchorDistance: -30,
      eyeHeight: 8,
    },
    {
      id: 13,
      title: 'The Floor That Moves',
      description:
        'The vault holding up the cathedral floor is the diaphragm, and it is domed like this only at rest. To breathe in, it FLATTENS — pulling the floor of the chest down, dropping the pressure inside, and letting the outside air fall in. The lung has no muscle of its own and never sucks; it is a passive bag in a box whose walls move. That is also why a hole in the chest wall collapses a lung: the box stops being a box.',
      position: [0, 18, -40],
      anchorFrom: [-80, 0, -40],
      anchorDistance: -62,
      eyeHeight: 2,
    },
    {
      id: 14,
      title: 'The Court',
      description:
        'The only object in this building at true size. Everything else is magnified about a hundred thousand times; this is a tennis court as a tennis court, with a person beside it for scale. All the alveolar wall you have been walking on comes to roughly that area — around 70 square metres of working surface, folded small enough to carry around inside a rib cage, and thin enough that you could read through it.',
      position: [66, 5, 34],
      anchorFrom: [66, 0, 60],
      anchorDistance: -34,
      eyeHeight: 13,
    },
  ],
};
