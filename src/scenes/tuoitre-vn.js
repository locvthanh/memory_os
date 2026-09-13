// Phố Báo Sáng — tuoitre.vn as a street you can walk down.
//
// Eight alleys open off a hundred metres of Saigon shophouse, one per section
// of the paper. Each has a painted gate and a glazed bảng tin — the public
// notice case you still find bolted to walls all over Vietnam — with that
// section's stories pinned inside it as newsprint, newest nearest the street.
// Stand in front of one and read it; press E, or tap it, and the real article
// opens on tuoitre.vn.
//
// TWO THINGS ARE UNUSUAL ABOUT THIS SCENE, and both follow from the content
// being today's news rather than something remembered:
//
// 1. THERE IS NO GLB. Every other 3D scene here is a Blender model loaded
//    through GLTFLoader. This one is generated in the browser when the page
//    opens — see src/scenesjs/tuoitre/ — because a model exported last night
//    would be yesterday's paper. `build` below is the hook Viewer calls
//    instead of loading `model`; a scene that has both is not a thing.
//
// 2. THERE ARE NO LOCI, like glacier-deck. A memory palace wants objects that
//    hold still: today's fourth Thời sự story is a different story tomorrow,
//    so pegging anything to it would be pegging to sand. What this room is for
//    is the other half of MemoryOS — the anti-library, the place you go to find
//    out what you did not know yet. So: free move only, no tour, no badges.
//
// The light is not authored either. It is whatever hour it is in Vietnam at
// the moment you open the page (src/scenesjs/tuoitre/sky.js), so the street
// arrives at dawn, at noon or under the lane bulbs depending on when you walk
// in — and the shop windows, the lamps and the page lighting all follow it.
import { skyFor } from '../scenesjs/tuoitre/sky.js';
import { build } from '../scenesjs/tuoitre/index.js';

// Evaluated once, when the scene module is imported — i.e. at page load, which
// is exactly when `build` will read the same clock.
const sky = skyFor();

export default {
  // Standing in the road at the mouth of the street, a little to the stall
  // side and looking slightly across, so the opening frame holds the three
  // things that say what this place is: the sạp báo on the right, the băng rôn
  // and its ticker overhead, and the first painted gate down on the left.
  startView: {
    position: [3.1, 1.72, 13.2],
    lookAt: [-1.2, 2.5, -12],
  },
  background: sky.bottom,
  // A street is a corridor: the fog has to close the far end without eating
  // the gate you are standing at. Night pulls both in hard, because the only
  // light down there is bulbs.
  fog: sky.night ? { near: 14, far: 96 } : { near: 32, far: 210 },
  lighting: {
    hemisphere: 0.35 + sky.level * 0.55,
    ambient: sky.night ? 0.2 : 0.34,
    ambientColor: sky.sun,
    sun: sky.level * 1.55,
    sunPosition: sky.sunPosition,
  },
  // The street is ~4,000 merged boxes in one mesh spanning 130 m; a single
  // shadow map over that is a smear, and the lane bulbs are point lights the
  // viewer's shadow rig does not follow anyway. Cheaper and better without.
  shadows: false,
  loci: [],
  build,
};
