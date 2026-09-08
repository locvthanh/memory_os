// The White House: a scale reconstruction of the real building - Executive
// Residence, West Wing, East Wing, both colonnades and the grounds - used as a
// memory palace for all 47 American presidencies.
//
// The architecture is deliberately NOT invented. Every station sits in a real,
// named room, because rooms the visitor already half-knows from photographs
// (the Blue Room, the Lincoln Bedroom, the Situation Room, the Rose Garden) are
// far stronger pegs than any invented hall would be.
//
// The tour climbs the house as it climbs the timeline, so the building teaches
// its own history alongside presidential order:
//   1-5    Ground Floor  - the original 1800 house, through Monroe's rebuild
//   6-16   State Floor   - the 19th-century ceremonial house, ending at Lincoln
//   17-29  Second Floor  - the private residence, through Harding
//   30-35  Third Floor   - a floor that did not exist before Coolidge built it in 1927
//   36-47  West Wing, East Wing and grounds - the modern working presidency
//
// Two mnemonics fall out of the real plan for free: Lincoln (16) stands at the
// foot of the Grand Staircase and Andrew Johnson (17) at its head, so succession
// is a literal flight of stairs; and Cleveland's two non-consecutive terms (22
// and 24) sit in the same Center Hall with Benjamin Harrison (23) physically
// between them. 47 stations, not 45 people - Cleveland and Trump each appear twice.
//
// Built in TheWhiteHouse.blend. Locus_01..47 are baked into the source .blend
// (collection 11_Loci) with custom properties, not injected by
// scripts/build_glb.py - its SCENES entry for this id is an empty list.
// `position` below is only the three.js-space fallback if the glb loses them.
//
// Unlike the Athenaeum, this scene ships fully roofed. Its inter-floor slabs and
// roof decks all carry the WH_Ceiling / WH_Roof_Slate materials, which
// build_glb.py's ROOF_MATERIALS tags with a ROOF_ prefix, and Viewer.js skips
// castShadow on those - so the interiors stay lit by the hemisphere light
// instead of rendering black, while the building keeps its actual silhouette.
//
// Blender (x, y, z) maps to three.js (x, z, -y) under export_yup, so the house's
// north front (Blender +y) is three.js -z and the South Portico bow is +z.

export default {
  walkthrough: {
    // 47 stops: kept short so a full loop runs about four minutes.
    travelSeconds: 2.4,
    dwellSeconds: 3.4,
    // The rig sets the camera to locus.y + eyeHeight, so this is height ABOVE
    // the pedestal cap, not above the floor. The whole complex was re-scaled
    // x1.6 on 2026-09-06 to open the interiors up, which lifted every cap from
    // 0.97 m to 1.74 m and every ceiling from 3.8 m to 6.08 m. Eye height is
    // deliberately scaled far LESS than the house (1.35 -> 1.40, not 2.16):
    // that is what turns the extra size into felt space instead of an identical
    // view of a bigger model. The camera lands ~3.1 m up under a 6.1 m ceiling.
    eyeHeight: 1.40,
    // Negative: back off *toward* each locus's own anchorFrom, i.e. further into
    // its room, rather than outward through the wall behind it.
    //
    // Was -3.2 when the house was at true scale: the rooms were only ~9 m deep
    // with the pedestal at the centre, and a 5 m pull-back put the camera 0.5 m
    // *past* the corridor wall for 31 of the 47 stops. After the x1.6 rescale
    // the same rooms are ~14 m deep, so -5.0 (a shade under 3.2 x 1.6) keeps
    // the old framing and still leaves the camera well inside every room.
    // Re-run the wall-clipping check after any locus move.
    anchorDistance: -5.0,
    loop: true,
  },
  // Per-scene lighting, read by Viewer.js. Needed once the house was scaled
  // x1.6: the sun cannot reach the interiors (the exterior walls must keep
  // casting shadows or the facade goes flat), so everything indoors is lit by
  // the hemisphere light alone -- and rooms with 6 m ceilings and full-height
  // bookcases swallowed the default 0.9. The ambient term is what actually
  // rescues the Library; the raised hemisphere keeps the exterior from going
  // milky. shadowExtent/fog are simply the old values x ~1.6, because the
  // complex now spans ~240 m instead of 150 m.
  lighting: {
    hemisphere: 1.15, ambient: 0.5, sun: 1.5, shadowExtent: 140,
    // The gold pedestal caps and the Library's gilt / brass work are metallic;
    // without an environment probe three.js draws them black.
    environment: true, environmentIntensity: 0.9,
  },
  fog: { near: 110, far: 380 },
  loci: [
    {
      id: 1,
      title: "1. George Washington",
      description: "Library. Chose the site and hired the architect, but never lived here. The tour starts where the house starts. (1789-1797) This room is also the way back: library to library, out past the Statue of Liberty standing mid-nave in the Chroniclers' Athenaeum.",
      position: [-33.36, 1.744, 12],
      // South of the pedestal, so the rig's negative anchorDistance parks the
      // camera on the south side looking NORTH -- straight at the Library
      // fireplace and the Mount Vernon overmantel above it, with the cherry
      // stump and its hatchet in the right foreground. Must stay in step with
      // WH_APPROACH[1] in scripts/build_glb.py, which is (0, -1) for the same
      // reason. The reading table, sofa and globe were moved on 2026-09-06 to
      // keep this camera position clear.
      anchorFrom: [-33.36, 1.744, 21.6],
      // The return leg of the Athenaeum's Liberty crossing (its locus 6 links
      // here). Paired on purpose: both ends of the door are libraries. The
      // viewer has no deep-link to a locus, so this lands on the Athenaeum's
      // first stop rather than on Liberty herself.
      link: 'chroniclers-athenaeum',
    },
    {
      id: 2,
      title: "2. John Adams",
      description:
        "Vermeil Room, staged as Moving Day, 1 November 1800: Adams is the first " +
        "occupant and the house is still half-built, so the room is split down its " +
        "length - plastered and gilt on one side, bare lath and wet grey plaster on " +
        "the other. On the pedestal is the travelling writing box where he wrote the " +
        "blessing now cut in gilt across the mantel opposite. The finished side holds " +
        "what he built: the frigate in its open crate (Navy Department, 1798), his own " +
        "two crates - 2nd president, one term - and on top of them two hats, a man's " +
        "and a boy's, for the son who becomes the 6th. The unfinished side holds what " +
        "undid him: the press chained and padlocked shut (Sedition Act, 1798), three " +
        "sealed letters marked X, Y and Z with the bribe money spilt beside them, and " +
        "judges' wigs waiting on their pegs under a clock stopped at midnight. The " +
        "crates are already re-addressed QUINCY, MASS. 4 MARCH 1801 - he packed and " +
        "left before Jefferson was sworn in - and two candles burn at the doorway " +
        "through to Jefferson's China Room, dated 4 July 1826, the one on Jefferson's " +
        "side already out. (1797-1801)",
      position: [-22.4, 1.744, 12],
      // Faces SOUTH: the camera parks at the room's north end and looks down its
      // length at the chimneypiece, so the inscription is the backdrop to the
      // pedestal. Blender -X is SCREEN RIGHT from here, which is why the finished
      // half of the room (west of the seam at x = -21.4) reads on the right and the
      // unfinished half on the left. Must stay in step with WH_APPROACH[2] in
      // scripts/build_glb.py, which is (0, 1) for the same reason.
      anchorFrom: [-22.4, 1.744, 2.4],
    },
    {
      id: 3,
      title: "3. Thomas Jefferson",
      description:
        "China Room, hung in its own red and lined with glazed cases of " +
        "presidential porcelain - the room is the peg. Past the pedestal a round " +
        "table is laid for THREE (3rd president), pell-mell, with no head and no " +
        "precedence: macaroni, ice cream and French wine, everything he brought " +
        "home from Paris. One cabinet plate is rimmed in gilt and marked 3. On the " +
        "way in you step around a mastodon laid out on a dark cloth - he really did " +
        "spread fossils through the President's House. Blender -X is SCREEN RIGHT, " +
        "so the right-hand wall runs what he gained: the Louisiana map table with " +
        "the coin bags and $15,000,000 - THE COUNTRY DOUBLES (1803), then the desk " +
        "where the polygraph copies every line of the Declaration as he writes it, " +
        "then Monticello's dome beside his own epitaph obelisk (author, statute, " +
        "father of UVa - no mention of the presidency). The left-hand wall runs what " +
        "he sent out and shut in: the Lewis and Clark keelboat under mounted elk " +
        "antlers (1804-06), the frigate cased beside a Tripoli crescent (1801-05, " +
        "the first foreign war), the EMBARGO crates chained shut with a becalmed " +
        "ship in a bottle (1807 - O GRAB ME), and his mockingbird caged at the " +
        "window. Behind you at the door: duelling pistols and a 73-73 tally board " +
        "(the tie with Burr, and Amendment XII), and a broken chain over the Act " +
        "ending the slave trade in 1808. (1801-1809)",
      position: [-13.76, 1.744, 12],
      // Faces SOUTH, like 2: the camera parks at the room's north end, ~5 m back
      // from the pedestal, and looks down the length of the room at the south
      // windows and the pier between them, which carries THOMAS JEFFERSON / III /
      // 1801-1809. Must stay in step with WH_APPROACH[3] in
      // scripts/build_glb.py, which is (0, 1) for the same reason. The mastodon
      // was pushed south to y = -9.95 (Blender) so it lands mid-shot rather than
      // underfoot at the camera's feet.
      anchorFrom: [-13.76, 1.744, 2.4],
    },
    {
      id: 4,
      title: "4. James Madison",
      description:
        "Diplomatic Reception Room - the oval bow room, and the only round stop " +
        "on the ground floor, which is the peg by itself: after the China Room's " +
        "hard corners you walk into a drum. The curved wall carries a painted " +
        "panorama the whole way round, except for one scorched quarter on the " +
        "right where the plaster is black to the cornice, a roof beam has come " +
        "down across the floor, embers are still in the brazier and a longcase " +
        "clock stands burnt and stopped - 24 AUGUST 1814, the night the British " +
        "fired the house. Blender -X is SCREEN RIGHT. Beside the pedestal on the " +
        "right, the campaign table: map, spyglass, a brace of pistols, saddlebag " +
        "on the floor - Bladensburg, where Madison rode out and became the only " +
        "sitting president under fire. On the left, Dolley's peg is a gilt frame " +
        "with nothing in it, the canvas cut out and rolled at its foot, her " +
        "ice-cream cooler and her turban beside it. Straight ahead at the centre " +
        "window, the 15-star, 15-stripe ensign on its staff above a star-shaped " +
        "fort, with rocket streaks over it - Fort McHenry, 1814. Further in, two " +
        "tables face each other across the room: the treaty on green felt with " +
        "its ribbons and seals, the Octagon House model beside it (Ghent, where " +
        "the war ends, ratified in the house they moved to after this one " +
        "burned); and opposite, the lectern with the engrossed Constitution and " +
        "the Federalist in three volumes - he is the Father of the Constitution " +
        "before he is anything else. Ten small framed cards in two rows of five " +
        "hang over a console on the left: the Bill of Rights, 1791. Gilt " +
        "ambassadors' chairs stand round the oval, because this is the room where " +
        "credentials are presented. (1809-1817)",
      position: [0, 1.744, 19.2],
      // Faces SOUTH, like 2 and 3: the rig parks 5 m north of the pedestal at
      // (0, -14.2) in Blender and looks down the bow. Must stay in step with
      // WH_APPROACH[4] in scripts/build_glb.py, which is (0, 1).
      //
      // Note for anyone editing this room: its headroom is 4.36, not 6.08. The
      // South Portico's step slabs (SPortico_Step_0..2, 4.36-6.04) run straight
      // through the bow's upper volume, so the underside of Step_2 is what the
      // visitor actually reads as the ceiling. Dip_Ceiling is set at 4.16-4.34
      // to cap the room just under it; nothing in 16_DiplomaticRoom_Madison goes
      // above 4.36. The portico itself was left alone.
      anchorFrom: [0, 1.744, 6.4],
    },
    {
      id: 5,
      title: "5. James Monroe",
      description: "Map Room. Rebuilt and refurnished the gutted shell from 1817, in French taste. (1817-1825)",
      position: [14.56, 1.744, 12],
      anchorFrom: [14.56, 1.744, 2.4],
    },
    {
      id: 6,
      title: "6. John Quincy Adams",
      description: "East Room. A cold, blocked, one-term presidency, parked in the grandest room in the house. (1825-1829)",
      position: [29.36, 8.464, 11.2],
      anchorFrom: [29.36, 8.464, -1.6],
    },
    {
      id: 7,
      title: "7. Andrew Jackson",
      description: "Green Room. The 1829 inaugural mob that climbed on the furniture, and a 1,400-pound wheel of cheese. (1829-1837)",
      position: [14.56, 8.464, 12],
      anchorFrom: [14.56, 8.464, 2.4],
    },
    {
      id: 8,
      title: "8. Martin Van Buren",
      description: "Blue Room. The 'Gold Spoon' oration attacked him in Congress for decorating rooms like this one too richly. (1837-1841)",
      position: [0, 8.464, 19.2],
      anchorFrom: [0, 8.464, 6.4],
    },
    {
      id: 9,
      title: "9. William Henry Harrison",
      description: "Red Room. The longest inaugural address and the shortest presidency: thirty-one days. (1841)",
      position: [-14.56, 8.464, 12],
      anchorFrom: [-14.56, 8.464, 2.4],
    },
    {
      id: 10,
      title: "10. John Tyler",
      description: "State Dining Room. 'His Accidency' - the first Vice President to succeed to the office and make the claim stick. (1841-1845)",
      position: [-29.36, 8.464, 12],
      anchorFrom: [-29.36, 8.464, 2.4],
    },
    {
      id: 11,
      title: "11. James K. Polk",
      description: "Pantry. The hardest-working president in the house: four stated goals, all met, then out after one term. (1845-1849)",
      position: [-35.76, 8.464, -11.36],
      anchorFrom: [-35.76, 8.464, -1.76],
    },
    {
      id: 12,
      title: "12. Zachary Taylor",
      description: "Family Dining Room. Died five days after a July 4th of cherries and iced milk. (1849-1850)",
      position: [-26.4, 8.464, -11.36],
      anchorFrom: [-26.4, 8.464, -1.76],
    },
    {
      id: 13,
      title: "13. Millard Fillmore",
      description: "Anteroom. Installed the first White House library, and the first proper kitchen stove. (1850-1853)",
      position: [-16, 8.464, -11.36],
      anchorFrom: [-16, 8.464, -1.76],
    },
    {
      id: 14,
      title: "14. Franklin Pierce",
      description: "Entrance Hall. Put in the first central heating. The house got warmer; the country did not. (1853-1857)",
      position: [0, 8.464, -11.36],
      anchorFrom: [0, 8.464, -1.76],
    },
    {
      id: 15,
      title: "15. James Buchanan",
      description: "Cross Hall. Walked this hall while the Union came apart around him. (1857-1861)",
      position: [6.4, 8.464, 0.64],
      anchorFrom: [19.2, 8.464, 0.64],
    },
    {
      id: 16,
      title: "16. Abraham Lincoln",
      description: "Stair Hall - foot of the Grand Staircase. At the foot of the Grand Staircase. Look up - his successor is standing at the top of it. (1861-1865)",
      position: [-30.4, 8.464, 3.84],
      anchorFrom: [-19.2, 8.464, 3.84],
    },
    {
      id: 17,
      title: "17. Andrew Johnson",
      description: "West Sitting Hall - head of the Grand Staircase. At the head of the stairs Lincoln stands at the foot of: succession as one flight of steps. (1865-1869)",
      position: [-35.76, 18.384, 0.64],
      anchorFrom: [-24.56, 18.384, 0.64],
    },
    {
      id: 18,
      title: "18. Ulysses S. Grant",
      description: "West Bedroom. A general's household, and a presidency of scandals he never saw coming. (1869-1877)",
      position: [-35.76, 18.384, 12],
      anchorFrom: [-35.76, 18.384, 2.4],
    },
    {
      id: 19,
      title: "19. Rutherford B. Hayes",
      description: "President's Dining Room. 'Lemonade Lucy' banned alcohol from this table for four years. (1877-1881)",
      position: [-26.4, 18.384, -11.36],
      anchorFrom: [-26.4, 18.384, -1.76],
    },
    {
      id: 20,
      title: "20. James A. Garfield",
      description: "President's Bedroom. Shot in July 1881, he lay dying for eighty days. (1881)",
      position: [-26.4, 18.384, 12],
      anchorFrom: [-26.4, 18.384, 2.4],
    },
    {
      id: 21,
      title: "21. Chester A. Arthur",
      description: "Dressing Room. Refused to move in until Tiffany had redecorated; twenty-four wagonloads of old furniture went out. (1881-1885)",
      position: [-15.36, 18.384, 12],
      anchorFrom: [-15.36, 18.384, 2.4],
    },
    {
      id: 22,
      title: "22. Grover Cleveland",
      description: "Center Hall (west). First term. Keep walking east down this hall and you will meet him again. (1885-1889)",
      position: [-22.4, 18.384, 0.64],
      anchorFrom: [-33.6, 18.384, 0.64],
    },
    {
      id: 23,
      title: "23. Benjamin Harrison",
      description: "Center Hall (centre). Brought electric light into this hall - and was too wary of the switches to touch them himself. (1889-1893)",
      position: [-6.4, 18.384, 0.64],
      anchorFrom: [-17.6, 18.384, 0.64],
    },
    {
      id: 24,
      title: "24. Grover Cleveland",
      description: "Center Hall (east). Second term, four years later: the same man, the same hall, one president standing in between. (1893-1897)",
      position: [9.6, 18.384, 0.64],
      anchorFrom: [-1.6, 18.384, 0.64],
    },
    {
      id: 25,
      title: "25. William McKinley",
      description: "Treaty Room. The treaty ending the Spanish-American War was signed on this table in 1898 - the room is named for it. (1897-1901)",
      position: [14.56, 18.384, 12],
      anchorFrom: [14.56, 18.384, 2.4],
    },
    {
      id: 26,
      title: "26. Theodore Roosevelt",
      description: "Yellow Oval Room. His 1902 renovation pushed the offices out into a brand-new West Wing and made this floor a home again. (1901-1909)",
      position: [0, 18.384, 19.2],
      anchorFrom: [0, 18.384, 6.4],
    },
    {
      id: 27,
      title: "27. William Howard Taft",
      description: "East Sitting Hall. The largest president the house has held, and the first to put cars where the horses had been. (1909-1913)",
      position: [23.2, 18.384, 0.64],
      anchorFrom: [12, 18.384, 0.64],
    },
    {
      id: 28,
      title: "28. Woodrow Wilson",
      description: "Lincoln Bedroom. Slept in the Lincoln bed; left the presidency a stroke victim behind this door. (1913-1921)",
      position: [25.6, 18.384, 12],
      anchorFrom: [25.6, 18.384, 2.4],
    },
    {
      id: 29,
      title: "29. Warren G. Harding",
      description: "Lincoln Sitting Room. Poker twice a week with the Ohio Gang, in the small room off the bedroom. (1921-1923)",
      position: [35.76, 18.384, 12],
      anchorFrom: [35.76, 18.384, 2.4],
    },
    {
      id: 30,
      title: "30. Calvin Coolidge",
      description: "Sky Parlor. Silent Cal raised the roof: this entire floor is his 1927 addition. (1923-1929)",
      position: [-14.8, 25.968, 9.2],
      anchorFrom: [-14.8, 25.968, 1.2],
    },
    {
      id: 31,
      title: "31. Herbert Hoover",
      description: "Music Room. The West Wing burned on Christmas Eve 1929, two months into the Depression. (1929-1933)",
      position: [-27.6, 25.968, 9.2],
      anchorFrom: [-27.6, 25.968, 1.2],
    },
    {
      id: 32,
      title: "32. Franklin D. Roosevelt",
      description: "Promenade (roof terrace). On the roof terrace, looking out over the East and West Wings he added to the house. (1933-1945)",
      position: [26.8, 25.968, -8.4],
      anchorFrom: [26.8, 25.968, -0.4],
    },
    {
      id: 33,
      title: "33. Harry S. Truman",
      description: "Third Floor Center Hall. He found the house structurally failing and had it gutted to a bare steel skeleton, 1948-52. (1945-1953)",
      position: [0, 25.968, 0.8],
      anchorFrom: [-11.2, 25.968, 0.8],
    },
    {
      id: 34,
      title: "34. Dwight D. Eisenhower",
      description: "Game Room. The first televised press conferences - and a putting green out on the South Lawn. (1953-1961)",
      position: [14.8, 25.968, 9.2],
      anchorFrom: [14.8, 25.968, 1.2],
    },
    {
      id: 35,
      title: "35. John F. Kennedy",
      description: "Solarium. The Solarium was the children's schoolroom while Jacqueline restored the rest of the house. (1961-1963)",
      position: [0, 25.968, 9.2],
      anchorFrom: [0, 25.968, 1.2],
    },
    {
      id: 36,
      title: "36. Lyndon B. Johnson",
      description: "Oval Office. The Johnson Treatment, three televisions at once, and a war he could not walk away from. (1963-1969)",
      position: [-81.6, 1.744, 9.6],
      anchorFrom: [-81.6, 1.744, -0],
    },
    {
      id: 37,
      title: "37. Richard Nixon",
      description: "Press Briefing Room. He had FDR's swimming pool floored over to build this briefing room in 1970. (1969-1974)",
      position: [-115.2, 1.744, -17.6],
      anchorFrom: [-115.2, 1.744, -8],
    },
    {
      id: 38,
      title: "38. Gerald Ford",
      description: "Cabinet Room. The only president elected to neither office, governing by consensus around this table. (1974-1977)",
      position: [-83.2, 1.744, -3.2],
      anchorFrom: [-92.8, 1.744, -3.2],
    },
    {
      id: 39,
      title: "39. Jimmy Carter",
      description: "West Wing Roof - solar panels. Thirty-two solar panels went up on this roof in 1979. His successor had them taken down. (1977-1981)",
      position: [-99.2, 15.712, -20.8],
      anchorFrom: [-99.2, 15.712, -9.6],
    },
    {
      id: 40,
      title: "40. Ronald Reagan",
      description: "West Colonnade. The colonnade walk between the residence and the Oval Office - the most photographed forty metres in Washington. (1981-1989)",
      position: [-56, 2.544, -6.72],
      anchorFrom: [-44.8, 2.544, -6.72],
    },
    {
      id: 41,
      title: "41. George H. W. Bush",
      description: "Situation Room. Ran Desert Storm out of this windowless room in 1991. (1989-1993)",
      position: [-100.8, -5.296, -3.2],
      anchorFrom: [-110.4, -5.296, -3.2],
    },
    {
      id: 42,
      title: "42. Bill Clinton",
      description: "Roosevelt Room. Directly above the Situation Room: the war room upstairs from the war room. (1993-2001)",
      position: [-100.8, 1.744, -3.2],
      anchorFrom: [-91.2, 1.744, -3.2],
    },
    {
      id: 43,
      title: "43. George W. Bush",
      description: "PEOC (bunker under the East Wing). September 11th, 2001, and the bunker under the East Wing. (2001-2009)",
      position: [92.8, -11.376, -14.4],
      anchorFrom: [83.2, -11.376, -14.4],
    },
    {
      id: 44,
      title: "44. Barack Obama",
      description: "South Lawn Basketball Court. He had the tennis court restriped for basketball in his first year. (2009-2017)",
      position: [64, 1.712, 54.4],
      anchorFrom: [64, 1.712, 41.6],
    },
    {
      id: 45,
      title: "45. Donald Trump",
      description: "Rose Garden. The 2020 Rose Garden redesign - his first term's mark on the grounds. (2017-2021)",
      position: [-59.2, 1.744, 3.2],
      anchorFrom: [-59.2, 1.744, -8],
    },
    {
      id: 46,
      title: "46. Joe Biden",
      description: "Vice President's Office (West Wing). The West Wing office he worked out of for eight years before he got the one next door. (2021-2025)",
      position: [-105.6, 1.744, 9.6],
      anchorFrom: [-105.6, 1.744, -0],
    },
    {
      id: 47,
      title: "47. Donald Trump",
      description: "East Wing / State Ballroom site. The East Wing came down in 2025 to make room for a State Ballroom. (2025-present)",
      position: [94.4, 1.744, -9.6],
      anchorFrom: [83.2, 1.744, -9.6],
    },
  ],
};
