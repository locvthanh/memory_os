// The Civil War — a 3D relief map of the United States with the campaign flow
// of 1861-65 laid over it. Built by scripts on top of real data rather than
// modelled by hand: the landmass is an ETOPO elevation grid resampled onto an
// Albers equal-area conic projection (standard parallels 29.5°/45.5°, central
// meridian 96°W — the standard US projection), clipped to Natural Earth
// coastlines, with heights compressed by z = 0.0075 * elevation^0.62 so the
// Appalachians read without the Rockies swallowing the map. One Blender unit
// is 100 km, so the plate is 4,980 km across.
//
// Cartography — state fills by 1861 allegiance, borders, rivers, hillshade and
// state abbreviations — is baked into a single 6144px texture, so the whole
// country costs ~140k triangles. What is real geometry is the part that has to
// be three-dimensional: the year-by-year front line, the movement arrows, and
// the event pins.
//
// The tour is chronological, not geographic — it jumps between the Eastern and
// Western theatres the way the war actually alternated. Every locus anchors the
// camera to its own south side (anchorFrom = the locus shifted one unit toward
// the viewer) so the map is always read the right way up, rather than the
// default radial anchor which would swing the camera around the plate's
// centroid in Kansas.
//
// Source: blender_models/build_civilwar_map.py + civilwar_data/ (regenerate the
// data with the prep scripts, then re-run the builder inside Blender).

export default {
  // Opening shot: the whole plate from the south, matching the Blender
  // "overview" camera — Blender (0, -34, 42) looking at (0, 2, 0).
  startView: {
    position: [0, 42, 34],
    lookAt: [0, 0, -2],
  },
  walkthrough: {
    travelSeconds: 5,
    dwellSeconds: 9,
    eyeHeight: 4.2,
    anchorDistance: 5.6,
    loop: true,
  },
  // The map plate is 50 x 30 units and the opening shot sits 54 units out, so
  // the default 60/220 fog would grey out the whole country.
  fog: { near: 160, far: 900 },
  // One unit is 100 km here, so the viewer's default 1.1-unit number badges
  // would each blanket a state. Scale them to the map.
  labels: { worldSize: 0.42, offsetY: 0.42 },
  lighting: { hemisphere: 1.35, ambient: 0.75, sun: 2.3, shadowExtent: 40 },
  loci: [
  {
    id: 1,
    title: "Fort Sumter \u00b7 Apr 12 1861",
    description:
      "Seven states had already left when Confederate batteries ringing Charleston harbour opened on the Federal garrison at 4:30 a.m. No one was killed in the bombardment. Lincoln called for 75,000 volunteers, and four more states \u2014 Virginia, Arkansas, Tennessee, North Carolina \u2014 seceded rather than furnish them. The peg: a war that begins with a fort in the water and no casualties, and ends with 620,000 dead.",
    position: [16.62, 1.07, 5.14],
    anchorFrom: [16.62, 0, 4.14],
  },
  {
    id: 2,
    title: "The Anaconda Plan \u00b7 1861",
    description:
      "Winfield Scott's strategy, mocked at the time as too slow: blockade 3,500 miles of Southern coast, take the Mississippi, and squeeze. The teal lines on the map are the blockade arcs. It was slow \u2014 and it is essentially what won. Trace the coil: Atlantic coast, Gulf coast, and the river driven from both ends.",
    position: [18.06, 1.05, 6.42],
    anchorFrom: [18.06, 0, 5.42],
  },
  {
    id: 3,
    title: "First Bull Run \u00b7 Jul 21 1861",
    description:
      "Congressmen rode out from Washington with picnic baskets to watch. The Union advance broke and ran back down the Warrenton Turnpike; Thomas Jackson earned the name 'Stonewall'. Twenty-five miles from the capital, the illusion of a ninety-day war died.",
    position: [17.46, 1.19, -1.93],
    anchorFrom: [17.46, 0, -2.93],
  },
  {
    id: 4,
    title: "Forts Henry & Donelson \u00b7 Feb 1862",
    description:
      "Grant's first strategic stroke: the Tennessee and Cumberland rivers are highways running south into the Confederacy, and the two forts were the gate. Take them and Nashville \u2014 the South's arsenal and its first state capital to fall \u2014 is indefensible. 'Unconditional Surrender' Grant gets his name here.",
    position: [8.9, 1.22, 1.91],
    anchorFrom: [8.9, 0, 0.91],
  },
  {
    id: 5,
    title: "Shiloh \u00b7 Apr 6-7 1862",
    description:
      "A surprise Confederate attack at Pittsburg Landing nearly drove Grant into the river on day one; Buell's reinforcements reversed it on day two. Nearly 24,000 casualties in two days \u2014 more than all previous American wars combined. Albert Sidney Johnston bled to death from a leg wound. After Shiloh nobody expected a short war.",
    position: [8.6, 1.22, 3.46],
    anchorFrom: [8.6, 0, 2.46],
  },
  {
    id: 6,
    title: "New Orleans falls \u00b7 Apr 1862",
    description:
      "Farragut ran his fleet past Forts Jackson and St. Philip in the dark and took the Confederacy's largest city and busiest port without a siege. The lower end of the Mississippi was closed from the sea in the war's first year \u2014 the Anaconda's tail already tightening.",
    position: [7.4, 1.06, 9.36],
    anchorFrom: [7.4, 0, 8.36],
  },
  {
    id: 7,
    title: "Antietam & Emancipation \u00b7 Sep 17 1862",
    description:
      "Lee's first invasion of the North met McClellan along Antietam Creek: 22,700 killed, wounded or missing in one day, still the bloodiest day in American history. Tactically a draw, strategically enough \u2014 five days later Lincoln issued the preliminary Emancipation Proclamation, and the war gained a second purpose that made European recognition of the Confederacy impossible.",
    position: [17.13, 1.23, -2.62],
    anchorFrom: [17.13, 0, -3.62],
  },
  {
    id: 8,
    title: "Fredericksburg \u00b7 Dec 13 1862",
    description:
      "Burnside crossed the Rappahannock and sent wave after wave uphill at a sunken road behind a stone wall on Marye's Heights. Fourteen assaults, none reaching the wall. Lee, watching: 'It is well that war is so terrible, or we should grow too fond of it.'",
    position: [17.62, 1.16, -1.37],
    anchorFrom: [17.62, 0, -2.37],
  },
  {
    id: 9,
    title: "Chancellorsville \u00b7 May 1863",
    description:
      "Outnumbered two to one, Lee divided his army twice and sent Jackson on a twelve-mile flank march that rolled up the Union right at dusk. His masterpiece \u2014 and his most expensive victory: Jackson was shot by his own pickets in the dark and died eight days later.",
    position: [17.46, 1.17, -1.35],
    anchorFrom: [17.46, 0, -2.35],
  },
  {
    id: 10,
    title: "Vicksburg \u00b7 Jul 4 1863",
    description:
      "The last Confederate stronghold on the Mississippi, on bluffs no gunboat could reach. Grant crossed below the city, cut loose from his supply line, beat five separate forces, and starved the garrison out in a 47-day siege. It surrendered the day after Gettysburg ended. 'The Father of Waters again goes unvexed to the sea' \u2014 and the Confederacy is cut in two.",
    position: [6.48, 1.13, 6.72],
    anchorFrom: [6.48, 0, 5.72],
  },
  {
    id: 11,
    title: "Gettysburg \u00b7 Jul 1-3 1863",
    description:
      "Lee's second and last invasion of the North, fought by accident over a road junction. Three days: the seminary ridge, Little Round Top, and finally Pickett's Charge across three-quarters of a mile of open ground into massed artillery. Lee lost a third of his army and never invaded again.",
    position: [17.48, 1.27, -3.1],
    anchorFrom: [17.48, 0, -4.1],
  },
  {
    id: 12,
    title: "Chickamauga & Chattanooga \u00b7 Sep-Nov 1863",
    description:
      "The Confederacy's greatest western victory at Chickamauga bottled the Union army up in Chattanooga \u2014 then Grant arrived, opened the 'cracker line', and his men took Missionary Ridge in an unordered charge straight up the slope. The gateway to Georgia swings open.",
    position: [11.33, 1.31, 3.3],
    anchorFrom: [11.33, 0, 2.3],
  },
  {
    id: 13,
    title: "Overland Campaign \u00b7 May-Jun 1864",
    description:
      "Grant crosses the Rapidan and does the thing no previous Union commander did: after each bloody check \u2014 the Wilderness, Spotsylvania, Cold Harbor \u2014 he sidesteps left and keeps going south. 55,000 Union casualties in six weeks, and the Army of Northern Virginia is pinned for good.",
    position: [17.49, 1.18, -1.24],
    anchorFrom: [17.49, 0, -2.24],
  },
  {
    id: 14,
    title: "Siege of Petersburg \u00b7 Jun 1864 - Apr 1865",
    description:
      "Not a siege but 292 days of trench lines stretching thirty miles round Richmond's rail hub \u2014 mines, sharpshooters, mud, and slow attrition that the South could not replace. It is the Western Front, fifty years early.",
    position: [17.9, 1.12, -0.2],
    anchorFrom: [17.9, 0, -1.2],
  },
  {
    id: 15,
    title: "Fall of Atlanta \u00b7 Sep 2 1864",
    description:
      "Sherman levered Johnston back a hundred miles from Chattanooga, then broke Hood's counterattacks and cut the last railroad. 'Atlanta is ours, and fairly won.' The North was war-weary and Lincoln expected to lose in November; Atlanta re-elected him, and re-election meant no negotiated peace.",
    position: [12.33, 1.3, 4.64],
    anchorFrom: [12.33, 0, 3.64],
  },
  {
    id: 16,
    title: "March to the Sea \u00b7 Nov-Dec 1864",
    description:
      "Sherman burned his supply line and marched 60,000 men in a sixty-mile-wide swath from Atlanta to Savannah, living off the country and wrecking railroads, mills and plantations as they went. The point was not territory but demonstrating that the Confederate government could not protect its own heartland.",
    position: [14.31, 1.17, 5.56],
    anchorFrom: [14.31, 0, 4.56],
  },
  {
    id: 17,
    title: "Franklin & Nashville \u00b7 Nov-Dec 1864",
    description:
      "While Sherman marched east, Hood took the Army of Tennessee north hoping to pull him back. At Franklin he threw it frontally at entrenchments and lost six generals in an afternoon; at Nashville, Thomas destroyed what was left. A whole Confederate field army simply ceases to exist.",
    position: [9.83, 1.27, 2.46],
    anchorFrom: [9.83, 0, 1.46],
  },
  {
    id: 18,
    title: "Appomattox Court House \u00b7 Apr 9 1865",
    description:
      "Petersburg fell on 2 April and Richmond burned; Lee ran west for supplies with Sheridan's cavalry always a step ahead. Cut off at Appomattox, he surrendered in Wilmer McLean's parlour. Grant let the men keep their horses and sent rations into the Confederate lines. The other armies followed within weeks.",
    position: [16.67, 1.24, -0.14],
    anchorFrom: [16.67, 0, -1.14],
  },
  ],
};
