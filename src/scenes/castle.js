// Castle: a walled keep with corner towers and a gatehouse. The walkthrough
// enters at the gate, crosses the courtyard past the well, reaches the keep
// door, sweeps the two north corner towers, climbs the west battlements and
// finishes on the keep roof. Seven loci.
//
// Real positions come from the Locus_01..07 empties baked into
// models/castle.glb (authored in Blender). `position` is only the
// three.js-space fallback (Blender x,y,z -> three x, z, -y).
export default {
  walkthrough: {
    travelSeconds: 5,
    dwellSeconds: 7,
    eyeHeight: 1.7,
    // negative: the camera sits on the courtyard-centre side of each locus
    // and looks outward at it, rather than backing through a wall or tower.
    anchorDistance: -8,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Gatehouse',
      description:
        'The portcullis arch where the tour enters. Anchor for beginnings and first steps.',
      position: [0, 1.6, 13],
    },
    {
      id: 2,
      title: 'The Well',
      description:
        'The covered well at the heart of the courtyard. Use it for anything central or recurring.',
      position: [-5, 1.2, 5],
    },
    {
      id: 3,
      title: 'The Keep Door',
      description:
        'The banner-flanked door into the great keep. Reserve for the single most important item.',
      position: [0, 1.7, -2.2],
    },
    {
      id: 4,
      title: 'The East Tower',
      description:
        'The north-east corner tower. Good for lookout items — things to keep watch on.',
      position: [15, 2.2, -15],
    },
    {
      id: 5,
      title: 'The West Tower',
      description:
        'The north-west corner tower, its twin. Pair it with the East Tower for two related ideas.',
      position: [-15, 2.2, -15],
    },
    {
      id: 6,
      title: 'The Battlements',
      description:
        'The wall-walk along the western curtain. Use for lists or sequences that run in order.',
      position: [-15, 6.8, 0],
    },
    {
      id: 7,
      title: 'The Keep Roof',
      description:
        'The highest point, looking back over the whole ward. Reserve for the big picture or the goal.',
      position: [0, 13.2, -7],
    },
  ],
};
