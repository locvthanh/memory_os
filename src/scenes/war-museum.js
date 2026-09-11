// War Museum: Hall of Sand Tables — seven battles, 216 BC to 1975, each laid out
// as a military sand table in a grand stone gallery.
//
// The hall is a long marble-floored gallery with a colonnade down each side, a
// barrel vault with a skylight along its crown, and an apse at the far end.
// A red carpet runs down the middle carrying a brass timeline; a year disc on
// the carpet points to each table. The tables stand in DATE order, alternating
// left and right, so walking the carpet is walking the calendar:
//
//   1 entrance plinth             5 The Somme, 1916 (right)
//   2 Cannae, 216 BC (left)       6 D-Day, Normandy, 1944 (left)
//   3 Bach Dang, 1288 (right)     7 Dien Bien Phu, 1954 (right)
//   4 Gettysburg, 1863 (left)     8 Fall of Saigon, 1975 (left)
//   9 the eternal-flame memorial in the apse
//
// Every table has the same furniture, so the memory pegs are the dioramas
// themselves: a walnut sand table with a brass rail and a velvet rope, a
// lectern plaque facing the carpet, and on the wall behind it a glowing arch in
// the table's colour -- the PORTAL to that war's own scene, with its name on a
// tablet above. Where that scene exists the locus panel links to it (`link`);
// the other five portals are still dark. Opposite each table, under a window,
// a glass case holds one artifact from the same war ("behind you").
//
// Colour = table, on the frame stripe, the portal, the banners, the carpet
// disc, the memorial lamp and the numbered badge:
//   Cannae terracotta  Bach Dang teal  Gettysburg blue  Somme poppy red
//   Normandy olive     Dien Bien Phu green              Saigon gold
//
// Source: blender_models/WarMuseum.blend, generated through Blender MCP by
// blender_models/war_museum_scenegen/ (wm_*.py). Locus_01..09 are baked into
// the .blend, so build_glb.py's SCENES entry is empty; export prep is in
// scripts/war_museum_export.py, which RECENTRES the hall (authored from the
// doors at Blender y=0 to the apse at y~67) by y-33. Every number below is in
// that recentred three.js space, metres: tables are 3.8 x 2.6 m, tops at 1 m.
//
// Camera: each table stop parks the camera on the carpet side of its table,
// exactly at anchorFrom (negative anchorDistance = that horizontal distance),
// 3.9 m out and 2.7 m up, looking across the diorama at the portal arch behind
// it. The badge floats above the far rim, tinted with the table's colour.

const TABLE = { anchorDistance: -3.9, eyeHeight: 1.25 };

export default {
  // Open just inside the doors, looking down the whole hall to the flame.
  startView: {
    position: [0, 6.2, 31.6],
    lookAt: [0, 1.8, -7],
  },
  walkthrough: {
    travelSeconds: 5,
    dwellSeconds: 12,
    eyeHeight: 1.25,
    anchorDistance: -3.9,
    loop: true,
  },
  background: 0x3b332b,
  // The hall is ~70 m long; keep the far end readable from the doors.
  fog: { near: 70, far: 180 },
  lighting: {
    hemisphere: 0.85,
    ambient: 0.25,
    ambientColor: 0xfff0dc,
    sun: 1.0,
    // Hall recentred on the origin: 17 m wide, 67 m long.
    shadowExtent: 42,
    // Brass rails, gold frames and the bronze lecterns need reflections.
    environment: true,
    environmentIntensity: 0.6,
    environmentColor: 0xe8dcc8,
  },
  labels: { worldSize: 0.42, offsetY: 0.8 },
  loci: [
    {
      id: 1,
      title: 'The Hall of Sand Tables',
      description:
        "The War Museum's great gallery: seven sand tables in date order, from 216 BC to 1975, alternating left and right down the red carpet. Follow the brass line on the carpet: each year disc points to its table. Behind every table a glowing arch is a portal to that war's own scene; opposite it, under the window, a glass case holds one artifact from the same war. The eternal flame burns at the far end, under LEST WE FORGET.",
      position: [0, 1.2, 29.8],
      anchorFrom: [0, 0, 32.4],
      anchorDistance: -2.6,
      eyeHeight: 1.5,
      // Badge above the carpet beyond the plinth, not in front of the lens.
      labelPosition: [0, 2.9, 26.4],
    },
    {
      id: 2,
      title: '216 BC — Battle of Cannae',
      description:
        "Second Punic War, southern Italy. Hannibal of Carthage, with about 50,000 men, faces the largest army Rome has ever put in the field, some 86,000. He lets his centre bow back on purpose: the Roman legions pour into the pocket, his African infantry wheel in on both flanks, and his cavalry, having chased off the Roman horse, closes the back door. Rome loses tens of thousands of men in one afternoon, and 'double envelopment' is studied by generals to this day. Rome still wins the war, at Zama in 202 BC. On the table: the red Roman block squeezed inside the tan crescent, blue cavalry arrows curling round behind it, the Aufidus river on the left. Behind you: a Roman helmet and a short gladius. (Its portal, to the Punic Wars, is still dark.)",
      position: [-4.3, 1.45, 24],
      anchorFrom: [-0.4, 0, 24],
      ...TABLE,
      labelPosition: [-5.8, 2.15, 24],
      labelColor: '#c0562a',
    },
    {
      id: 3,
      title: '1288 — Battle of Bạch Đằng',
      description:
        "Kublai Khan's third invasion of Đại Việt ends on the Bạch Đằng river. Before the Yuan fleet retreats downriver to the sea, Trần Hưng Đạo has iron-tipped wooden stakes driven into the riverbed at the estuary, hidden under the high tide. Small boats lure the fleet in; as the tide falls, the heavy junks are impaled and stranded on the stakes, then attacked with fire rafts and boarded from the banks. The fleet is destroyed, its admiral Omar is captured, and the Mongols never invade Vietnam again. It is the same trick Ngô Quyền used on the same river in 938. On the table: dark junks caught in the stake field, three of them burning, red boats darting out of the side creeks, limestone karsts out by the sea. Behind you: two of the stakes. (Its portal, to the Mongol invasions of Đại Việt, is still dark.)",
      position: [4.3, 1.45, 17],
      anchorFrom: [0.4, 0, 17],
      ...TABLE,
      labelPosition: [5.8, 2.15, 17],
      labelColor: '#1c9a9c',
    },
    {
      id: 4,
      title: '1863 — Battle of Gettysburg',
      description:
        "The biggest battle ever fought in North America, and Lee's last invasion of the North. On the third day, 3 July, Lee sends about 12,500 men across three-quarters of a mile of open fields at the Union centre on Cemetery Ridge: Pickett's Charge. It breaks at the stone wall by 'the Angle', and Lee retreats to Virginia. Some 51,000 men are killed, wounded, captured or missing in three days. That November Lincoln gives the Gettysburg Address here. On the table: grey lines crossing the fields toward the blue line behind the stone wall, the Round Tops on the left, the town on the right, Meade's headquarters and the wagon road behind the ridge. Behind you: a Union kepi and a rifled musket. Its portal opens onto the Civil War map.",
      position: [-4.3, 1.45, 10],
      anchorFrom: [-0.4, 0, 10],
      ...TABLE,
      labelPosition: [-5.8, 2.15, 10],
      labelColor: '#4a64b8',
      link: 'civil-war',
      linkLabel: 'Enter the portal: The Civil War \u2192',
    },
    {
      id: 5,
      title: '1916 — Battle of the Somme',
      description:
        "World War I, the Western Front. Britain and France attack the German lines along the River Somme. On the first day, 1 July 1916, the British Army suffers about 57,000 casualties, nearly 20,000 of them killed: the worst day in its history. The battle grinds on for four and a half months, and on 15 September, at Flers–Courcelette, tanks go into battle for the first time. By November the Allies have gained about six miles, and more than a million men on both sides have been killed or wounded. On the table: two zigzag trench lines, khaki soldiers crossing no man's land, belts of barbed wire, the white chalk ring of the Lochnagar mine crater, three rhomboid Mark I tanks, and a row of poppies along the front edge. Behind you: a Brodie helmet and a poppy. (Its portal, to the Western Front, is still dark.)",
      position: [4.3, 1.45, 3],
      anchorFrom: [0.4, 0, 3],
      ...TABLE,
      labelPosition: [5.8, 2.15, 3],
      labelColor: '#c0232b',
    },
    {
      id: 6,
      title: '1944 — D-Day: The Normandy Landings',
      description:
        "Operation Overlord: on 6 June 1944 about 156,000 American, British and Canadian troops land on five Normandy beaches, the largest seaborne invasion in history. This table is Omaha, the bloodiest of the five: German bunkers on the bluffs pin the first waves down on the sand until small groups fight their way up the valleys the Allies call 'draws'. By late August the Allies have broken out of Normandy, and Paris is liberated on the 25th. On the table: the fleet with barrage balloons, waves of landing craft, steel 'hedgehogs' on the beach, the Atlantic Wall bunkers, hedgerow fields beyond, and three aircraft on brass rods. Behind you: an M1 helmet and dog tags. Its portal opens onto the whole Second World War.",
      position: [-4.3, 1.45, -4],
      anchorFrom: [-0.4, 0, -4],
      ...TABLE,
      labelPosition: [-5.8, 2.15, -4],
      labelColor: '#8f8f2e',
      link: 'world-war-2',
      linkLabel: 'Enter the portal: World War II \u2192',
    },
    {
      id: 7,
      title: '1954 — Battle of Điện Biên Phủ',
      description:
        "First Indochina War. The French build a ring of fortified hills in a remote valley in the northwest, supplied only by air, betting that the Viet Minh cannot bring artillery through the mountains. General Võ Nguyên Giáp's army does: guns are taken apart and hauled up the slopes by hand, and porters push bicycles loaded with 200 kg or more of supplies along jungle trails. From 13 March 1954 the guns shut the airstrip and trenches creep toward each strongpoint; Béatrice falls on the first night. On 7 May the red flag flies over General de Castries' command bunker. The defeat ends French rule in Indochina at the Geneva Conference that July, which divides Vietnam at the 17th parallel. On the table: the valley and its airstrip, sandbagged French strongpoints with tricolours, camouflaged guns dug into the hills, supply parachutes drifting down, porters on the ridge trail. Behind you: a porter's bicycle. (Its portal, to Điện Biên Phủ, is still dark.)",
      position: [4.3, 1.45, -11],
      anchorFrom: [0.4, 0, -11],
      ...TABLE,
      labelPosition: [5.8, 2.15, -11],
      labelColor: '#3f9a36',
    },
    {
      id: 8,
      title: '1975 — The Fall of Sài Gòn',
      description:
        "The end of the Vietnam War. The North Vietnamese spring offensive of 1975, the Hồ Chí Minh Campaign, sweeps south in weeks, and five army columns converge on Saigon. On 29 and 30 April American helicopters lift the last Americans and thousands of South Vietnamese out from rooftops and the embassy grounds. Late that morning tank 390 smashes through the main gate of Independence Palace while tank 843 rams the side gate; the flag of the National Liberation Front goes up on the roof, and President Dương Văn Minh surrenders. The country is formally reunified the next year, and Saigon is renamed Hồ Chí Minh City. On the table: the white palace with its finned façade, the tanks at the gates and the column on Lê Duẩn Boulevard, a helicopter on the US Embassy roof, red-brick Notre-Dame, the Saigon River. Behind you: a pith helmet and the NLF flag. (Its portal, to the Vietnam War, is still dark.)",
      position: [-4.3, 1.45, -18],
      anchorFrom: [-0.4, 0, -18],
      ...TABLE,
      labelPosition: [-5.8, 2.15, -18],
      labelColor: '#d99a12',
    },
    {
      id: 9,
      title: 'The Eternal Flame',
      description:
        "The memorial in the apse. The flame burns in a bronze bowl on a black granite plinth, on three round steps. Seven lamps stand in a half-ring behind it, one in the colour of each table, and wreaths of laurel and red poppies lie at its four sides. On the wall above: LEST WE FORGET, and beneath it, in memory of all who served, all who suffered, and all who were lost. The tour loops back to the doors.",
      position: [0, 1.9, -27.8],
      anchorFrom: [0, 0, -21.8],
      anchorDistance: -6,
      eyeHeight: 1.0,
      labelColor: '#8a2b1a',
    },
  ],
};
