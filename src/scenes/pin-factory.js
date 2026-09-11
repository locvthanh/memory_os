// The Pin Factory — Adam Smith's division of labour, told as a side-by-side
// contrast on a low-poly Georgian waterfront in Kirkcaldy, Fife.
//
// The scene reads left to right along one street, and the tour walks it in
// that order:
//
//   1 Adam Smith's statue + The Wealth of Nations on a lectern
//   2 the lone pin-maker's cottage: one man, all 18 steps, 1 pin a day
//   3-12 the pin manufactory: ten workers at one long bench, one step each,
//        under numbered signs in Smith's own words, gold arrows on the floor
//        showing the work passing down the line
//   13 the tally board: 48,000 pins a day, 4,800 each
//   14 the yard: Smith's three reasons (a hand, an hourglass, a gear)
//   15 the quay: crates of PINS going aboard — the extent of the market
//   16 the open door on the pier: the questions nobody has settled
//
// Colour = station: each of the ten has its own colour on the sign board, the
// floor mat, the cap (or dress), the number disc on the bench and its badge.
//
// Source: blender_models/PinFactory.blend, generated through Blender MCP by
// blender_models/pin_factory_scenegen/ (pf_*.py). Locus_01..16 are baked into
// the .blend, so build_glb.py's SCENES entry is empty; export prep is in
// scripts/pin_factory_export.py. No recentring: the street is authored around
// the origin (x -48 .. 46). Every number below is three.js space, metres.
//
// Camera: every stop parks the camera exactly at anchorFrom (a negative
// anchorDistance = the horizontal distance to the locus), i.e. out in front of
// the subject on the street side, the same spot as the CAM_Lnn cameras in the
// .blend. The station stops stand 4.7 m in front of the bench, so the two
// neighbouring workers are in frame too: the line is the point.

const STATION = { anchorDistance: -4.7, eyeHeight: 1.35 };
const station = (x) => ({
  position: [x, 1.25, -1.7],
  anchorFrom: [x, 0, 3.0],
  ...STATION,
  // No tour badge: the station's own number (sign board + bench disc) is
  // Smith's step number, and a badge reading the tour index (3..12) beside it
  // would contradict it.
  hideLabel: true,
});

export default {
  // Open on the whole street from above the firth.
  startView: {
    position: [-3, 20, 42],
    lookAt: [-3, 0, -2],
  },
  walkthrough: {
    travelSeconds: 4.5,
    dwellSeconds: 12,
    eyeHeight: 1.35,
    anchorDistance: -4.7,
    loop: true,
  },
  background: 0xaecbe0,
  fog: { near: 90, far: 260 },
  lighting: {
    hemisphere: 0.9,
    ambient: 0.2,
    ambientColor: 0xfff1dd,
    sun: 1.3,
    // Street is ~95 m long, centred on the origin.
    shadowExtent: 55,
    // Brass wire, the steel pin mountain, the gold lettering.
    environment: true,
    environmentIntensity: 0.55,
    environmentColor: 0xe6ecf2,
  },
  labels: { worldSize: 0.42, offsetY: 0.9 },
  loci: [
    {
      id: 1,
      title: '1776 — Adam Smith and The Wealth of Nations',
      description:
        "Kirkcaldy, Fife: the harbour town where Adam Smith was born in 1723 and where he wrote much of An Inquiry into the Nature and Causes of the Wealth of Nations, published in March 1776. The book asks why some nations are rich, and its very first chapter answers: 'Of the Division of Labour'. The greatest improvement in the productive powers of labour, Smith says, comes from splitting work into small specialised jobs, and to prove it he picks 'a very trifling manufacture': the pin. The statue holds the book under one arm and holds the other hand out, as if to say: let me show you. The lectern beside him is open at Book I, Chapter 1. (From 2007 to 2020 the Bank of England printed this idea on its £20 note: Smith on one side with a drawing of workers in a pin factory.)",
      position: [-38, 2.6, -1],
      anchorFrom: [-37, 0, 6.6],
      anchorDistance: -7.67,
      eyeHeight: 0.55,
      labelPosition: [-38, 4.5, -1],
      labelColor: '#8a6d2f',
    },
    {
      id: 2,
      title: 'The lone pin-maker — one pin a day',
      description:
        "First, the world WITHOUT division of labour. One man has to do every step himself: draw the wire, straighten it, cut it, point it, grind it, make a head, fix the head, whiten it, paper it. Smith reckons a workman not trained in the trade, and without its machines, 'could scarce, perhaps, with his utmost industry, make one pin in a day, and certainly could not make twenty.' Look at his bench: a tiny version of every tool in the factory next door, all crowded together, and he has to put one down and pick up the next for each step. On the red cushion at the front sits his day's work: ONE pin. The boards on the wall say it: ONE MAN, ALL 18 STEPS. 1 PIN A DAY, certainly not 20.",
      position: [-28, 1.25, -2.3],
      anchorFrom: [-28, 0, 3.6],
      anchorDistance: -5.9,
      eyeHeight: 1.45,
      labelPosition: [-28, 2.45, -1.4],
      labelColor: '#6f6a60',
    },
    {
      id: 3,
      title: 'Station 1 — "One man draws out the wire"',
      description:
        "Now the manufactory: the same job split down one long bench, and Smith's own sentence is painted over it, one clause per sign. 'One man draws out the wire': brass wire from the big gold coil is pulled through a hole in a hardened iron drawplate (the dark block), which squeezes it thinner; wound on the drum and pulled through smaller and smaller holes, it ends up pin-thin. He does nothing else all day. Everything he makes goes into the tray on his right and on to worker 2. Follow the gold arrows on the floor: the work flows left to right, and nobody walks anywhere.",
      ...station(-15.5),
    },
    {
      id: 4,
      title: 'Station 2 — "another straights it"',
      description:
        "Wire comes off the drum curled. Worker 2 pulls it through a zig-zag of iron pegs set in a board (the straightening board), and it comes out the far side dead straight. The tray on his right fills with long straight rods. It is a job you could learn in an afternoon and do a thousand times a day, which is exactly Smith's point.",
      ...station(-11.9),
    },
    {
      id: 5,
      title: 'Station 3 — "a third cuts it"',
      description:
        "Worker 3 feeds the straight rods into the big bench shears and chops them into short pieces, each long enough for a pin (in real workshops, first for a few pins, cut again later). One motion, over and over: the uncut rods lie to her left, the short pieces pile up in the tray on her right. Note that she is a woman: pin-making employed many women and children, because each step was so small and light.",
      ...station(-8.3),
    },
    {
      id: 6,
      title: 'Station 4 — "a fourth points it"',
      description:
        "Worker 4 holds a whole bundle of pieces against a turning grindstone (the big grey wheel on the crank) and grinds the points, a handful at a time, while the sparks fly. A specialist gets fast at this because he feels the angle in his hands: Smith's first reason, dexterity (see stop 14).",
      ...station(-4.7),
    },
    {
      id: 7,
      title: 'Station 5 — "a fifth grinds it at the top for receiving the head"',
      description:
        "The other end of the pin gets its own specialist. Worker 5 grinds the blunt top smooth on a smaller, finer sandstone wheel, so the head will sit on it. Two grinders side by side, each doing one end: that is how finely Smith's workshop divides the job.",
      ...station(-1.1),
    },
    {
      id: 8,
      title: 'Station 6 — "to make the head requires two or three distinct operations"',
      description:
        "An 18th-century pin head was not cast: it was a tiny ring of wire. Worker 6 spins fine wire into a tight spiral round a spindle (the gold coil on the iron rod, turned by the crank), then cuts the spiral into little rings of a couple of turns each. The heap of tiny gold rings on the bench is a heap of heads. Spinning, cutting and sorting are separate operations: one of the places where one worker does two or three of Smith's eighteen.",
      ...station(2.5),
    },
    {
      id: 9,
      title: 'Station 7 — "to put it on is a peculiar business"',
      description:
        "Worker 7 slips a head ring over the top of each pin and sets it in the die (the iron block); the heavy iron weight hanging in the tall wooden frame drops onto it when he works the treadle with his foot, clamping the head on. 'Peculiar' here means special, a trade of its own: it takes a practised eye and foot, and the heads in the tray on his right are the first real pins in the line.",
      ...station(6.1),
    },
    {
      id: 10,
      title: 'Station 8 — "to whiten the pins is another"',
      description:
        "Brass pins are yellow. To make them look like silver they were boiled in a copper pan with tin (and cream of tartar), which left a thin white coat of tin on every pin. Worker 8 tends the pan on its little furnace: glowing fire door, steam rising, ladle in the pan, bars of tin on the bench. The tray on his right holds the first white pins.",
      ...station(9.7),
    },
    {
      id: 11,
      title: 'Station 9 — polishing in bran',
      description:
        "Smith doesn't name this one, but the French Encyclopédie's list of pin-making operations (the most likely source of Smith's 'eighteen') does: the wet, tinned pins are tumbled in a barrel of bran to dry and polish them. Worker 9 turns the barrel with its crank; the sack of bran sits beside it. After this the pins shine.",
      ...station(13.3),
    },
    {
      id: 12,
      title: 'Station 10 — "it is even a trade by itself to put them into the paper"',
      description:
        "Pins were sold stuck in rows in a folded paper. Worker 10 pricks the paper with a comb of needles so the holes line up, then sets the pins in, row by row (the white sheet with its rows of pins), and stacks the finished pin papers: the rainbow pile. The last step of the line, and in Smith's words a whole trade. Ten workers, one job each; count the stops behind you: that's the eighteen operations shared among ten people.",
      ...station(16.9),
    },
    {
      id: 13,
      title: 'The tally — 48,000 pins a day',
      description:
        "Smith: 'I have seen a small manufactory of this kind where ten men only were employed, and where some of them consequently performed two or three distinct operations.' Though poor and badly equipped, they made 'upwards of twelve pounds of pins in a day', and a pound holds 'upwards of four thousand pins of a middling size'. So: 10 men, 48,000 pins a day, which is 4,800 pins each. Alone, each could not have made twenty, perhaps not one: 'certainly not the two hundred and fortieth, perhaps not the four thousand eight hundredth part'. On the chalkboard: the sum. Below it: a crate overflowing with a silver mountain of pins, stacks of pin papers, and a balance weighing out the 12 lb.",
      position: [20.2, 1.75, -2.8],
      anchorFrom: [20, 0, 3.2],
      anchorDistance: -6.0,
      eyeHeight: 0.85,
      labelPosition: [20.3, 3.7, -3.9],
      labelColor: '#8a6d2f',
    },
    {
      id: 14,
      title: "Why? Smith's three reasons",
      description:
        "Smith gives exactly three causes of the great increase. 1 DEXTERITY (the gold hand): doing one simple task all day makes you very good at it. His example is nails: a smith who has never made nails can make perhaps two or three hundred a day, 'and those too very bad ones', while boys who have done nothing else can make over 2,300 a day each. 2 NO TIME LOST (the hourglass): nobody wastes time walking between jobs or changing tools; Smith says a man who switches tasks 'saunters a little'. 3 MACHINES (the gear): when your whole attention is on one small task, you are likely to find a machine to do it. His example: a boy minding a steam engine who tied a string to the valve so it would open by itself, and he could go and play.",
      position: [28.5, 1.75, -1],
      anchorFrom: [28.5, 0, 7.4],
      anchorDistance: -8.4,
      eyeHeight: 1.15,
      labelPosition: [28.5, 4.1, -2.6],
      labelColor: '#8a6d2f',
    },
    {
      id: 15,
      title: 'The extent of the market',
      description:
        "Who buys 48,000 pins a day? Not Kirkcaldy. Book I, Chapter 3: 'the division of labour is limited by the extent of the market.' A big factory only pays if it can sell far beyond its own town, and that needs roads, rivers and above all ships: Smith notes that industry grew first along coasts and navigable rivers, where water carriage opens the whole world as a market. Here the hand cart brings the crates of PINS to the quay, the crane swings one aboard, and the ship's side reads LONDON · LISBON · RIGA. (Chapter 2 adds where it all comes from: our 'propensity to truck, barter, and exchange one thing for another'.)",
      position: [38, 2, -2],
      anchorFrom: [31, 0, 6.2],
      anchorDistance: -10.78,
      eyeHeight: 1.6,
      labelPosition: [33.3, 3.0, 2.2],
      labelColor: '#8a6d2f',
    },
    {
      id: 16,
      title: 'The open door — what nobody has settled',
      description:
        "Two questions wait on the pier. DID SMITH EXAGGERATE? Smith says he saw a small manufactory himself, but his 'eighteen operations' match the French Encyclopédie's article on pins (1755), itself compiled from older reports, and some economic historians who went back to the French sources argue that a skilled all-round pin-maker made far more than one to twenty pins a day, so the real gain was much smaller than Smith's hundreds or thousands of times. WHAT DOES THE WORK DO TO THE WORKER? Smith himself warned, in Book V, that a man who spends his life on a few simple operations 'generally becomes as stupid and ignorant as it is possible for a human creature to become', and he wanted public schooling to push back. Marx built his idea of alienation on it; today machines do every step in a pin factory. The door is open: which way does specialisation take us?",
      position: [40, 1.7, 9],
      anchorFrom: [40, 0, 15.6],
      anchorDistance: -6.6,
      eyeHeight: 0.9,
      labelPosition: [40, 4.5, 9],
      labelColor: '#b8902f',
    },
  ],
};
