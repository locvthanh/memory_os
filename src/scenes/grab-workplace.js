// The Green Court -- Tony's Grab workplace as a memory palace.
//
// Model: blender_models/GrabCourtyard.blend, built by
// blender_models/grab_scenegen/grab_*.py; export prep in
// scripts/grab_workplace_export.py. Plan: docs/grab-workplace-scene.md.
//
// THE ONE RULE THE SCENE ENCODES: the centre is what matters now, the wings
// are where the work lives. Anything that changes week to week -- priorities,
// the todo board, the site lead's view -- is in the court where every wing
// mouth can see it. Anything durable -- the six areas, their charters, their
// meeting rooms -- is out in a wing behind a door.
//
// Layout: a hexagonal court (apothem 11 m) with a wing off each of its six
// EDGES and one piece of court furniture on each of its six VERTICES, so
// walking clockwise alternates corner, wing, corner, wing. Wings, clockwise
// from north: Tech Infra (the org he belongs to), VN R&D (the site he leads),
// Finapps, UCM, Temporal, Web Platforms (the four teams he manages). Each wing
// is a portal with the name and charter, a team room, one plinth with that
// area's peg, a glass partition, and its own meeting room.
//
// Loci 2, 6 and 10 -- the obelisk's five slots, the Now/Next/Waiting columns
// and the balcony desk -- carry NO baked content on purpose: priorities change
// weekly and live in his head, so the slots are the mnemonic, not their
// contents.
//
// Camera: interior scene, so anchorDistance is NEGATIVE everywhere (the rig
// sits on the court side of each locus and looks outward). Wing gates stand
// off -6.0, pegs -4.2, meeting rooms -4.0. The obelisk sits on the centroid
// and so has no radial direction of its own -- it names `anchorFrom` a point
// due south instead, which puts the camera in the court looking north past the
// obelisk to the Tech Infra arch.
//
// Locus_01..25 are baked into the .blend (collection 09_Loci); build_glb.py's
// SCENES entry is empty. Every number below is three.js space, metres, and is
// generated from grab_layout.py by grab_scenegen/make_scene_js.py -- keep the
// two in step.

export default {
  // Come in high over the south side with the whole hexagon in frame.
  startView: {
    position: [0, 48, 74],
    lookAt: [0, 3, 0],
  },
  walkthrough: {
    travelSeconds: 4.5,
    dwellSeconds: 17,
    eyeHeight: 0.75,
    anchorDistance: -6.0,
    loop: true,
  },
  background: 0xc4d5dd,
  fog: { near: 74, far: 260 },
  lighting: {
    hemisphere: 0.95,
    ambient: 0.32,
    ambientColor: 0xfff3e6,
    sun: 1.05,
    // The building is ~60 m across, centred on the origin.
    shadowExtent: 44,
    environment: true,
    environmentIntensity: 0.5,
    environmentColor: 0xe9eef2,
  },
  labels: { worldSize: 0.45, offsetY: 1.5 },
  loci: [
    {
      id: 1,
      title: 'Reception & the Building Plan',
      description:
        'You come in at the corner between Web Platforms and Tech Infra. Behind ' +
        'the desk, the plan of the whole building is on the wall: a green hexagon ' +
        'with six wings off its six edges. Learn it here and you never need it ' +
        'again. THE CENTRE IS WHAT MATTERS NOW, THE WINGS ARE WHERE THE WORK ' +
        'LIVES. Six wings because there are six things: one org you belong to ' +
        '(Tech Infra), one site you lead (VN R&D), and four teams you manage ' +
        '(Finapps, UCM, Temporal, Web Platforms). Walk clockwise and you ' +
        'alternate court corner, wing, court corner, wing, all the way back to ' +
        'here.',
      position: [-5.1, 1.42, -8.83],
      anchorDistance: -6,
    },
    {
      id: 2,
      title: 'The Priority Obelisk',
      description:
        'Dead centre of the court, on the green medallion: a glass column with ' +
        'five lit slots, numbered 01 at the top down to 05. The plates are ' +
        'deliberately blank. Your priorities change week to week and a list baked ' +
        'into the geometry would be a lie by Friday, so the mnemonic is the five ' +
        'slots, not their contents. Fill them from memory, top down, before you ' +
        'walk on. If you cannot fill five, that is the finding.',
      position: [0, 2.45, 0],
      anchorDistance: -9,
      eyeHeight: 0.6,
      anchorFrom: [0, 0, 20],
    },
    {
      id: 3,
      title: 'The Infra Concourse',
      description:
        'Due north, the Grab-green portal: TECH INFRA, \'the platform under ' +
        'everything\'. The one wing you are a member of rather than one you run. ' +
        'Everything else in this building hangs off it -- it is why the other ' +
        'five wings can be identical in shape and still mean different things.',
      position: [0, 2.15, -13],
      anchorDistance: -6,
    },
    {
      id: 4,
      title: 'The Building on the Plinth',
      description:
        'On the plinth in the middle of the Infra floor: a model of this whole ' +
        'building, hex court and six wings, in miniature, down to the obelisk. ' +
        'That is what infrastructure is -- it carries everything, including the ' +
        'room you are standing in. If you can picture the model you can picture ' +
        'the org.',
      position: [0, 1.62, -16.5],
      anchorDistance: -4.2,
    },
    {
      id: 5,
      title: 'The Infra Review',
      description:
        'Tech Infra\'s meeting room at the end of the wing. The forum where your ' +
        'wing reports UP rather than in: platform standards, architecture, the ' +
        'decisions taken above your four teams and handed to them. The only ' +
        'meeting room in the building whose agenda you do not set.',
      position: [0, 1.5, -25],
      anchorDistance: -4,
    },
    {
      id: 6,
      title: 'Now / Next / Waiting',
      description:
        'First corner clockwise, back in the court. Three standing panels: NOW in ' +
        'green, NEXT in teal, WAITING in amber, four blank cards on each. WAITING ' +
        'is the column that earns its place -- work parked on somebody else is ' +
        'the work that goes quiet and then goes wrong. Blank by design, like the ' +
        'obelisk.',
      position: [4.75, 1.7, -8.23],
      anchorDistance: -5.6,
    },
    {
      id: 7,
      title: 'The Site Floor',
      description:
        'North-east wing, teal portal: VN R&D, \'the site\'. The one wing whose ' +
        'unit is a PLACE, not a team. Everyone in this building who sits in ' +
        'Vietnam is also on this floor, whichever wing their work belongs to -- ' +
        'which is exactly the double-counting that makes site leadership a ' +
        'separate job.',
      position: [11.26, 2.15, -6.5],
      anchorDistance: -6,
    },
    {
      id: 8,
      title: 'The Hiring Board',
      description:
        'Fifteen tiles on a board on the plinth: filled green tiles are people, ' +
        'hollow amber outlines are the roles still open. Headcount made visible, ' +
        'and the gaps are the half you are accountable for. Count the hollows ' +
        'before you walk on.',
      position: [14.29, 1.62, -8.25],
      anchorDistance: -4.2,
    },
    {
      id: 9,
      title: 'The Town Hall',
      description:
        'The longest table in the building, ten chairs, at the end of the VN R&D ' +
        'wing. The one room sized for the whole site rather than one team -- ' +
        'all-hands, site news, the things everyone hears at once so nobody hears ' +
        'them twice differently.',
      position: [21.65, 1.5, -12.5],
      anchorDistance: -4,
    },
    {
      id: 10,
      title: 'The Site Lead\'s Balcony',
      description:
        'A mezzanine four metres above the court, between the VN R&D and Finapps ' +
        'wings, reached by the spiral stair. A desk, a rail, and a sightline down ' +
        'every wing mouth at once. This is the site lead\'s job as architecture: ' +
        'from up here you can see all six wings and none of them from the inside. ' +
        'Deliberately empty of content -- what you are watching from this rail ' +
        'changes faster than the building does.',
      position: [10.8, 4.8, 0],
      anchorDistance: -5.2,
      eyeHeight: 0.4,
    },
    {
      id: 11,
      title: 'Finapps',
      description:
        'South-east wing, amber portal: FINAPPS, \'money inside the app\'. The team ' +
        'where a bug is not a degraded experience, it is somebody\'s money, which ' +
        'is why its peg is the only one in the building that has to balance.',
      position: [11.26, 2.15, 6.5],
      anchorDistance: -6,
    },
    {
      id: 12,
      title: 'The Ledger',
      description:
        'On the plinth: a brass balance. A stack of coins on one pan, a paper ' +
        'receipt tape unrolling from the other. Money inside the app works only ' +
        'while the two sides agree, and the whole domain -- ledgers, ' +
        'reconciliation, settlement -- is that one sentence made into an object.',
      position: [14.29, 1.62, 8.25],
      anchorDistance: -4.2,
    },
    {
      id: 13,
      title: 'The Ledger Room',
      description:
        'Finapps\' meeting room. The room where the number on the screen and the ' +
        'number in the system are made to be the same number.',
      position: [21.65, 1.5, 12.5],
      anchorDistance: -4,
    },
    {
      id: 14,
      title: 'The Quiet Room',
      description:
        'A glass booth in the court between Finapps and UCM, two chairs facing ' +
        'each other, a low table, \'1:1\' over the door. The only room in the ' +
        'building sized for exactly two people -- and it sits in the court, not ' +
        'in a wing, because your 1:1s cross all six and belong to none of them.',
      position: [5, 1.5, 8.66],
      anchorDistance: -5.2,
    },
    {
      id: 15,
      title: 'UCM',
      description:
        'Due south, blue portal: UCM, \'every message out\'. The team that owns the ' +
        'last hop to the user -- push, in-app, email, SMS -- and therefore owns ' +
        'the blast radius when anything upstream is wrong.',
      position: [0, 2.15, 13],
      anchorDistance: -6,
    },
    {
      id: 16,
      title: 'The Switchboard',
      description:
        'On the plinth: one jack going in at the centre of a dark disc, six ' +
        'coloured cords arcing out to six little screens on stalks. One upstream ' +
        'event, many channels. The fan-out is the easy half; deciding which of ' +
        'the six a message does NOT go to is the hard half.',
      position: [0, 1.62, 16.5],
      anchorDistance: -4.2,
    },
    {
      id: 17,
      title: 'The Signal Room',
      description:
        'UCM\'s meeting room. Where the question is always the same one: who ' +
        'receives this, and who has already received three of these today.',
      position: [0, 1.5, 25],
      anchorDistance: -4,
    },
    {
      id: 18,
      title: 'The Standup Circle',
      description:
        'A green ring on the floor of the court between UCM and Temporal: six ' +
        'stools, one high table, nothing with a back on it. Cadence lives in the ' +
        'court because it belongs to all six wings, and it is at standing height ' +
        'on purpose so it stays short.',
      position: [-4.6, 1.05, 7.97],
      anchorDistance: -5.6,
      eyeHeight: 0.95,
    },
    {
      id: 19,
      title: 'Temporal',
      description:
        'South-west wing, violet portal: TEMPORAL, \'work that never forgets\'. ' +
        'Durable execution -- the workflow engine your platform runs long-lived, ' +
        'restartable work on.',
      position: [-11.26, 2.15, 6.5],
      anchorDistance: -6,
    },
    {
      id: 20,
      title: 'The Escapement',
      description:
        'On the plinth: a brass ratchet wheel with a pawl dropped into one tooth, ' +
        'and a tape spool paying out beside it. Stop it for a week, cut the ' +
        'power, come back -- it still knows exactly which tooth it was on. That ' +
        'is the whole promise of durable execution in one picture.',
      position: [-14.29, 1.62, 8.25],
      anchorDistance: -4.2,
    },
    {
      id: 21,
      title: 'The Clock Room',
      description:
        'Temporal\'s meeting room. The room for the long-running things: retries, ' +
        'timers, and the workflows that outlive the process that started them.',
      position: [-21.65, 1.5, 12.5],
      anchorDistance: -4,
    },
    {
      id: 22,
      title: 'The Open Door',
      description:
        'A free-standing door in the court between Temporal and Web Platforms, ' +
        'ajar, opening onto warm light and nothing else. It leads nowhere on ' +
        'purpose: this is the antilibrary door, everything you do not yet know ' +
        'about your own org. Every time you pass it, name one thing that is ' +
        'behind it -- a system you have never read, a person you have never ' +
        'spoken to, a number you have never checked.',
      position: [-10.6, 1.7, 0],
      anchorDistance: -5.6,
    },
    {
      id: 23,
      title: 'Web Platforms',
      description:
        'North-west wing, coral portal: WEB PLATFORMS, \'the shopfront\'. The ' +
        'surface everything else in the building is eventually seen through.',
      position: [-11.26, 2.15, -6.5],
      anchorDistance: -6,
    },
    {
      id: 24,
      title: 'The Shopfront',
      description:
        'On the plinth: a shop facade standing on scaffolding, with nothing ' +
        'behind it. The face everyone sees, and the frame that actually holds it ' +
        'up. Web Platforms is both halves -- and the second half is the one ' +
        'nobody thanks you for.',
      position: [-14.29, 1.62, -8.25],
      anchorDistance: -4.2,
    },
    {
      id: 25,
      title: 'The Shopfront Room',
      description:
        'Web Platforms\' meeting room, and the last stop on the tour. Step out of ' +
        'its door, turn the corner, and the ring closes back to reception -- so ' +
        'the whole building reads just as well walked backwards.',
      position: [-21.65, 1.5, -12.5],
      anchorDistance: -4,
    },
  ],
};
