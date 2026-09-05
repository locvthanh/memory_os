// Chinatown Street: a lantern-lit lane running north-south past a paifang
// gate, with two rows of shopfronts. The walkthrough zigzags down the
// street, stopping across from alternating shopfronts, starting right by the
// gate and ending just past where the hanging lanterns begin. Placeholder
// titles - edit to your own memory pegs.
//
// Rebuilt 2026-09-05 against the new chinatown_street.blend source (see
// scripts/build_glb.py) -- this scene's street runs along Blender Y, which
// export_yup maps to three.js -z, so the walkthrough's long axis is 'z' here
// (the earlier ChinatownStreet.blend source ran along Blender X / three.js x
// instead).
//
// `position` is the three.js-space fallback; the real positions come from
// the Locus_01..06 empties injected into the glb by scripts/build_glb.py.
export default {
  walkthrough: {
    travelSeconds: 4,
    dwellSeconds: 6,
    eyeHeight: 1.4,
    // The lane runs along z; park the camera across the street from each
    // shopfront (see Walkthrough.js `sideView`) instead of the default
    // radial anchor, which would slide it up the street axis into open sky.
    sideView: { axis: 'z', distance: 6, height: 1.8 },
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Gate Shop',
      description: 'The shopfront right beside the paifang gate. Everything a session starts with goes here.',
      position: [3.5, 2.4, -41.8],
    },
    {
      id: 2,
      title: 'The Red Shopfront',
      description: 'The crimson facade across from the gate shop. Anchor for anything you want to stand out.',
      position: [-3.5, 2.4, -39.5],
    },
    {
      id: 3,
      title: 'The Lantern Stall',
      description: 'Midway down, under the strings of red lanterns. Good for lists of small, repeating items.',
      position: [3.5, 2.4, -26.2],
    },
    {
      id: 4,
      title: 'The Crossing',
      description: 'The opposite shopfront, where the lane starts to feel less crowded. Anything that links two other ideas.',
      position: [-3.5, 2.4, -21.8],
    },
    {
      id: 5,
      title: 'The Tea House',
      description: 'A quieter block near the street entrance. Reserve for calm or background context.',
      position: [3.5, 2.4, -8.95],
    },
    {
      id: 6,
      title: 'The Far Corner',
      description: 'The last shopfront before the lane opens up and the lanterns overhead give out. Use it for conclusions and takeaways.',
      position: [-3.5, 2.4, -4.32],
    },
  ],
};
