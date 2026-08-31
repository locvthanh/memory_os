// Coffee Shop: a small cafe interior - counter along the back wall, pendant
// lamps, scattered round tables. Five loci. Placeholder text - edit freely.
//
// Real positions come from the Locus_01..05 empties in the glb
// (scripts/build_glb.py); `position` is only the three.js-space fallback.
export default {
  walkthrough: {
    travelSeconds: 4,
    dwellSeconds: 6,
    eyeHeight: 1.3,
    // negative: camera stays inside the room, looking outward at each locus.
    anchorDistance: -2.0,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Front Tables',
      description: 'The tables nearest the entrance. The first thing you want to recall each time.',
      position: [0, 1.0, -3.0],
    },
    {
      id: 2,
      title: 'The Window Tables',
      description: 'The cluster of tables by the side wall. Good for a short related set.',
      position: [-2.8, 1.0, -4.0],
    },
    {
      id: 3,
      title: 'The Corner Booth',
      description: 'The table off on its own. Reserve for the odd item that fits nowhere else.',
      position: [2.8, 1.0, -4.0],
    },
    {
      id: 4,
      title: 'The Counter',
      description: 'The service bar under the "COFFEE SHOP" sign. Anchor for the main point.',
      position: [0, 1.1, -5.5],
    },
    {
      id: 5,
      title: 'The Cup Shelf',
      description: 'The row of cups on the back wall. Use for a numbered sequence or steps.',
      position: [0, 2.0, -6.2],
    },
  ],
};
