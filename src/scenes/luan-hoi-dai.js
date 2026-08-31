// Luan Hoi Dai: a central glowing pillar ringed by orbiting bands, with a path
// of gates leading away across a dark platform. Six loci. Placeholder text.
//
// Real positions come from the Locus_01..06 empties in the glb
// (scripts/build_glb.py); `position` is only the three.js-space fallback.
export default {
  walkthrough: {
    travelSeconds: 5,
    dwellSeconds: 6,
    eyeHeight: 1.8,
    anchorDistance: 6,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Central Pillar',
      description: 'The lit column at the heart of the platform. The core idea sits here.',
      position: [0, 2, 0],
    },
    {
      id: 2,
      title: 'The First Gate',
      description: 'The nearest arch on the path out. First consequence or first step.',
      position: [0, 2, 4],
    },
    {
      id: 3,
      title: 'The Second Gate',
      description: 'Further along the path. The middle of a cause-and-effect chain.',
      position: [0, 2, 8],
    },
    {
      id: 4,
      title: 'The Left Ring',
      description: 'The ring off to one side of the path. Good for a parallel alternative.',
      position: [5, 2, 6],
    },
    {
      id: 5,
      title: 'The Right Ring',
      description: 'The matching ring on the other side. The other alternative.',
      position: [-5, 2, 6],
    },
    {
      id: 6,
      title: 'The Return',
      description: 'The arch behind the pillar that curves back. Use for what repeats.',
      position: [0, 2, -6],
    },
  ],
};
