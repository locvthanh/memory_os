// The Misty Valley: an empty palace at landscape scale. A Tolkien-flavoured
// river valley — ridged peaks under snow, a ruined watchtower on a bluff, a
// three-arch bridge, a ring of standing stones, pine woods and boulder fields.
// Nothing here is a place from the books or the films; every landmark is an
// invented one, chosen to be big, silhouetted and impossible to confuse with
// its neighbour.
//
// The tour walks south to north, up the valley: the ford at the mouth, the
// stones on the east knoll, the tower, the bridge, the west wood, the east
// moor, the gorge, and finally the snow peak at the head of the range.
//
// Scale note: this scene is ~900 x 1,100 m and the peaks stand 470 m, so the
// rig works in tens of metres, not metres — every locus carries its own
// anchorDistance/eyeHeight, all negative distances so the camera stays on the
// valley side of each landmark and looks outward at it rather than backing
// into a mountain. Fog is pushed out to match.
//
// Real positions come from the Locus_01..08 empties baked into
// models/misty-valley.glb (collection 09_Loci in LOTR_MistyValley.blend).
// `position` is only the three.js-space fallback (Blender x,y,z -> three x, z, -y).
//
// Every peg below is still blank — the titles name the landmark, the
// descriptions say what each one is good for holding. Replace the second
// sentence of each with real content when there is some.
export default {
  background: 0x9ec4e0,
  fog: { near: 260, far: 1750 },
  lighting: { hemisphere: 0.75, sun: 2.2, shadowExtent: 520 },
  walkthrough: {
    travelSeconds: 7,
    dwellSeconds: 8,
    eyeHeight: 14,
    anchorDistance: -70,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Ford',
      description:
        'Where the river runs shallow at the mouth of the valley — the way in. Anchor for beginnings: the first item, the opening move.',
      // positive: the camera stands SOUTH of the ford and looks north up the
      // valley, so the opening shot has the whole range behind the water.
      position: [17, 2, 0],
      anchorDistance: 90,
      eyeHeight: 22,
    },
    {
      id: 2,
      title: 'The Standing Stones',
      description:
        'Eight stones on the east knoll, one of them fallen. Use it for a fixed set of things — a list with a known count, one of which is the exception.',
      position: [118, 11, -70],
      anchorDistance: -48,
      eyeHeight: 16,
    },
    {
      id: 3,
      title: 'The Watchtower',
      description:
        'A broken tower on a 44 m bluff, open to the sky, its stair still climbing the inside wall. The most visible thing in the valley — reserve it for the single item that must not be lost.',
      position: [-78, 58, -185],
      anchorDistance: -95,
      eyeHeight: 22,
    },
    {
      id: 4,
      title: 'The Bridge of Three Arches',
      description:
        'The old stone crossing, its parapet half gone. Good for anything that joins two things — a transition, a translation, a cause and its effect.',
      position: [39, 10, -252],
      anchorDistance: -75,
      eyeHeight: 20,
    },
    {
      id: 5,
      title: 'The West Wood',
      description:
        'Dark pine climbing the western slope to the treeline. Use it for the many-of-a-kind: a set too large to count, where only the shape of the whole matters.',
      position: [-190, 55, -300],
      anchorDistance: -95,
      eyeHeight: 30,
    },
    {
      id: 6,
      title: 'The East Moor',
      description:
        'Open ground across the river, strewn with glacial boulders. Good for loose, unordered items — things that belong together but not in sequence.',
      position: [210, 21, -150],
      anchorDistance: -65,
      eyeHeight: 18,
    },
    {
      id: 7,
      title: 'The Gorge',
      description:
        'The cleft at the head of the valley where the river comes down between two walls — the only way north. Anchor for a bottleneck: the constraint, the one step everything else has to pass through.',
      position: [10, 60, -520],
      anchorDistance: -260,
      eyeHeight: 45,
    },
    {
      id: 8,
      title: 'The Snow Peak',
      description:
        'The highest summit of the range, 470 m and white above the snowline, seen from half a kilometre out. Reserve it for the goal — the thing the whole sequence is climbing towards.',
      position: [-104, 428, -815],
      anchorDistance: -460,
      eyeHeight: -170,
    },
  ],
};
