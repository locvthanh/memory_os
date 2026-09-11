// The Civil War — content for the 2D animated-map scene.
//
// This replaces the 3D `civil-war-map` scene. Same eighteen loci, same
// chronological order; the relief plate and the camera rig are gone, and the
// tour now pans and zooms a projected SVG map of the United States instead.
// The map geometry lives in src/scenes2d/civil-war.data.js; the renderer in
// src/scenes2d/civil-war.js; this file is only the memory content plus the
// per-stop framing.
//
// Per-locus fields:
//   id           tour order, 1..18
//   title        heading shown in the panel
//   description  the memory peg
//   year         drives the front line, the falling-state wash and the year
//                stamp — the map state is "as at the end of this year"
//   w            framing: viewBox width in map units at this stop. The map is
//                1000 units across (one unit is about 5 km), so 1000 is the
//                whole country and 150 is a county-sized crop of Virginia.
//   reveal       ids from MAP.arrows to draw on arrival (cumulative — an arrow
//                drawn at an earlier stop stays on the map)
//   effect       optional flourish keyed in the renderer: 'bombard', 'blockade',
//                'siege', 'burn', 'surrender'
//   pan          optional [dx, dy] nudge in map units, for a stop whose pin
//                sits at the edge of what it needs to show

export default {
  walkthrough: {
    travelSeconds: 2.6,
    dwellSeconds: 11,
    loop: true,
  },
  // Opening shot before the tour starts: the whole country, 1861.
  startView: { w: 1080, year: 1861 },
  loci: [
    {
      id: 1,
      year: 1861,
      w: 300,
      effect: 'bombard',
      title: 'Fort Sumter · Apr 12 1861',
      description:
        'Seven states had already left when Confederate batteries ringing Charleston harbour opened on the Federal garrison at 4:30 a.m. No one was killed in the bombardment. Lincoln called for 75,000 volunteers, and four more states — Virginia, Arkansas, Tennessee, North Carolina — seceded rather than furnish them. The peg: a war that begins with a fort in the water and no casualties, and ends with 620,000 dead.',
    },
    {
      id: 2,
      year: 1861,
      w: 1080,
      effect: 'blockade',
      title: 'The Anaconda Plan · 1861',
      description:
        "Winfield Scott's strategy, mocked at the time as too slow: blockade 3,500 miles of Southern coast, take the Mississippi, and squeeze. The teal lines on the map are the blockade arcs. It was slow — and it is essentially what won. Trace the coil: Atlantic coast, Gulf coast, and the river driven from both ends.",
    },
    {
      id: 3,
      year: 1861,
      w: 230,
      title: 'First Bull Run · Jul 21 1861',
      description:
        "Congressmen rode out from Washington with picnic baskets to watch. The Union advance broke and ran back down the Warrenton Turnpike; Thomas Jackson earned the name 'Stonewall'. Twenty-five miles from the capital, the illusion of a ninety-day war died.",
    },
    {
      id: 4,
      year: 1862,
      w: 330,
      reveal: ['grant-rivers'],
      title: 'Forts Henry & Donelson · Feb 1862',
      description:
        "Grant's first strategic stroke: the Tennessee and Cumberland rivers are highways running south into the Confederacy, and the two forts were the gate. Take them and Nashville — the South's arsenal and its first state capital to fall — is indefensible. 'Unconditional Surrender' Grant gets his name here.",
    },
    {
      id: 5,
      year: 1862,
      w: 300,
      title: 'Shiloh · Apr 6-7 1862',
      description:
        'A surprise Confederate attack at Pittsburg Landing nearly drove Grant into the river on day one; Buell’s reinforcements reversed it on day two. Nearly 24,000 casualties in two days — more than all previous American wars combined. Albert Sidney Johnston bled to death from a leg wound. After Shiloh nobody expected a short war.',
    },
    {
      id: 6,
      year: 1862,
      w: 340,
      reveal: ['farragut'],
      title: 'New Orleans falls · Apr 1862',
      description:
        "Farragut ran his fleet past Forts Jackson and St. Philip in the dark and took the Confederacy's largest city and busiest port without a siege. The lower end of the Mississippi was closed from the sea in the war's first year — the Anaconda's tail already tightening.",
    },
    {
      id: 7,
      year: 1862,
      w: 210,
      title: 'Antietam & Emancipation · Sep 17 1862',
      description:
        "Lee's first invasion of the North met McClellan along Antietam Creek: 22,700 killed, wounded or missing in one day, still the bloodiest day in American history. Tactically a draw, strategically enough — five days later Lincoln issued the preliminary Emancipation Proclamation, and the war gained a second purpose that made European recognition of the Confederacy impossible.",
    },
    {
      id: 8,
      year: 1862,
      w: 160,
      title: 'Fredericksburg · Dec 13 1862',
      description:
        "Burnside crossed the Rappahannock and sent wave after wave uphill at a sunken road behind a stone wall on Marye's Heights. Fourteen assaults, none reaching the wall. Lee, watching: 'It is well that war is so terrible, or we should grow too fond of it.'",
    },
    {
      id: 9,
      year: 1863,
      w: 160,
      title: 'Chancellorsville · May 1863',
      description:
        'Outnumbered two to one, Lee divided his army twice and sent Jackson on a twelve-mile flank march that rolled up the Union right at dusk. His masterpiece — and his most expensive victory: Jackson was shot by his own pickets in the dark and died eight days later.',
    },
    {
      id: 10,
      year: 1863,
      w: 320,
      reveal: ['vicksburg'],
      effect: 'siege',
      title: 'Vicksburg · Jul 4 1863',
      description:
        "The last Confederate stronghold on the Mississippi, on bluffs no gunboat could reach. Grant crossed below the city, cut loose from his supply line, beat five separate forces, and starved the garrison out in a 47-day siege. It surrendered the day after Gettysburg ended. 'The Father of Waters again goes unvexed to the sea' — and the Confederacy is cut in two.",
    },
    {
      id: 11,
      year: 1863,
      w: 240,
      reveal: ['lee-north'],
      title: 'Gettysburg · Jul 1-3 1863',
      description:
        "Lee's second and last invasion of the North, fought by accident over a road junction. Three days: the seminary ridge, Little Round Top, and finally Pickett's Charge across three-quarters of a mile of open ground into massed artillery. Lee lost a third of his army and never invaded again.",
    },
    {
      id: 12,
      year: 1863,
      w: 340,
      title: 'Chickamauga & Chattanooga · Sep-Nov 1863',
      description:
        "The Confederacy's greatest western victory at Chickamauga bottled the Union army up in Chattanooga — then Grant arrived, opened the 'cracker line', and his men took Missionary Ridge in an unordered charge straight up the slope. The gateway to Georgia swings open.",
    },
    {
      id: 13,
      year: 1864,
      w: 180,
      reveal: ['overland'],
      title: 'Overland Campaign · May-Jun 1864',
      description:
        'Grant crosses the Rapidan and does the thing no previous Union commander did: after each bloody check — the Wilderness, Spotsylvania, Cold Harbor — he sidesteps left and keeps going south. 55,000 Union casualties in six weeks, and the Army of Northern Virginia is pinned for good.',
    },
    {
      id: 14,
      year: 1864,
      w: 200,
      effect: 'siege',
      title: 'Siege of Petersburg · Jun 1864 - Apr 1865',
      description:
        "Not a siege but 292 days of trench lines stretching thirty miles round Richmond's rail hub — mines, sharpshooters, mud, and slow attrition that the South could not replace. It is the Western Front, fifty years early.",
    },
    {
      id: 15,
      year: 1864,
      w: 340,
      reveal: ['sherman'],
      title: 'Fall of Atlanta · Sep 2 1864',
      description:
        "Sherman levered Johnston back a hundred miles from Chattanooga, then broke Hood's counterattacks and cut the last railroad. 'Atlanta is ours, and fairly won.' The North was war-weary and Lincoln expected to lose in November; Atlanta re-elected him, and re-election meant no negotiated peace.",
    },
    {
      id: 16,
      year: 1864,
      w: 460,
      pan: [-60, -10],
      effect: 'burn',
      title: 'March to the Sea · Nov-Dec 1864',
      description:
        'Sherman burned his supply line and marched 60,000 men in a sixty-mile-wide swath from Atlanta to Savannah, living off the country and wrecking railroads, mills and plantations as they went. The point was not territory but demonstrating that the Confederate government could not protect its own heartland.',
    },
    {
      id: 17,
      year: 1864,
      w: 340,
      reveal: ['hood'],
      title: 'Franklin & Nashville · Nov-Dec 1864',
      description:
        'While Sherman marched east, Hood took the Army of Tennessee north hoping to pull him back. At Franklin he threw it frontally at entrenchments and lost six generals in an afternoon; at Nashville, Thomas destroyed what was left. A whole Confederate field army simply ceases to exist.',
    },
    {
      id: 18,
      year: 1865,
      w: 260,
      effect: 'surrender',
      // The way back. The White House's Lincoln locus links here, so the two
      // scenes are a round trip: the man at the foot of the Grand Staircase,
      // and the war that was his whole presidency.
      link: 'the-white-house',
      title: 'Appomattox Court House · Apr 9 1865',
      description:
        "Petersburg fell on 2 April and Richmond burned; Lee ran west for supplies with Sheridan's cavalry always a step ahead. Cut off at Appomattox, he surrendered in Wilmer McLean's parlour. Grant let the men keep their horses and sent rations into the Confederate lines. The other armies followed within weeks.",
    },
  ],
};
