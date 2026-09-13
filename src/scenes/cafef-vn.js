// Sàn Bảng Điện — cafef.vn as a trading floor.
//
// CafeF is the money paper, so it does not get a street. It gets the room the
// money is actually watched in: a Vietnamese brokerage floor, one wall of it a
// twenty-four-metre bảng điện, banked rows of red chairs facing it, and eight
// dealing bays down the flanks — one per section of the site — each with a
// desk and seven screens over it carrying that section's stories. Stand in
// front of one and read it; press E, or tap it, and the article opens on
// cafef.vn. In the corner by the doors there is a coffee counter, because the
// paper is named after one.
//
// LIKE PHỐ BÁO SÁNG, AND FOR THE SAME REASONS:
//
//   THERE IS NO GLB. The room is generated in the browser when the page opens
//   (src/scenesjs/cafef/), because a model exported last night would be
//   yesterday's session. `build` below is the hook Viewer calls instead of
//   loading `model`.
//
//   THERE ARE NO LOCI. Today's fourth Chứng khoán story is a different story
//   tomorrow and VCB closes at a different number, so there is nothing here
//   that holds still long enough to peg. Free move only, no tour, no badges.
//   This is the anti-library half of MemoryOS: a room to find out what you did
//   not know yet, not one to memorise.
//
// WHAT IS NEW HERE, AND IS THE REASON THE SCENE EXISTS SEPARATELY FROM THE
// STREET: the board carries real numbers. VN-INDEX, VN30, HNX and UPCOM plus
// sixteen of the largest listings, in the Vietnamese colours — green up, red
// down, yellow at reference (see src/scenesjs/cafef/market.js, which is very
// clear about what those numbers are and are not). And the room reads the
// trading clock: the bank is full at 09:30 and at the ATC, thinning through
// nghỉ trưa, nearly empty at seven in the evening, and at the weekend it is
// the board talking to empty chairs.
import { skyFor } from '../scenesjs/cafef/sky.js';
import { session } from '../scenesjs/cafef/market.js';
import { build } from '../scenesjs/cafef/index.js';

// Evaluated once, when the scene module is imported — i.e. at page load, which
// is exactly when `build` will read the same clock.
const sky = skyFor();
const now = session();

export default {
  // Standing in the centre aisle a few steps inside the doors, looking the
  // length of the hall at the board — which is the view the room is built for
  // and the first thing anyone walking in actually does.
  startView: {
    position: [0, 1.72, 3.2],
    lookAt: [0, 6.2, -39],
  },
  background: sky.bottom,
  // An interior fifty metres long with a lit city beyond the glass: the fog
  // has to soften the far wall without dissolving the board, and at night it
  // closes in because the only thing carrying that far is the board itself.
  fog: sky.night ? { near: 26, far: 120 } : { near: 40, far: 210 },
  lighting: {
    // The ceiling troughs are on whatever the hour — that is what a dealing
    // floor is — so the ambient floor here is much higher than the street's,
    // and only the top-up through the glass follows the sun.
    hemisphere: 0.5 + sky.level * 0.42,
    ambient: 0.44 + (now.open ? 0.06 : 0),
    ambientColor: 0xdfe9f5,
    sun: sky.level * 0.95,
    sunPosition: sky.sunPosition,
  },
  // One shadow map over a 44 x 52 m room lit mostly by strip lights is a
  // smear, and the bay lights are point lights the viewer's shadow rig does
  // not follow anyway. Cheaper and better without.
  shadows: false,
  loci: [],
  build,
};
