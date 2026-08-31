// Time Machine: an orrery on a plinth with a timeline path of markers running
// out into the dark. Five loci, ordered present -> past. Placeholder text.
//
// Real positions come from the Locus_01..05 empties in the glb
// (scripts/build_glb.py); `position` is only the three.js-space fallback.
export default {
  walkthrough: {
    travelSeconds: 4,
    dwellSeconds: 6,
    eyeHeight: 2.0,
    anchorDistance: 8,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Orrery',
      description: 'The ringed globe on the plinth. The event or idea you are placing in time.',
      position: [0, 1.8, 0],
    },
    {
      id: 2,
      title: 'The Present Marker',
      description: 'The ring nearest the orrery. What is true right now.',
      position: [0, 1.8, 5],
    },
    {
      id: 3,
      title: 'The Near Past',
      description: 'A few steps around the timeline. Recent causes and precedents.',
      position: [5, 1.8, 3],
    },
    {
      id: 4,
      title: 'The Deep Past',
      description: 'Further round where the light dims. Older, structural background.',
      position: [5, 1.8, -3],
    },
    {
      id: 5,
      title: 'The Origin',
      description: 'The last ring before the dark. The first cause or the founding fact.',
      position: [0, 1.8, -5],
    },
  ],
};
