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
    // The rig parks the camera this far above the locus and looks down at it.
    // The pedestal top sits ~0.97 m off the floor, so 1.35 puts the eye at about
    // 2.3 m - under every ceiling here, including the 3.1 m third floor.
    eyeHeight: 1.35,
    // Negative: back off *toward* each locus's own anchorFrom, i.e. further into
    // its room, rather than outward through the wall behind it.
    //
    // 3.2, not 5. The real rooms are only about 9 m deep and each pedestal sits
    // at its room's centre, so a 5 m pull-back put the camera 0.5 m *past* the
    // corridor wall for most of the house - standing in the Cross Hall peering
    // at the pedestal through a doorway. 3.2 keeps the camera inside the room
    // with its subject in every enclosed station.
    anchorDistance: -3.2,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: "1. George Washington",
      description: "Library. Chose the site and hired the architect, but never lived here. The tour starts where the house starts. (1789-1797) This room is also the way back: library to library, out past the Statue of Liberty standing mid-nave in the Chroniclers' Athenaeum.",
      position: [-20.85, 1.09, 7.5],
      anchorFrom: [-20.85, 1.09, 1.5],
      // The return leg of the Athenaeum's Liberty crossing (its locus 6 links
      // here). Paired on purpose: both ends of the door are libraries. The
      // viewer has no deep-link to a locus, so this lands on the Athenaeum's
      // first stop rather than on Liberty herself.
      link: 'chroniclers-athenaeum',
    },
    {
      id: 2,
      title: "2. John Adams",
      description: "Vermeil Room. First occupant, November 1800, moving into a house still half-built. (1797-1801)",
      position: [-14.0, 1.09, 7.5],
      anchorFrom: [-14.0, 1.09, 1.5],
    },
    {
      id: 3,
      title: "3. Thomas Jefferson",
      description: "China Room. Opened the house to the public and added the low colonnades either side. (1801-1809)",
      position: [-8.6, 1.09, 7.5],
      anchorFrom: [-8.6, 1.09, 1.5],
    },
    {
      id: 4,
      title: "4. James Madison",
      description: "Diplomatic Reception Room. The British burned the house in 1814; Dolley Madison got Washington's portrait out first. (1809-1817)",
      position: [0.0, 1.09, 12.0],
      anchorFrom: [0.0, 1.09, 4.0],
    },
    {
      id: 5,
      title: "5. James Monroe",
      description: "Map Room. Rebuilt and refurnished the gutted shell from 1817, in French taste. (1817-1825)",
      position: [9.1, 1.09, 7.5],
      anchorFrom: [9.1, 1.09, 1.5],
    },
    {
      id: 6,
      title: "6. John Quincy Adams",
      description: "East Room. A cold, blocked, one-term presidency, parked in the grandest room in the house. (1825-1829)",
      position: [18.35, 5.29, 7.0],
      anchorFrom: [18.35, 5.29, -1.0],
    },
    {
      id: 7,
      title: "7. Andrew Jackson",
      description: "Green Room. The 1829 inaugural mob that climbed on the furniture, and a 1,400-pound wheel of cheese. (1829-1837)",
      position: [9.1, 5.29, 7.5],
      anchorFrom: [9.1, 5.29, 1.5],
    },
    {
      id: 8,
      title: "8. Martin Van Buren",
      description: "Blue Room. The 'Gold Spoon' oration attacked him in Congress for decorating rooms like this one too richly. (1837-1841)",
      position: [0.0, 5.29, 12.0],
      anchorFrom: [0.0, 5.29, 4.0],
    },
    {
      id: 9,
      title: "9. William Henry Harrison",
      description: "Red Room. The longest inaugural address and the shortest presidency: thirty-one days. (1841)",
      position: [-9.1, 5.29, 7.5],
      anchorFrom: [-9.1, 5.29, 1.5],
    },
    {
      id: 10,
      title: "10. John Tyler",
      description: "State Dining Room. 'His Accidency' - the first Vice President to succeed to the office and make the claim stick. (1841-1845)",
      position: [-18.35, 5.29, 7.5],
      anchorFrom: [-18.35, 5.29, 1.5],
    },
    {
      id: 11,
      title: "11. James K. Polk",
      description: "Pantry. The hardest-working president in the house: four stated goals, all met, then out after one term. (1845-1849)",
      position: [-22.35, 5.29, -7.1],
      anchorFrom: [-22.35, 5.29, -1.1],
    },
    {
      id: 12,
      title: "12. Zachary Taylor",
      description: "Family Dining Room. Died five days after a July 4th of cherries and iced milk. (1849-1850)",
      position: [-16.5, 5.29, -7.1],
      anchorFrom: [-16.5, 5.29, -1.1],
    },
    {
      id: 13,
      title: "13. Millard Fillmore",
      description: "Anteroom. Installed the first White House library, and the first proper kitchen stove. (1850-1853)",
      position: [-10.0, 5.29, -7.1],
      anchorFrom: [-10.0, 5.29, -1.1],
    },
    {
      id: 14,
      title: "14. Franklin Pierce",
      description: "Entrance Hall. Put in the first central heating. The house got warmer; the country did not. (1853-1857)",
      position: [0.0, 5.29, -7.1],
      anchorFrom: [0.0, 5.29, -1.1],
    },
    {
      id: 15,
      title: "15. James Buchanan",
      description: "Cross Hall. Walked this hall while the Union came apart around him. (1857-1861)",
      position: [4.0, 5.29, 0.4],
      anchorFrom: [12.0, 5.29, 0.4],
    },
    {
      id: 16,
      title: "16. Abraham Lincoln",
      description: "Stair Hall - foot of the Grand Staircase. At the foot of the Grand Staircase. Look up - his successor is standing at the top of it. (1861-1865)",
      position: [-19.0, 5.29, 2.4],
      anchorFrom: [-12.0, 5.29, 2.4],
    },
    {
      id: 17,
      title: "17. Andrew Johnson",
      description: "West Sitting Hall - head of the Grand Staircase. At the head of the stairs Lincoln stands at the foot of: succession as one flight of steps. (1865-1869)",
      position: [-22.35, 11.49, 0.4],
      anchorFrom: [-15.35, 11.49, 0.4],
    },
    {
      id: 18,
      title: "18. Ulysses S. Grant",
      description: "West Bedroom. A general's household, and a presidency of scandals he never saw coming. (1869-1877)",
      position: [-22.35, 11.49, 7.5],
      anchorFrom: [-22.35, 11.49, 1.5],
    },
    {
      id: 19,
      title: "19. Rutherford B. Hayes",
      description: "President's Dining Room. 'Lemonade Lucy' banned alcohol from this table for four years. (1877-1881)",
      position: [-16.5, 11.49, -7.1],
      anchorFrom: [-16.5, 11.49, -1.1],
    },
    {
      id: 20,
      title: "20. James A. Garfield",
      description: "President's Bedroom. Shot in July 1881, he lay dying for eighty days. (1881)",
      position: [-16.5, 11.49, 7.5],
      anchorFrom: [-16.5, 11.49, 1.5],
    },
    {
      id: 21,
      title: "21. Chester A. Arthur",
      description: "Dressing Room. Refused to move in until Tiffany had redecorated; twenty-four wagonloads of old furniture went out. (1881-1885)",
      position: [-9.6, 11.49, 7.5],
      anchorFrom: [-9.6, 11.49, 1.5],
    },
    {
      id: 22,
      title: "22. Grover Cleveland",
      description: "Center Hall (west). First term. Keep walking east down this hall and you will meet him again. (1885-1889)",
      position: [-14.0, 11.49, 0.4],
      anchorFrom: [-21.0, 11.49, 0.4],
    },
    {
      id: 23,
      title: "23. Benjamin Harrison",
      description: "Center Hall (centre). Brought electric light into this hall - and was too wary of the switches to touch them himself. (1889-1893)",
      position: [-4.0, 11.49, 0.4],
      anchorFrom: [-11.0, 11.49, 0.4],
    },
    {
      id: 24,
      title: "24. Grover Cleveland",
      description: "Center Hall (east). Second term, four years later: the same man, the same hall, one president standing in between. (1893-1897)",
      position: [6.0, 11.49, 0.4],
      anchorFrom: [-1.0, 11.49, 0.4],
    },
    {
      id: 25,
      title: "25. William McKinley",
      description: "Treaty Room. The treaty ending the Spanish-American War was signed on this table in 1898 - the room is named for it. (1897-1901)",
      position: [9.1, 11.49, 7.5],
      anchorFrom: [9.1, 11.49, 1.5],
    },
    {
      id: 26,
      title: "26. Theodore Roosevelt",
      description: "Yellow Oval Room. His 1902 renovation pushed the offices out into a brand-new West Wing and made this floor a home again. (1901-1909)",
      position: [0.0, 11.49, 12.0],
      anchorFrom: [0.0, 11.49, 4.0],
    },
    {
      id: 27,
      title: "27. William Howard Taft",
      description: "East Sitting Hall. The largest president the house has held, and the first to put cars where the horses had been. (1909-1913)",
      position: [14.5, 11.49, 0.4],
      anchorFrom: [7.5, 11.49, 0.4],
    },
    {
      id: 28,
      title: "28. Woodrow Wilson",
      description: "Lincoln Bedroom. Slept in the Lincoln bed; left the presidency a stroke victim behind this door. (1913-1921)",
      position: [16.0, 11.49, 7.5],
      anchorFrom: [16.0, 11.49, 1.5],
    },
    {
      id: 29,
      title: "29. Warren G. Harding",
      description: "Lincoln Sitting Room. Poker twice a week with the Ohio Gang, in the small room off the bedroom. (1921-1923)",
      position: [22.35, 11.49, 7.5],
      anchorFrom: [22.35, 11.49, 1.5],
    },
    {
      id: 30,
      title: "30. Calvin Coolidge",
      description: "Sky Parlor. Silent Cal raised the roof: this entire floor is his 1927 addition. (1923-1929)",
      position: [-9.25, 16.23, 5.75],
      anchorFrom: [-9.25, 16.23, 0.75],
    },
    {
      id: 31,
      title: "31. Herbert Hoover",
      description: "Music Room. The West Wing burned on Christmas Eve 1929, two months into the Depression. (1929-1933)",
      position: [-17.25, 16.23, 5.75],
      anchorFrom: [-17.25, 16.23, 0.75],
    },
    {
      id: 32,
      title: "32. Franklin D. Roosevelt",
      description: "Promenade (roof terrace). On the roof terrace, looking out over the East and West Wings he added to the house. (1933-1945)",
      position: [16.75, 16.23, -5.25],
      anchorFrom: [16.75, 16.23, -0.25],
    },
    {
      id: 33,
      title: "33. Harry S. Truman",
      description: "Third Floor Center Hall. He found the house structurally failing and had it gutted to a bare steel skeleton, 1948-52. (1945-1953)",
      position: [0.0, 16.23, 0.5],
      anchorFrom: [-7.0, 16.23, 0.5],
    },
    {
      id: 34,
      title: "34. Dwight D. Eisenhower",
      description: "Game Room. The first televised press conferences - and a putting green out on the South Lawn. (1953-1961)",
      position: [9.25, 16.23, 5.75],
      anchorFrom: [9.25, 16.23, 0.75],
    },
    {
      id: 35,
      title: "35. John F. Kennedy",
      description: "Solarium. The Solarium was the children's schoolroom while Jacqueline restored the rest of the house. (1961-1963)",
      position: [0.0, 16.23, 5.75],
      anchorFrom: [0.0, 16.23, 0.75],
    },
    {
      id: 36,
      title: "36. Lyndon B. Johnson",
      description: "Oval Office. The Johnson Treatment, three televisions at once, and a war he could not walk away from. (1963-1969)",
      position: [-51.0, 1.09, 6.0],
      anchorFrom: [-51.0, 1.09, -0.0],
    },
    {
      id: 37,
      title: "37. Richard Nixon",
      description: "Press Briefing Room. He had FDR's swimming pool floored over to build this briefing room in 1970. (1969-1974)",
      position: [-72.0, 1.09, -11.0],
      anchorFrom: [-72.0, 1.09, -5.0],
    },
    {
      id: 38,
      title: "38. Gerald Ford",
      description: "Cabinet Room. The only president elected to neither office, governing by consensus around this table. (1974-1977)",
      position: [-52.0, 1.09, -2.0],
      anchorFrom: [-58.0, 1.09, -2.0],
    },
    {
      id: 39,
      title: "39. Jimmy Carter",
      description: "West Wing Roof - solar panels. Thirty-two solar panels went up on this roof in 1979. His successor had them taken down. (1977-1981)",
      position: [-62.0, 9.82, -13.0],
      anchorFrom: [-62.0, 9.82, -6.0],
    },
    {
      id: 40,
      title: "40. Ronald Reagan",
      description: "West Colonnade. The colonnade walk between the residence and the Oval Office - the most photographed forty metres in Washington. (1981-1989)",
      position: [-35.0, 1.59, -4.2],
      anchorFrom: [-28.0, 1.59, -4.2],
    },
    {
      id: 41,
      title: "41. George H. W. Bush",
      description: "Situation Room. Ran Desert Storm out of this windowless room in 1991. (1989-1993)",
      position: [-63.0, -3.31, -2.0],
      anchorFrom: [-69.0, -3.31, -2.0],
    },
    {
      id: 42,
      title: "42. Bill Clinton",
      description: "Roosevelt Room. Directly above the Situation Room: the war room upstairs from the war room. (1993-2001)",
      position: [-63.0, 1.09, -2.0],
      anchorFrom: [-57.0, 1.09, -2.0],
    },
    {
      id: 43,
      title: "43. George W. Bush",
      description: "PEOC (bunker under the East Wing). September 11th, 2001, and the bunker under the East Wing. (2001-2009)",
      position: [58.0, -7.11, -9.0],
      anchorFrom: [52.0, -7.11, -9.0],
    },
    {
      id: 44,
      title: "44. Barack Obama",
      description: "South Lawn Basketball Court. He had the tennis court restriped for basketball in his first year. (2009-2017)",
      position: [40.0, 1.07, 34.0],
      anchorFrom: [40.0, 1.07, 26.0],
    },
    {
      id: 45,
      title: "45. Donald Trump",
      description: "Rose Garden. The 2020 Rose Garden redesign - his first term's mark on the grounds. (2017-2021)",
      position: [-37.0, 1.09, 2.0],
      anchorFrom: [-37.0, 1.09, -5.0],
    },
    {
      id: 46,
      title: "46. Joe Biden",
      description: "Vice President's Office (West Wing). The West Wing office he worked out of for eight years before he got the one next door. (2021-2025)",
      position: [-66.0, 1.09, 6.0],
      anchorFrom: [-66.0, 1.09, -0.0],
    },
    {
      id: 47,
      title: "47. Donald Trump",
      description: "East Wing / State Ballroom site. The East Wing came down in 2025 to make room for a State Ballroom. (2025-present)",
      position: [59.0, 1.09, -6.0],
      anchorFrom: [52.0, 1.09, -6.0],
    },
  ],
};
