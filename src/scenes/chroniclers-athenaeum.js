// The Chroniclers' Athenaeum: a great library laid out from an illustrated
// floor plan — a barrel-ceilinged nave of book stacks with a domed reading
// room at its head, a west range of three closed rooms (cartography, alchemy,
// manuscript vault), and an east range holding a glass herbarium and a
// semicircular observatory.
//
// Rebuilt 2026-09-06 at roughly 1.65x the first version's linear scale:
// 110 x 116 m of floor, a 50 m wide nave with a 16 m central aisle, 3.1 m of
// clear floor between adjacent book stacks and 4.5 m cross-aisles, wing rooms
// 30 m deep and a 50 m rotunda. The first cut was 66 x 72 m and left barely
// 0.3 m between shelf runs — walkable on paper, not in practice. Furniture
// stayed at human scale through the rebuild; only the architecture grew, so
// the extra floor reads as room to walk rather than as a giant's library.
// The nave arcade also moved out against the side walls (it used to stand at
// x +-10.5, mid-floor) so the space between the stacks is unobstructed.
//
// Built in ChroniclersAthenaeum.blend. The Locus_01..13 empties are baked into
// the source .blend (collection 09_Loci), not injected by
// scripts/build_glb.py — see that script's SCENES dict, which has an empty
// list for this id. `position` below is only the three.js-space fallback if
// the glb ever loses them.
//
// The exported glb drops 08_Roofs and 07_Lighting (see build_glb.py
// DROP_COLLECTIONS): the viewer's one directional light comes from above and
// sets castShadow on every mesh, so a roofed model would render the whole
// interior black. What ships is an open-top dollhouse.
//
// `anchorFrom` does the heavy lifting here. Radial anchoring measures from the
// centroid of all loci, which for a building this shape lands near the middle
// of the nave and would shove the camera through walls to reach the wing
// rooms. Every locus instead names a point inside its own room on the side the
// camera should approach from, so with a negative `anchorDistance` the rig
// backs 7 m toward that point and always ends up standing in the same room as
// the thing it is looking at.
//
// Blender (x, y, z) maps to three.js (x, z, -y) under export_yup, so the
// building's north end (Blender +y) is three.js -z.
//
// Titles are the room names off the original plan; the descriptions say what
// each locus physically is, not what it should hold — they are placeholders
// waiting for real memory pegs.

// Camera-approach anchors, three.js space. Only x/z are read. Each names a
// point inside the locus's own room, on the side the camera should stand.
const NAVE_ENTRY = [0, 0, 34]; // inside the nave, looking back at the doors
const NAVE_AISLE = [0, 0, 25]; // aisle centreline beside the west stacks
const NAVE_S = [0, 0, 42];
const NAVE_MID = [0, 0, 30];
const NAVE_N = [0, 0, 8];
const VAULT = [-28, 0, 38];
const LAB = [-38, 0, 10];
const OBSERVATORY = [35, 0, 4];
const CARTOGRAPHY = [-40.5, 0, -2];
const ROTUNDA = [0, 0, -22];
const SCRIPTORIUM = [-40.5, 0, -38];
const MUSIC = [36, 0, -42];
const HERBARIUM = [39.5, 0, -17];

export default {
  walkthrough: {
    travelSeconds: 8,
    dwellSeconds: 7,
    // The rig parks the camera `eyeHeight` above the locus and looks down at
    // it, so tall subjects (Thoth, the armillary sphere, the telescope) put
    // their locus at mid-height rather than at the floor.
    eyeHeight: 2.0,
    // Negative: back off toward the locus's own anchorFrom, i.e. into the
    // room, instead of outward through its wall. Raised from -7 to -10 with
    // the 1.65x rebuild — the rooms got big enough that 7 m left the camera
    // standing on top of its subject.
    anchorDistance: -10,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Great Hall of Wisdom',
      description:
        'Just inside the south doors, looking back at the bronze-studded entrance between its two guardian statues. The threshold of the palace — the first thing in any sequence goes here.',
      position: [0, 3.6, 46],
      anchorFrom: NAVE_ENTRY,
    },
    {
      id: 2,
      title: 'The Main Hall',
      description:
        'The west range of book stacks, seen from the central aisle. Rows of shelves with coloured spines, reading tables and lamps between them. Good for long ordered lists.',
      position: [-14.2, 3.6, 25],
      anchorFrom: NAVE_AISLE,
    },
    {
      id: 3,
      title: 'The Athenaeum Owl',
      description:
        "A carved-wood owl, larger than life now, perched on its leafy branch atop a stone-capped plinth in the middle of the blue aisle runner \u2014 wide gold eyes, small tufted ears, wings folded close. Wisdom's other classic emblem, standing where the terrestrial globe once did. It is also a door: step past it and you arrive at the gate of the Village of the Sages, the terraced hill town where the thinkers themselves live. That scene's Observatory \u2014 a drum under a slit dome, watching the same dark the owl does \u2014 opens back to here.",
      position: [0, 7.4, 30],
      anchorFrom: NAVE_S,
      // Two-way door to the Village of the Sages: that scene's locus 8, the
      // Observatory, links back here. Owl and observatory are the same idea
      // twice — seeing in the dark — which is what makes the crossing stick.
      link: 'wisdom-village',
    },
    {
      id: 4,
      title: 'The Rare Manuscripts Vault',
      description:
        'Behind the round bronze vault door in the south-west corner: the Beowulf Codex open on a lit lectern, glass display cases on stone pedestals, iron grille cages along the outer wall.',
      position: [-40.5, 3.4, 38],
      anchorFrom: VAULT,
    },
    {
      id: 5,
      title: "The Alchemist's Lab",
      description:
        'The Phoenix Egg on its brass stand beside the stone hearth, with the long work benches of flasks and retorts, the distillation coil and the shelves of coloured jars behind it.',
      position: [-48, 3.1, 21],
      anchorFrom: LAB,
    },
    {
      id: 6,
      title: 'The Statue of Liberty',
      description:
        "Liberty Enlightening the World in patinated bronze — torch raised, tablet in hand, spiked crown catching the light — standing on her own brick-and-marble pedestal where Thoth's marble statue once stood, mid-aisle, halfway up the nave. She is the door to the White House: step past her and you arrive in its Ground Floor Library, at the first of the 47 presidents.",
      position: [0, 6.5, 14],
      anchorFrom: NAVE_MID,
      // Was `liberty-statue`, a scene id that never existed — the description
      // used to end "a doorway to somewhere not yet named". It is named now:
      // Liberty is the crossing point between the library and the White House,
      // and the White House's own Library (locus 1) links back here.
      link: 'the-white-house',
    },
    {
      id: 7,
      title: 'The Celestial Observatory',
      description:
        'The great brass telescope on its equatorial pier, under the half-dome, standing on a night-blue floor inlaid with stars and gold zodiac rings. Star-chart desks around the curve.',
      position: [35, 7.5, 20],
      anchorFrom: OBSERVATORY,
    },
    {
      id: 8,
      title: 'The Cartography Wing',
      description:
        'The sunken map pit with its great chart table and rolled maps, three floor globes on the teal carpet and hanging wall maps on their rods.',
      position: [-40.5, 2.4, -13.2],
      anchorFrom: CARTOGRAPHY,
    },
    {
      id: 9,
      title: 'Giant Armillary Sphere',
      description:
        'Five gold rings turning around a blue core on a stone plinth at the head of the nave, its axis tilted through the whole height of the hall. The last stop before the rotunda.',
      position: [0, 11, -6],
      anchorFrom: NAVE_N,
    },
    {
      id: 10,
      title: 'The Great Reading Room',
      description:
        'The rotunda: a tiered marble fountain at the centre of an inlaid medallion floor, two rings of curved reading desks with green-shaded lamps, bookcases all around the drum.',
      position: [0, 5.4, -41],
      anchorFrom: ROTUNDA,
    },
    {
      id: 11,
      title: "Scribe's Scriptorium",
      description:
        'The master tome open on its great lectern, with twelve slanted copying desks behind it — quills, inkwells, lit candles — and racks of scrolls along the wall.',
      position: [-40.5, 3.8, -52],
      anchorFrom: SCRIPTORIUM,
    },
    {
      id: 12,
      title: 'The Music & Oral History Chamber',
      description:
        "Orpheus's Lyre — the strung harp on the round dais — with a cello and lute beside it, a semicircle of seats facing them and the phonograph and its recording cylinders by the door.",
      position: [35, 4.2, -54.5],
      anchorFrom: MUSIC,
    },
    {
      id: 13,
      title: 'The Herbarium & Medicinal Garden',
      description:
        'The glass house on the east side: four raised planting beds around a flagstone cross-path, mandragora roots in red pots, citrus trees in tubs, the potting bench at the south end.',
      position: [47.5, 2.2, -27],
      anchorFrom: HERBARIUM,
    },
  ],
};
