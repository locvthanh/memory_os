// Chinatown Street: a lantern-lit lane running east-west past a paifang gate,
// with two rows of shopfronts. The walkthrough zigzags down the street,
// stopping across from alternating shopfronts. Placeholder titles - edit to
// your own memory pegs.
//
// `position` is the three.js-space fallback; the real positions come from the
// Locus_01..06 empties injected into the glb by scripts/build_glb.py.
export default {
  walkthrough: {
    travelSeconds: 4,
    dwellSeconds: 6,
    eyeHeight: 1.4,
    // The lane runs along x; park the camera across the street from each
    // shopfront (see Walkthrough.js `sideView`) instead of the default
    // radial anchor, which would slide it up the street axis into open sky.
    sideView: { axis: 'x', distance: 8, height: 1.8 },
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Gate Shop',
      description: 'The first north shopfront, right beside the paifang gate. Everything a session starts with goes here.',
      position: [-9, 2.4, -3.5],
    },
    {
      id: 2,
      title: 'The Red Shopfront',
      description: 'The crimson facade with the lit sign, south side. Anchor for anything you want to stand out.',
      position: [-5, 2.4, 3.5],
    },
    {
      id: 3,
      title: 'The Lantern Stall',
      description: 'North side, under the strings of red lanterns. Good for lists of small, repeating items.',
      position: [-2, 2.4, -3.5],
    },
    {
      id: 4,
      title: 'The Crossing',
      description: 'Mid-street on the south side, where the road markings break. Anything that links two other ideas.',
      position: [2, 2.4, 3.5],
    },
    {
      id: 5,
      title: 'The Tea House',
      description: 'The quieter block on the north side. Reserve for calm or background context.',
      position: [5, 2.4, -3.5],
    },
    {
      id: 6,
      title: 'The Far Corner',
      description: 'The last shopfront on the south side, where the lamps fade out. Use it for conclusions and takeaways.',
      position: [9, 2.4, 3.5],
    },
  ],
};
