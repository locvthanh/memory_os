// The Pump House — the heart as a two-storey building you walk through at
// roughly 1:130,000, where one red blood cell is a metre across.
//
// Scene 1 of the Human Body series (docs/human-body-series.md). The series
// rule is that the metaphor may change the material but never the topology:
// valves are doors, but they are in the right order and they open the right
// way. Right side blue, left side red, septum down the middle, atria upstairs,
// ventricles downstairs. The tour descends the right side, goes out to the
// lungs, comes back into the left side, descends again, leaves by the aorta,
// and ends at the capillary bed where the blood actually does its job.
//
// The room is built around one comparison: you walk past the right ventricle's
// 1.2 m wall and then the left ventricle's 4.0 m wall. Same volume of blood,
// same beat — one pushes it 10 cm to the lungs, the other pushes it to your
// toes.
//
// Every stop names its own `anchorFrom` (the chamber it is seen from) with a
// negative `anchorDistance`, the meditation-ledge pattern: an interior scene
// whose loci sit in walls and floors would otherwise park the camera outside
// the building looking at brick.
//
// Real positions come from the Locus_01..17 empties baked into
// models/body-heart.glb (collection 09_Loci in PumpHouse.blend, built by
// blender_models/heart_scenegen/build_heart.py). `position` below is only the
// three.js-space fallback (Blender x,y,z -> three x, z, -y).
export default {
  background: 0x140e13,
  fog: { near: 90, far: 620 },
  lighting: {
    hemisphere: 1.15,
    ambient: 0.9,
    ambientColor: 0xffd8d8,
    sun: 1.5,
    shadowExtent: 60,
  },
  walkthrough: {
    travelSeconds: 7,
    dwellSeconds: 12,
    eyeHeight: 2,
    anchorDistance: -10,
    loop: true,
  },
  loci: [
    {
      id: 1,
      title: 'The Intakes',
      description:
        'Two blue pipes, and everything that has already been spent arrives through them: the superior vena cava down from the head and arms, the inferior vena cava up from everything below the diaphragm. No pump pushes blood in here — it arrives because the atrium is momentarily emptier than the veins are. Good peg for anything that collects from everywhere before it is dealt with.',
      position: [-16, 29, -7],
      anchorFrom: [-15, 0, 0],
      anchorDistance: -12,
      eyeHeight: -5,
    },
    {
      id: 2,
      title: 'Right Atrium',
      description:
        'The blue holding hall. It is a waiting room, not an engine: its walls are thin because all it has to do is top up the ventricle below with the last 20% after gravity has done the rest. Hold here the idea of a buffer that barely works and still matters.',
      position: [-15, 25, 0],
      anchorFrom: [-15, 0, 9],
      anchorDistance: -9,
      eyeHeight: 2,
    },
    {
      id: 3,
      title: 'The Clock',
      description:
        'The sinoatrial node, glowing on the atrial wall — a patch of cells that leak themselves to threshold about once a second and fire whether or not anyone asked. Every beat of your life started here, not in your brain; the nerves only speed it up or slow it down. Peg for anything self-starting.',
      position: [-23.2, 27, -8],
      anchorFrom: [-15, 0, 0],
      anchorDistance: -10,
      eyeHeight: -0.5,
    },
    {
      id: 4,
      title: 'The Tricuspid Door',
      description:
        'Three leaflets in the floor, hinged on a ring, opening downward only. Blood falls through it into the ventricle; when the ventricle squeezes, the leaflets slam shut and the first heart sound — the "lub" — is that slam. Three leaflets on the right, two on the left: that asymmetry is the thing to remember.',
      position: [-14, 18.4, 0],
      anchorFrom: [-15, 0, 9],
      anchorDistance: -9,
      eyeHeight: 6,
    },
    {
      id: 5,
      title: 'The Tethers',
      description:
        'Chordae tendineae — tendon cords running from the free edge of each leaflet down to papillary muscles standing on the ventricle floor. They do not open the door; they stop it blowing inside out when the pressure below spikes. The papillary muscles pull a fraction early so the cords are taut before the squeeze. Peg for a restraint that must be applied before the force arrives.',
      position: [-14, 8, 0],
      anchorFrom: [-14, 0, 8.4],
      anchorDistance: -9,
      eyeHeight: -2,
    },
    {
      id: 6,
      title: 'Right Ventricle',
      description:
        'Thin-walled, crescent-shaped, and wrapped around the left ventricle rather than mirroring it. It moves exactly as much blood per beat as the left does, at about a fifth of the pressure, because its destination is 10 cm away. Same volume, different work.',
      position: [-14, 5, -3.5],
      anchorFrom: [-14, 0, 8.4],
      anchorDistance: -12,
      eyeHeight: 2,
    },
    {
      id: 7,
      title: 'The Pulmonary Door',
      description:
        'Three pocket-shaped cusps at the ventricle ceiling. They have no cords: they are shaped like cups facing backwards, so any blood trying to fall back fills them and wedges them shut. Through it goes the pulmonary artery — the one artery in the body carrying blue blood, because artery means "away from the heart", not "oxygenated".',
      position: [-14, 17.6, -7],
      anchorFrom: [-20, 0, 6],
      anchorDistance: -14,
      eyeHeight: -7,
    },
    {
      id: 8,
      title: 'The Lung Loop',
      description:
        'Out to the lungs and back — the short circuit, about 10% of the body by distance and half the heart by design. In the honeycomb the blood is separated from the air by a wall one cell thick on each side; oxygen crosses one way, carbon dioxide the other, by nothing more than concentration. Blue goes in, red comes out. This is the only stop on the tour that leaves the building.',
      position: [-2, 24, -46],
      anchorFrom: [-2, 0, 30],
      anchorDistance: -30,
      eyeHeight: 22,
    },
    {
      id: 9,
      title: 'The Returns',
      description:
        'Four pulmonary veins entering the left atrium — the only veins in the body carrying red blood, for the same reason the pulmonary artery carries blue: the names are about direction, not colour. If you can hold this pair of exceptions, you will never mix up artery and vein again.',
      position: [16, 29, -8],
      anchorFrom: [15, 0, 0],
      anchorDistance: -11,
      eyeHeight: -2,
    },
    {
      id: 10,
      title: 'Left Atrium',
      description:
        'The red holding hall, the quietest room in the building and the one furthest back in the chest. Same job as its blue twin across the septum: hold, then top up. Worth pegging as the mirror that is not quite a mirror — everything about the left side is the same shape and three times the force.',
      position: [15, 25, 0],
      anchorFrom: [15, 0, 9],
      anchorDistance: -9,
      eyeHeight: 2,
    },
    {
      id: 11,
      title: 'The Mitral Door',
      description:
        'Two leaflets, not three — the bicuspid, named for a bishop’s mitre. It is the door that fails most often in practice: it takes the full left-ventricular pressure on its back every beat, and when its cords stretch it starts to leak backwards into the atrium. Peg for the component that breaks because it is the one under load.',
      position: [14, 18.4, 0],
      anchorFrom: [15, 0, 9],
      anchorDistance: -9,
      eyeHeight: 6,
    },
    {
      id: 12,
      title: 'The Thick Wall',
      description:
        'The comparison the whole building exists for, taken out of the walls and stood up in the open: a 1.2 m sample of the wall you walked past on the blue side, beside a 4.0 m sample of the one you just came down. Same stroke volume, same beat. The left muscle is wound in a helix so the chamber wrings rather than squeezes, and it raises the blood to about 120 mmHg \u2014 enough to reach your foot and come back. Thickness here is not strength in reserve, it is the price of distance.',
      position: [0, 6, 24],
      anchorFrom: [0, 0, 60],
      anchorDistance: -22,
      eyeHeight: 4,
    },
    {
      id: 13,
      title: 'The Aortic Door',
      description:
        'The last door out: three cusps, same pocket trick as the pulmonary. It opens only when the ventricle has already built more pressure than the aorta holds — which is why there is a brief moment each beat when all four doors are shut and the chamber squeezes against a closed box. Its slam is the second heart sound, the "dub".',
      position: [12, 17.6, -2],
      anchorFrom: [14, 0, 4],
      anchorDistance: -9,
      eyeHeight: -4,
    },
    {
      id: 14,
      title: 'The Arch',
      description:
        'The aorta leaves upward, turns over, and heads down the body, with three branches off the top of the turn for the head and both arms. Its wall is elastic on purpose: it balloons on each beat and recoils between them, which is what turns a series of shoves into something like continuous flow by the time blood reaches your fingers.',
      position: [11, 48, 22],
      anchorFrom: [11, 0, 70],
      anchorDistance: -22,
      eyeHeight: -8,
    },
    {
      id: 15,
      title: 'The Crown',
      description:
        'The coronary arteries — the very first branches off the aorta, before the brain gets anything, wrapping the outside of the muscle like a crown. The heart cannot use the blood inside its own chambers; it has to be plumbed like any other organ. And because it only fills between beats, a heart that races too long starves itself. Block one of these branches and the muscle downstream dies: that is a heart attack, and it is a plumbing event, not an electrical one.',
      position: [16, 12, 12.6],
      anchorFrom: [14, 0, 30],
      anchorDistance: -20,
      eyeHeight: 4,
    },
    {
      id: 16,
      title: 'The Wiring',
      description:
        'The signal from the clock crosses to the AV node on the septum — the only electrical door between the upper and lower floors — and there it deliberately waits about a tenth of a second so the atria finish emptying before the ventricles start. Then the bundle of His carries it down the septum and the Purkinje fibres fan across both ventricle floors, so the squeeze starts at the bottom and wrings upward toward the exits. A pump that contracted top-down would push its contents into a closed floor.',
      position: [-3.4, 6, 0],
      anchorFrom: [-14, 0, 0],
      anchorDistance: -9,
      eyeHeight: 3,
    },
    {
      id: 17,
      title: 'The Exchange',
      description:
        'The point of all of it. Out here the vessels narrow until their walls are one cell thick and the red cells go through single file, bending to fit — and only here does anything actually cross: oxygen and fuel out, carbon dioxide and waste back. Everything upstream is logistics. Note the gates on the road home: veins carry blood at almost no pressure, so they rely on one-way valves and the squeeze of the muscles you walk with. Sit still long enough and the return slows down.',
      position: [-3, 3.6, 45],
      anchorFrom: [-3, 0, 20],
      anchorDistance: -16,
      eyeHeight: 7,
    },
  ],
};
