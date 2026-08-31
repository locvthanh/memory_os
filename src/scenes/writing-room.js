// Writing Room: an author's study - bookshelf on one wall, a desk with a
// typewriter under the window, hourglass and manuscripts nearby, a reading
// stool by the far wall. Six loci. Placeholder text - edit freely.
//
// Real positions come from the Locus_01..06 empties in the glb
// (scripts/build_glb.py); `position` is only the three.js-space fallback.
export default {
  walkthrough: {
    travelSeconds: 4,
    dwellSeconds: 6,
    eyeHeight: 1.3,
    // negative: camera sits on the room-centre side of each locus and looks
    // outward at it, instead of backing through the wall behind it.
    anchorDistance: -2.2,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Typewriter',
      description: 'The desk under the window. Whatever you are actively drafting lives here.',
      position: [0, 1.2, -3.6],
    },
    {
      id: 2,
      title: 'The Bookshelf',
      description: 'The full-height shelf along the wall. Good for reference material and sources.',
      position: [-2.2, 1.4, -2.5],
    },
    {
      id: 3,
      title: 'The Manuscript Pile',
      description: 'Loose pages stacked beside the desk. Use for drafts and unfinished threads.',
      position: [-0.8, 1.1, -3.6],
    },
    {
      id: 4,
      title: 'The Hourglass',
      description: 'The sand timer on the desk edge. Anchor for anything with a deadline.',
      position: [0.8, 1.1, -3.6],
    },
    {
      id: 5,
      title: 'The Reading Stool',
      description: 'The small stool and books by the far wall. Reserve for a single key quote.',
      position: [2.2, 1.0, -1.0],
    },
    {
      id: 6,
      title: 'The Window',
      description: 'The bright pane behind the desk. Use it for the big picture or the goal.',
      position: [0, 1.3, -4.0],
    },
  ],
};
