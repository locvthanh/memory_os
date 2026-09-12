// Hutong Corner: a grey-brick Beijing alley that turns a corner. The tour
// walks north up the lane -- name plaque, lantern line, corner shop, the red
// courtyard gate and the spirit screen behind it, laundry, chess table,
// notice board, bikes, standpipe -- then turns east at the scholar tree and
// runs down the branch to the moon gate at the far end.
//
// Chosen as a memory room because everything in a hutong is a *different
// kind of object* at a *different height*: a stone plaque at eye level, red
// lanterns overhead, a fridge on the ground, a birdcage in a tree, wires at
// roof line. Nothing here can be mistaken for its neighbour.
//
// Scale note: the alley is 5.2 m wide, so the rig works in metres and every
// stop names its own camera stand. Each locus carries `anchorFrom` (the spot
// in the lane the camera stands on) plus a NEGATIVE `anchorDistance` equal to
// the distance from that spot to the peg -- together those place the camera
// exactly on the stand and aim it at the object, instead of letting the
// shared-centroid rig back it through a wall. `eyeHeight` is then the offset
// from the peg up (or down) to a 1.62 m eye line.
//
// Real positions come from the Locus_01..14 empties baked into
// models/hutong-corner.glb (collection 09_Loci in HutongCorner.blend).
// `position` is only the three.js-space fallback (Blender x,y,z -> x, z, -y).
//
// Every peg below is still blank: the titles name the object, the
// descriptions say what that object is shaped to hold. Replace the second
// sentence of each with real content when there is some.
export default {
  background: 0xbdd5e7,
  fog: { near: 26, far: 120 },
  lighting: { hemisphere: 0.85, sun: 2.1, shadowExtent: 40 },
  walkthrough: {
    travelSeconds: 5,
    dwellSeconds: 7,
    eyeHeight: 1.6,
    anchorDistance: -3,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Name Stone',
      description: 'The carved plaque at the mouth of the lane — 杏花胡同, Apricot Blossom Lane, with house number 17 beneath it. The doorway peg: whatever the whole set is called goes here.',
      position: [-2.5, 2.25, 2.5],
      anchorFrom: [0, 0, 2.5],
      anchorDistance: -2.5,
      eyeHeight: -0.63,
    },
    {
      id: 2,
      title: 'The Lantern Line',
      description: 'Five red lanterns strung across the alley on a sagging cord. Five slots in a row, overhead — good for anything that comes in a short ordered list.',
      position: [0, 3.2, -2.0],
      anchorFrom: [0, 0, 1.2],
      anchorDistance: -3.2,
      eyeHeight: -1.58,
    },
    {
      id: 3,
      title: 'The Corner Shop',
      description: 'The 小卖部 counter under its red-and-white awning: shelves of tins, a drinks fridge, crates and four red stools. A peg for stock, inventory, anything counted.',
      position: [2.35, 1.35, -4.6],
      anchorFrom: [-1.4, 0, -4.6],
      anchorDistance: -3.75,
      eyeHeight: 0.27,
    },
    {
      id: 4,
      title: 'The Red Gate',
      description: 'The courtyard gate — stone stoop, two drum stones, vermilion doors half open, couplets down each side. The threshold peg: a decision, a transition, a before-and-after.',
      position: [-2.9, 1.7, -8.1],
      anchorFrom: [0.7, 0, -8.1],
      anchorDistance: -3.6,
      eyeHeight: -0.08,
    },
    {
      id: 5,
      title: 'The Spirit Screen',
      description: 'The 影壁 standing just inside the gate with 福 on it, blocking the straight line in. A peg for whatever deflects, hides or protects — the thing between the outside and the inside.',
      position: [-6.1, 1.5, -8.1],
      anchorFrom: [-3.0, 0, -8.1],
      anchorDistance: -3.1,
      eyeHeight: 0.12,
    },
    {
      id: 6,
      title: 'The Laundry Line',
      description: 'Six pieces of washing pegged across the alley, each a different colour. Six labelled slots, side by side — good for a set whose members differ only by one attribute.',
      position: [0, 2.85, -11.5],
      anchorFrom: [0, 0, -8.4],
      anchorDistance: -3.1,
      eyeHeight: -1.23,
    },
    {
      id: 7,
      title: 'The Chess Table',
      description: 'A round stone table with a half-played 象棋 board, two stools and a thermos. The peg for anything adversarial, turn-based, or worked out between two sides.',
      position: [1.55, 0.85, -13.2],
      anchorFrom: [-0.8, 0, -13.2],
      anchorDistance: -2.35,
      eyeHeight: 0.77,
    },
    {
      id: 8,
      title: 'The Notice Board',
      description: 'The lane notice board, four curling papers pinned to green felt. A peg for rules, announcements, things posted rather than remembered.',
      position: [-2.45, 1.62, -15.0],
      anchorFrom: [0.5, 0, -15.0],
      anchorDistance: -2.95,
      eyeHeight: 0,
    },
    {
      id: 9,
      title: 'The Bikes and the Cart',
      description: 'Two bicycles against the wall and a loaded three-wheeler beside them. The peg for transport, movement, whatever carries something else.',
      position: [2.05, 0.7, -16.8],
      anchorFrom: [-0.4, 0, -16.8],
      anchorDistance: -2.45,
      eyeHeight: 0.92,
    },
    {
      id: 10,
      title: 'The Standpipe',
      description: 'The shared tap and its drain, with winter cabbages stacked beside it and coal briquettes beyond. The peg for a shared resource — something everyone in the lane draws from.',
      position: [-2.3, 0.7, -18.6],
      anchorFrom: [0.3, 0, -18.6],
      anchorDistance: -2.6,
      eyeHeight: 0.92,
    },
    {
      id: 11,
      title: 'The Scholar Tree',
      description: 'The old 国槐 at the turn, its roots in a stone kerb and its crown over both lanes. The pivot peg: it marks the point where the route changes direction.',
      position: [5.6, 3.0, -21.15],
      anchorFrom: [1.0, 0, -19.2],
      anchorDistance: -5.0,
      eyeHeight: -1.38,
    },
    {
      id: 12,
      title: 'The Birdcage',
      description: 'A wooden cage hung from a low limb, one bird inside. The peg for anything kept, constrained, or deliberately held in place.',
      position: [6.5, 2.35, -20.4],
      anchorFrom: [4.6, 0, -19.0],
      anchorDistance: -2.36,
      eyeHeight: -0.73,
    },
    {
      id: 13,
      title: 'The Power Pole',
      description: 'The pole halfway down the branch, three crossarms, a meter bank and wires running off in every direction. The peg for anything that fans out — dependencies, distribution, a hub.',
      position: [10.5, 3.0, -22.2],
      anchorFrom: [7.0, 0, -20.0],
      anchorDistance: -4.13,
      eyeHeight: -1.38,
    },
    {
      id: 14,
      title: 'The Moon Gate',
      description: 'The round doorway closing the far end, 通幽 above it and a willow showing through. The last peg, and the way onward: park here whatever the next thing to learn is.',
      position: [23.7, 1.3, -20.3],
      anchorFrom: [18.5, 0, -20.3],
      anchorDistance: -5.2,
      eyeHeight: 0.32,
    },
  ],
};
