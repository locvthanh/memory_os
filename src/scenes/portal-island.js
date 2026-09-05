// Portal Island: a floating island with a ring of eight portal gates around a
// central plaza, plus a cabin, garden and rocky outcrops. Replaces Luan Hoi
// Dai as the hub-of-gates scene — same "eight thresholds around a centre"
// idea, reskinned as a sunlit sky island instead of a dark cosmological
// altar.
//
// The road behind Gate 4 now carries on across a causeway to a second lobe of
// land holding the Rosetta language square — four language gates around the
// Rosetta Stone, which is where language-learning pegs live (loci 10–13).
//
// Real positions come from the Locus_* empties baked directly into
// PortalIsland.blend (not injected by scripts/build_glb.py — see that
// script's SCENES dict, which has an empty list for this id); `position`
// below is only the three.js-space fallback if the glb ever loses them.
//
// Titles and descriptions are still placeholder text — they name what each
// locus *is* rather than what it should hold. The language gates (10–13) in
// particular are waiting for real pegs.
//
// `anchorFrom` matters here: this scene has two separate clusters, so the
// centroid of all thirteen loci falls in the empty air between the island and
// the peninsula. Each locus names its own cluster centre instead, so the
// camera always backs off toward the plaza (or the square) and looks outward
// at its gate.
//
// The language loci sit at y 4.90 — the gates' mid-height, not head height.
// The rig parks the camera `eyeHeight` above the locus and looks down at it,
// so a locus at plinth level aims the shot at the gate's base and crops the
// roof off. Standing further back is not an option here: the square's centre
// is occupied by the Rosetta Stone, and a larger `anchorDistance` puts the
// camera inside it. Raising the aim point is what frames the whole gate.
const PLAZA = [-0.51, 0, -0.79]; // gate-ring centre, three.js space
const SQUARE = [-23.14, 0, -23.42]; // Rosetta square centre

export default {
  walkthrough: {
    travelSeconds: 5,
    dwellSeconds: 6,
    eyeHeight: 1.8,
    anchorDistance: -6,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'Phòng viết lách',
      description: 'Nơi lưu trữ các tác phẩm viết lách',
      position: [11.68, 3.41, -0.83],
      anchorFrom: PLAZA,
    },
    {
      id: 2,
      title: 'Seava Hồ Tràm',
      description: 'Cánh cổng dẫn đến Bungalow biển ở Seava Hồ Tràm',
      position: [6.6, 3.41, -7.9],
      anchorFrom: PLAZA,
    },
    {
      id: 3,
      title: 'Lux Garden',
      description: 'Chung cư Lux Garden',
      position: [-0.51, 3.41, -12.99],
      anchorFrom: PLAZA,
    },
    {
      id: 4,
      title: 'Phố ngoại ngữ Rosetta',
      description: 'Dẫn đến quảng trường ngoại ngữ Rosetta',
      position: [-7.62, 3.41, -7.9],
      anchorFrom: PLAZA,
    },
    {
      id: 5,
      title: 'xx',
      description: 'xx',
      position: [-12.7, 3.41, -0.83],
      anchorFrom: PLAZA,
    },
    {
      id: 6,
      title: 'xx',
      description: 'xx',
      position: [-7.55, 3.41, 6.25],
      anchorFrom: PLAZA,
    },
    {
      id: 7,
      title: 'Spaceship',
      description: 'Dự án công nghệ và phòng thí nghiệm cá nhân',
      position: [-0.51, 3.41, 11.31],
      anchorFrom: PLAZA,
    },
    {
      id: 8,
      title: 'xx',
      description: 'xx',
      position: [6.53, 3.41, 6.25],
      anchorFrom: PLAZA,
    },
    {
      id: 9,
      title: 'The Piano',
      description: 'Phòng âm nhạc',
      position: [7.99, 1.22, 10.51],
      anchorFrom: PLAZA,
    },
    {
      id: 10,
      title: 'हिन्दी — Hindi',
      description: 'Sandstone gate on the south side of the square, corner towers capped with chhatris under a stepped shikhara. First stop after the causeway. Placeholder — Hindi pegs go here.',
      position: [-23.14, 4.9, -12.62],
      anchorFrom: SQUARE,
    },
    {
      id: 11,
      title: '中文 — Chinese',
      description: 'Three-bay paifang on the west side, red posts under tiered teal roofs. Portal to the Chinatown Street scene.',
      position: [-33.94, 4.9, -23.42],
      anchorFrom: SQUARE,
      link: 'chinatown-street',
    },
    {
      id: 12,
      title: 'Français — French',
      description: 'Limestone triumphal arch on the north side, navy roofs and side pavilions. Placeholder — French pegs go here.',
      position: [-23.14, 4.9, -34.22],
      anchorFrom: SQUARE,
    },
    {
      id: 13,
      title: 'العربية — Arabic',
      description: 'Domed gate on the east side, merlon parapet and corner turrets. Last stop before the tour returns across the causeway. Placeholder — Arabic pegs go here.',
      position: [-12.34, 4.9, -23.42],
      anchorFrom: SQUARE,
    },
  ],
};
