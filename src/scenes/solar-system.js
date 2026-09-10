// The Solar System — the eight planets, the two belts and three dwarf planets,
// built at *readable* scale rather than true scale.
//
// The bargain the scene makes, and the thing worth remembering about it:
//   • planet sizes are TRUE relative to each other (Earth = 0.13 units, so
//     Jupiter really is 11x wider and Mercury really is 0.38x);
//   • distances are COMPRESSED by a square root — orbit radius = 6 * sqrt(AU) —
//     so Neptune sits 5.5x further out than Earth instead of 30x;
//   • the Sun is cheated small at radius 2.0. At true scale it would be radius
//     14.2 — wider than Mercury's whole orbit in this layout.
// Everything else is real: axial tilts, orbital inclinations, the Cassini
// Division, Uranus' rings standing vertical, the Kirkwood gaps.
//
// Camera: every locus anchors from [0,0,0] (the Sun) with a NEGATIVE
// anchorDistance, which parks the camera between the Sun and the body so each
// one is seen lit rather than backlit. The distances are per-locus because the
// subjects span 40:1 in radius — see Walkthrough.js.
//
// Source: blender_models/SolarSystem.blend; export prep in
// scripts/solar_system_export.py (the planets are procedurally shaded and have
// to be baked to textures before glTF can carry them).

const SUN = [0, 0, 0];

export default {
  // Open outside the whole system, looking down the ecliptic, before the tour
  // dives in to the Sun.
  startView: {
    position: [0, 46, 78],
    lookAt: [0, 0, -10],
  },
  walkthrough: {
    travelSeconds: 6,
    dwellSeconds: 11,
    eyeHeight: 1.0,
    anchorDistance: -3,
    loop: true,
  },
  background: 0x04050a,
  fog: false,
  stars: { count: 5200, radius: 780, size: 1.7, milkyWay: true },
  lighting: {
    // Almost no fill: space has no sky bounce. The Sun does the work.
    hemisphere: 0.08,
    ambient: 0.06,
    ambientColor: 0x8ea6c8,
    sun: 0.0,
    point: { position: SUN, intensity: 3.1, decay: 0, color: 0xfff3e2 },
  },
  labels: { worldSize: 0.5, offsetY: 0.9 },
  loci: [
    {
      id: 1,
      title: 'The Sun',
      description:
        'One star, and 99.86% of everything in the solar system by mass. Every planet, moon, asteroid and comet put together is the rounding error. It fuses about 600 million tonnes of hydrogen a second, and the light now leaving it will pass Neptune in four hours. Shown far too small here: at true scale it would be wider than Mercury’s entire orbit.',
      position: [0, 0, 0],
      anchorFrom: SUN,
      anchorDistance: -7.5,
      eyeHeight: 2.2,
      labelScale: 1.1,
      labelOffsetY: 2.9,
    },
    {
      id: 2,
      title: 'Mercury',
      description:
        'The smallest planet and the fastest — one year takes 88 days, one day takes 176. No atmosphere to hold heat, so the same rock swings from 430°C in sunlight to -180°C in shadow. Cratered like the Moon because nothing has ever weathered it.',
      position: [-3.232, 0.227, -1.852],
      anchorFrom: SUN,
      anchorDistance: -0.78,
      eyeHeight: 0.22,
      labelScale: 0.16,
      labelOffsetY: 0.13,
    },
    {
      id: 3,
      title: 'Venus',
      description:
        'Earth’s twin in size and nothing like it in anything else. A carbon-dioxide atmosphere 90 times heavier than ours traps enough heat to melt lead — 465°C, hotter than Mercury despite being further out. It also spins backwards, which is why its axial tilt here reads as 177°: the planet is upside down.',
      position: [4.327, 0.16, -2.699],
      anchorFrom: SUN,
      anchorDistance: -1.1,
      eyeHeight: 0.32,
      labelScale: 0.24,
      labelOffsetY: 0.26,
    },
    {
      id: 4,
      title: 'Earth and the Moon',
      description:
        'The only place with liquid water on its surface, and the only one whose moon is a quarter its own width — the Moon is over there at a distance compressed for the view; really it sits 30 Earth-widths away. The 23.4° tilt you can see is what makes seasons: not distance from the Sun, but which hemisphere leans toward it.',
      position: [-1.854, 0, -5.706],
      anchorFrom: SUN,
      anchorDistance: -1.75,
      eyeHeight: 0.5,
      labelScale: 0.3,
      labelOffsetY: 0.34,
    },
    {
      id: 5,
      title: 'Mars',
      description:
        'Half Earth’s width, rust-red from iron oxide, with polar caps of water and frozen CO2 that grow and shrink with its seasons — its tilt, 25°, is almost exactly Earth’s. It holds the tallest volcano in the solar system, Olympus Mons, about three times the height of Everest.',
      position: [3.477, 0.211, -6.537],
      anchorFrom: SUN,
      anchorDistance: -0.82,
      eyeHeight: 0.24,
      labelScale: 0.18,
      labelOffsetY: 0.15,
    },
    {
      id: 6,
      title: 'The Asteroid Belt',
      description:
        'Not a wrecked planet — a planet that never managed to form, because Jupiter’s gravity kept stirring the material too violently to stick together. Millions of bodies between 2.1 and 3.3 AU, and all of them together would make something smaller than the Moon. The gaps in the ring are the Kirkwood gaps, swept clean where an orbit resonates with Jupiter’s. The marker sits on Ceres, the largest body in the belt — and still far too small to pick out from here, which is rather the point.',
      position: [9.384, 0.628, -3.357],
      anchorFrom: SUN,
      anchorDistance: -2.6,
      eyeHeight: 1.0,
      labelScale: 0.4,
      labelOffsetY: 0.55,
    },
    {
      id: 7,
      title: 'Jupiter',
      description:
        'Two and a half times the mass of every other planet combined. No surface to land on — the bands are ammonia cloud decks racing in opposite directions, and the Great Red Spot is a storm wider than Earth that has been running for centuries. The four moons strung out beside it are the Galileans: Io, Europa, Ganymede, Callisto — the objects that proved, in 1610, that not everything orbits us.',
      position: [-9.334, 0.229, -10.007],
      anchorFrom: SUN,
      anchorDistance: -9.2,
      eyeHeight: 2.6,
      labelScale: 1.0,
      labelOffsetY: 2.2,
    },
    {
      id: 8,
      title: 'Saturn',
      description:
        'The rings are only about ten metres thick and made almost entirely of water ice, from dust grains to house-sized boulders — the dark line across them is the Cassini Division, a gap held open by the moon Mimas. Saturn itself is less dense than water. Titan, the large moon out past the rings, has a thick atmosphere and rivers of liquid methane.',
      position: [12.398, 0.598, -13.757],
      anchorFrom: SUN,
      anchorDistance: -7.4,
      eyeHeight: 2.4,
      labelScale: 0.9,
      labelOffsetY: 2.0,
    },
    {
      id: 9,
      title: 'Uranus',
      description:
        'Tipped over 98°, so it rolls around its orbit on its side — the rings standing vertically in front of you are the giveaway, and so are its moons, which orbit the same tilted plane. Something roughly Earth-sized probably hit it. Each pole gets 42 years of continuous daylight, then 42 years of night. The colour is methane absorbing red light.',
      position: [-0.917, 0.353, -26.266],
      anchorFrom: SUN,
      anchorDistance: -3.4,
      eyeHeight: 1.0,
      labelScale: 0.5,
      labelOffsetY: 0.85,
    },
    {
      id: 10,
      title: 'Neptune',
      description:
        'The last planet, and the only one found with mathematics before a telescope — Le Verrier predicted where it must be from wobbles in Uranus’ orbit, and it was there. Its winds are the fastest in the solar system, over 2,000 km/h. One Neptune year is 165 Earth years; it has completed a single orbit since its discovery in 1846. Triton, its big moon, orbits backwards, so it was captured rather than born there.',
      position: [-30.506, 0.381, -12.319],
      anchorFrom: SUN,
      anchorDistance: -2.6,
      eyeHeight: 0.8,
      labelScale: 0.45,
      labelOffsetY: 0.8,
    },
    {
      id: 11,
      title: 'Pluto and Charon',
      description:
        'Look back at the plane every planet shares — Pluto is well above it, on an orbit tilted 17°, the pale band running across your view, and part of why it was reclassified in 2006. Charon is half Pluto’s width; they orbit a point in empty space between them, so neither really circles the other. A Pluto year is 248 Earth years.',
      position: [-18.85, 9.633, -31.196],
      anchorFrom: SUN,
      anchorDistance: -0.44,
      eyeHeight: 0.12,
      labelScale: 0.1,
      labelOffsetY: 0.08,
    },
    {
      id: 12,
      title: 'The Kuiper Belt',
      description:
        'You are standing in it: a wide, thick disc of ice left over from the system’s formation, running from Neptune’s orbit out to about 50 AU, and the source of the short-period comets. Pluto is one of its residents. Further out still, on a 44°-tilted orbit of its own, is Eris — nearly Pluto’s size, and finding it in 2005 forced the question of what counts as a planet. From out here the Sun is just the brightest star in the sky.',
      position: [18.49, 2.6, 32.03],
      anchorFrom: SUN,
      anchorDistance: -6.0,
      eyeHeight: 1.6,
      labelScale: 0.9,
      labelOffsetY: 1.7,
    },
  ],
};
