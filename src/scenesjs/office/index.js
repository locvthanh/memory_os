// The Back Office, part 4 of 4: the build hook and the stops.
//
// Viewer calls `build` instead of loading a glb (see src/viewer/Viewer.js).
// This runs the audit, lays out the corridor, assembles the room, and fills in
// the scene's `loci` before returning — which is legal because Viewer reads
// `config.loci` only after the build promise resolves.
import { plan, slotPose, M, SELF } from './plan.js';
import { buildRoom } from './room.js';
import { getScene } from '../../scenes/index.js';

const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;

// Hand-written pegs, keyed by the scene the door opens. A door whose scene has
// no note here falls back to that scene's own hub blurb, so a door that
// appeared by itself an hour ago is never blank — write the note when the room
// earns one.
const NOTES = {
  'solar-system':
    'The Sun to the Kuiper Belt with true relative planet sizes and square-root compressed distances, so the whole system fits one view. Twelve loci. Nothing in the palace pointed at it until this corridor did.',
  'india-history':
    'A low-poly valley where a road runs beside a river past 4,500 years, Mohenjo-daro to the Constitution of 1950, twenty-five monuments in chronological order. Portal Island’s Hindi gate is its other natural door — still unwired.',
  'nobel-hall':
    'Every Nobel Prize 2021–2025, all six prizes and 64 laureates, on a plaza shaped like a medal lying in water. Years grow outward like tree rings; the rim plinths are empty, waiting for 2026.',
  'cfa-level-1':
    'The whole CFA Level I curriculum as an island city under one rule: every building’s height is its exam weight. Twenty-seven stops, from the marble Ethics courthouse down to the Derivatives pit.',
  'macro-hydraulic-hall':
    'Phillips’s MONIAC in a steampunk engine hall: an economy modelled in coloured water. It is the hub of the macro series, and it has nine doors of its own that still lead nowhere.',
  'the-stack':
    'Software engineering as one night city in a stepped pit, altitude = abstraction, fifty-one stops from Grace Hopper’s moth up to the Antilibrary Gate. It links out to two scenes and nothing linked in.',
  'body-heart':
    'The heart as a two-storey building at 1:130,000 — right side blue, left side red, and the wall the whole room exists to show: three times thicker on the side that has to reach your toes.',
  'body-lungs':
    'The lungs walked the way the air goes, ending at a tennis court built at true size, because that is the surface area folded into your chest. Scene two of the Human Body series.',
  'grab-workplace':
    'Tony’s Grab org as one hexagonal building: Tech Infra due north, VN R&D, and the four teams behind their own coloured portals. Its own Open Door locus is still waiting for a scene.',
  'lunar-base':
    'A Moon settlement seen through a canted hexagonal window from a crater-rim lounge, recreated from an illustration by solving its camera first. Three stops indoors, seven out on the plain.',
  'future-city':
    'A solarpunk river capital from a terrace ninety metres up, its camera solved from the ellipse ratios of two rings in the source picture, then built out past the frame so you can leave it.',
  'sky-loft':
    'An empty palace in the future: a pale apartment high in a tower, sixteen blank pegs, a flying car banking past the glass. Portal Island’s Lux Garden gate was always meant for this one.',
  'hutong-corner':
    'A grey-brick Beijing alley that turns a corner: name stone, lantern line, courtyard gate, spirit screen, chess table, moon gate. Fourteen blank pegs at fourteen different heights.',
  'misty-valley':
    'A river valley under a snow range — ford, standing stones, broken watchtower, three-arch bridge, gorge, peak. Every landmark invented, and picked to be impossible to confuse with its neighbour.',
  'meditation-ledge':
    'A timber deck cantilevered off a granite cliff at dawn above a sea of cloud. Ten stops that are also the ten stations of a sit. The camera never leaves the deck.',
  'glacier-deck':
    'A sitting platform above a crevassed glacier at sunset, recreated from a photograph. The only room in the palace with no loci and no tour — so it can be entered but can never link back. The one legitimate dead end here, and it is meant to be one.',
  'tuoitre-vn':
    'A hundred metres of Saigon shophouse with an alley per section of Tuổi Trẻ, each bảng tin carrying that section’s stories as newsprint, newest nearest the street. Built from the live feed when you open it, so it has no pegs to hold.',
  'cafef-vn':
    'A brokerage floor with a twenty-two-metre bảng điện on the end wall carrying real VN-INDEX, VN30 and blue-chip numbers in the Vietnamese colours, and eight dealing bays holding CafeF’s sections. As full or as empty as the trading clock says.',
  'endless-survey':
    'A twelve-sided rotunda of today’s anniversaries, and beyond each arch an octagonal room built out of the article you walked into — six more doors from whatever it cites first, each level a little lower than the last. It has no end.',
};

const trim = (s, n = 2) => String(s || '').split(/(?<=\.)\s+/).slice(0, n).join(' ');

function lociFor(p) {
  const loci = [];
  let id = 0;
  const add = (o) => { id += 1; loci.push({ id, ...o }); };

  add({
    title: 'The Register',
    description:
      `The desk by the door, and the book open on it: ORPHANS, ${p.orphans} of ${p.scenes}. `
      + 'Every scene that exists, is listed on the hub, and that no other scene points at — on the map but not in the world. '
      + 'The count is read off the repo the moment you walk in, not off anything anybody remembered to update. '
      + 'The way you came in is the gate on Portal Island.',
    position: [-2.95, 1.0, 6.5],
    anchorFrom: [0, 0, 4.5],
    anchorDistance: -3.0,
    eyeHeight: 0.85,
    link: 'portal-island',
    linkLabel: 'Back through gate 5: Luân Hồi Đài →',
  });
  add({
    title: 'The Map',
    description:
      `The corkboard: one card per registered scene, ${p.scenes} of them. The pale ones are joined by red string — `
      + 'the connected web that runs from Portal Island through the Athenaeum and the White House to the War Museum. '
      + `The ${p.orphans} amber ones have no string on them at all. Those are the doors in the corridor.`,
    position: [-5.32, 1.62, 3.2],
    anchorFrom: [0, 0, 3.2],
    anchorDistance: -3.6,
    eyeHeight: 0.25,
    labelPosition: [-5.12, 1.6, 1.15],
  });
  add({
    title: 'The Corridor',
    description:
      `${p.orphans} doors in ${p.bays} bays under banners that name the wings: `
      + `${p.wings.map((w) => `${w.name} (${w.count})`).join(', ')}. `
      + 'Door colour follows the banner, so a door tells you what kind of room it opens before you read its name. '
      + 'Where a wing holds an odd number the spare slot is left as blank wall: room for one more of that kind. '
      + 'The doors do not open by walking into them — tap the coloured badge standing in front of one and this panel '
      + 'comes back with that door’s scene in it. Nothing here is baked: the corridor is measured out from the repo '
      + 'every time the room is opened, so a scene pushed an hour ago already has its door.',
    position: [0, 1.75, -0.3],
    anchorFrom: [0, 0, 6.0],
    anchorDistance: -7.0,
    eyeHeight: 0.1,
  });

  p.slots.forEach((slot, i) => {
    if (!slot) return;
    const { x, z, side } = slotPose(p, i);
    const n = String(slot.n).padStart(2, '0');
    add({
      title: `Door ${n} — ${slot.title}`,
      description: `${slot.section}. `
        + (NOTES[slot.id] || trim(getScene(slot.id)?.blurb)
          || 'A registered scene that nothing else in the palace points at.'),
      position: [x - side * 0.16, 1.75, z],
      anchorFrom: [0, 0, z],
      anchorDistance: -3.3,
      eyeHeight: 0.15,
      // The badge prints the DOOR's number, not the tour index: the number is
      // already painted on the wall beside the handle. It is tinted with its
      // wing's colour, and stands at handle height clear of the name plate.
      labelText: n,
      labelColor: hex(slot.leaf),
      labelPosition: [x - side * 0.62, 1.45, z],
      link: slot.id,
      linkLabel: `Open door ${n} →`,
    });
  });

  add({
    title: 'Not Yet Built',
    description:
      'The end of the corridor: a cased frame with no leaf in it, lit from behind. '
      + 'The corridor is built one bay longer than the doors need, and it is rebuilt from scratch on every visit — '
      + 'write a scene and it grows a bay, wire a scene up from somewhere else and its door is gone the next time '
      + 'you walk in. When the register is empty this room has done its job and becomes something else.',
    position: [0, 1.35, p.end + 0.3],
    anchorFrom: [0, 0, p.end + 6.0],
    anchorDistance: -6.0,
    eyeHeight: 0.35,
    labelPosition: [-1.15, 1.95, p.end + 0.45],
  });

  return loci;
}

/**
 * The hook. `config` is the scene's own default export, handed in so the stops
 * can be written onto it once the corridor is known.
 */
export async function build({ setStatus }, config) {
  if (setStatus) setStatus('Reading the map…');
  const p = await plan();
  if (setStatus) setStatus(`Hanging ${p.orphans} doors…`);
  const root = buildRoom(p);
  config.loci = lociFor(p);
  config.built = p;
  return root;
}

export { SELF, M };
