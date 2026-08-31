// City scene: walkthrough tuning + memory loci.
//
// `position` is a fallback used only until the .glb ships real Blender
// Empties named Locus_01 .. Locus_NN. When those exist, their world
// positions win and this file just supplies title/description (keyed by id).
export default {
  walkthrough: {
    travelSeconds: 6, // time gliding between two loci
    dwellSeconds: 7, // pause at each locus (user can look around)
    eyeHeight: 2.4, // camera height above the locus base
    anchorDistance: 9, // how far back the camera sits from the locus
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Gate',
      description:
        'Entrance to the district. A wide asphalt junction where every route begins.',
      position: [-16, 2.4, -16],
    },
    {
      id: 2,
      title: 'The Glass Tower',
      description: 'Tallest structure on the north edge. Anchor for anything urgent.',
      position: [-6, 3.2, -12],
    },
    {
      id: 3,
      title: 'The Pocket Park',
      description: 'A block of grass and cone trees. Use it for calm or restful items.',
      position: [4, 2.2, -4],
    },
    {
      id: 4,
      title: 'The Crossroads',
      description: 'Dead centre of the grid. Anything that connects two other ideas lives here.',
      position: [0, 2.4, 0],
    },
    {
      id: 5,
      title: 'The Red Block',
      description: 'A cluster of low warehouses to the east. Good for lists and inventories.',
      position: [12, 2.6, 6],
    },
    {
      id: 6,
      title: 'The South Terrace',
      description: 'Stepped rooftops facing the sun. Reserve for goals and future plans.',
      position: [2, 3.0, 14],
    },
    {
      id: 7,
      title: 'The Overlook',
      description: 'Far south-west corner with the widest view back over the city.',
      position: [-14, 2.8, 15],
    },
  ],
};
