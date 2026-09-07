// Wisdom Village — the layout pass. A terraced hillside: timber gate at the
// foot, the Founder's statue on the plaza, a switchback stone stair climbing
// five grassy terraces, and the open Rotunda of Assembly at the summit.
//
// Twelve building plots flank the stair, alternating left / right as the tour
// climbs, so tour order is literally altitude: Plot 01 at the gate, Plot 12 at
// the summit. Every house is a PLACEHOLDER, but each has a different
// silhouette, so the loci are already distinguishable before any thinker moves
// in. Titles name the silhouette; descriptions are placeholder peg notes and
// are meant to be REWRITTEN once a thinker is assigned to the plot.
//
// Real positions come from the Locus_01..12 empties baked into
// models/wisdom-village.glb (scripts/build_wisdom_village.py). `position` is
// only the three.js-space fallback (Blender x,y,z -> three x, z, -y).
//
// Anchoring: the default radial anchor measures from the centroid of all loci,
// which for a hill village points *uphill* and parks the camera behind each
// house. Instead every locus names its own `anchorFrom` — a point on the stair
// spine (x = 0) eight units downhill of the plot — so with a negative
// `anchorDistance` the camera backs onto the path below the house and takes it
// at a three-quarter angle, front and signboard both in frame.
const plot = (id, title, silhouette, side, terrace, position) => ({
  id,
  title,
  description:
    `${silhouette}. ${side} of the stair, ${terrace}. ` +
    'Open plot — no thinker assigned yet. Replace this note with the person ' +
    'who lives here and the ideas pegged to the house.',
  position,
  anchorFrom: [0, 0, position[2] + 8],
});

export default {
  // Opening shot: standing on the approach path outside the timber gate,
  // looking north through it at the Founder's statue and the stair beyond, so
  // the scene introduces itself the way a visitor would arrive. Without this
  // the scene opened at locus 1's anchor — already inside, face to face with
  // Plot 01. Blender (0, -72, 3) / aimed at (0, -20, 6.5); export_yup maps
  // Blender (x, y, z) to three.js (x, z, -y).
  startView: {
    position: [0, 3.0, 72],
    lookAt: [0, 6.5, 20],
  },
  walkthrough: {
    travelSeconds: 5,
    dwellSeconds: 7,
    eyeHeight: 2.2,
    anchorDistance: -20,
    loop: true,
  },
  loci: [
    plot(1, 'Plot 01 · The Portico', 'A columned Greek temple front on a stylobate', 'Left', 'plaza terrace', [-19, 3.4, 34]),
    plot(2, 'Plot 02 · The Lodge', 'A timber lodge with a balcony and a stone chimney', 'Right', 'plaza terrace', [19, 3.4, 34]),
    plot(3, 'Plot 03 · The Round Tower', 'A round stone tower under a conical roof', 'Left', 'plaza terrace', [-21, 3.4, 22]),
    plot(4, 'Plot 04 · The Glasshouse', 'A faceted glass barrel-vault greenhouse', 'Right', 'plaza terrace', [21, 3.4, 22]),
    plot(5, 'Plot 05 · The Tiered Hall', 'A two-tier East-Asian hall on a stone podium', 'Left', 'first terrace', [-21, 6.9, 8]),
    plot(6, 'Plot 06 · The Glass Cube', 'A modern glazed cube under a cantilevered slab', 'Right', 'first terrace', [21, 6.9, 8]),
    plot(7, 'Plot 07 · The Longhouse', 'A long barn with a clerestory ridge', 'Left', 'second terrace', [-21, 10.4, -4]),
    plot(8, 'Plot 08 · The Observatory', 'A drum under a slit dome', 'Right', 'second terrace', [21, 10.4, -4]),
    plot(9, 'Plot 09 · The Stepped Hall', 'A four-step stone ziggurat topped by a shrine', 'Left', 'third terrace', [-19, 13.9, -15.5]),
    plot(10, 'Plot 10 · The A-Frame', 'A steep glass-gabled A-frame on a timber deck', 'Right', 'third terrace', [19, 13.9, -15.5]),
    plot(11, 'Plot 11 · The Mill', 'A tapered windmill tower with four sails', 'Left', 'summit terrace', [-15, 17.4, -26.5]),
    plot(12, 'Plot 12 · The Pavilion', 'An open pavilion under a roof garden', 'Right', 'summit terrace', [15, 17.4, -26.5]),
  ],
};
