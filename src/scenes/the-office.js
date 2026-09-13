// The Back Office — the room where the unwired scenes are kept.
//
// docs/scene-map.md audited which scenes nothing else points at: they sit on
// the hub list but nowhere in the world. This is the room that fixes that in
// one move. A small office in the same key as Room OS — cream walls, dark
// plank floor, ceiling panels, a desk, a corkboard, filing cabinets — whose
// north wall opens onto an arcade of doors, one per orphan scene.
//
// NOTHING HERE IS A FIXED ROOM. `blender_models/office_scenegen/build_office.py`
// reads this repo — src/scenes/index.js for the registered scenes, every other
// src/scenes/*.js for `link:` edges — works out which scenes have no inbound
// edge, and lays out exactly as many bays as that needs. It writes the model
// and `the-office.data.js`, which is where every door and every locus position
// below comes from. Add a scene and re-run the generator: the corridor grows a
// bay and a stop appears here. Wire a scene up from somewhere else and re-run:
// its door goes away and the corridor shortens. Never hand-edit the data file,
// and never hand-add a locus here.
//
// Reached from [[portal-island]] gate 5, which was an `xx` placeholder; this
// scene's first locus is the return leg, so the pair rule in docs/scene-map.md
// ("every door is a pair") holds.
//
// Camera: an interior, so every stop takes a NEGATIVE `anchorDistance`, which
// parks the rig on the corridor-centre side of each door and looks outward at
// it instead of backing through the wall. A door stop's `anchorFrom` is the
// corridor centreline at that door's own y, so the camera crosses to the
// opposite side and faces the leaf square on. All of that is computed by the
// generator and carried in the data file.
//
// The door loci set `hideLabel: true`. Every door already carries its own
// painted number beside the handle; a floating tour badge reading 4, 5, 6…
// next to it would contradict it — the same reason pin-factory hides badges at
// its ten numbered stations. The three room stops and the closing stop keep
// theirs.
import { BUILT, LOCI, WINGS } from './the-office.data.js';
import { getScene } from './index.js';

// Hand-written pegs, keyed by the scene the door opens. A door whose scene has
// no note here falls back to that scene's own hub blurb, so a newly generated
// door is never blank — write the note when the room earns one.
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
};

const trim = (s, n = 2) => {
  const parts = String(s || '').split(/(?<=\.)\s+/);
  return parts.slice(0, n).join(' ');
};

const wingLine = WINGS.map((w) => `${w.name} (${w.count})`).join(', ');

// The three room stops and the closing stop. Their geometry comes from the
// data file like everything else; only the words live here.
const ROOM_TEXT = {
  1: {
    title: 'The Register',
    description:
      `The desk by the door, and the book open on it: ORPHANS, ${BUILT.orphans} of ${BUILT.scenes}. ` +
      'Every scene that exists, is listed on the hub, and that no other scene points at — on the map but not in the world. ' +
      'This room is the fix: one door each, down the corridor behind you. The way you came in is the gate on Portal Island.',
    link: 'portal-island',
    linkLabel: 'Back through gate 5: Luân Hồi Đài →',
  },
  2: {
    title: 'The Map',
    description:
      `The corkboard: one card per registered scene, ${BUILT.scenes} of them. The pale ones are joined by red string — ` +
      'Portal Island to the Athenaeum to the White House to the Civil War to the War Museum, the connected web. ' +
      `The ${BUILT.orphans} amber ones have no string on them at all. Those are the doors in the corridor.`,
  },
  3: {
    title: 'The Corridor',
    description:
      `${BUILT.orphans} doors in ${BUILT.bays} bays under banners that name the wings: ${wingLine}. ` +
      'Door colour follows the banner, so a door tells you what kind of room it opens before you read its name. ' +
      'Where a wing holds an odd number, the spare slot is left as blank wall: room for one more of that kind. ' +
      'The runner ends at a frame with nothing in it.',
  },
  end: {
    title: 'Not Yet Built',
    description:
      'The end of the corridor: a cased frame with no leaf in it, lit from behind. ' +
      'The corridor is built one bay longer than the doors need, because it is rebuilt from the repo every time — ' +
      'write a scene and it grows a bay, wire a scene up from somewhere else and its door goes away. ' +
      'When the register is empty this room has done its job and becomes something else.',
  },
};

export default {
  background: 0xd8dee6,
  lighting: {
    hemisphere: 1.15,
    ambient: 0.9,
    ambientColor: 0xfff2e2,
    sun: 1.0,
    shadowExtent: 40,
  },
  labels: { worldSize: 0.55, offsetY: 0.65 },
  walkthrough: {
    travelSeconds: 4,
    dwellSeconds: 9,
    eyeHeight: 0.15,
    anchorDistance: -3.3,
    loop: true,
  },
  loci: LOCI.map((l) => {
    const base = {
      id: l.id,
      position: l.position,
      anchorFrom: l.anchorFrom,
      anchorDistance: l.anchorDistance,
      eyeHeight: l.eyeHeight,
    };
    if (l.kind === 'door') {
      const n = String(l.door).padStart(2, '0');
      return {
        ...base,
        title: `Door ${n} — ${l.sceneTitle}`,
        description:
          `${l.section}. ` +
          (NOTES[l.scene] || trim(getScene(l.scene)?.blurb) ||
            'A registered scene that nothing else in the palace points at.'),
        hideLabel: true,
        link: l.scene,
        linkLabel: `Open door ${n} →`,
      };
    }
    const t = ROOM_TEXT[l.kind === 'end' ? 'end' : l.id] || {};
    const extra = {};
    if (l.id === 2) extra.labelPosition = [l.position[0] + 0.2, l.position[1], l.position[2] - 2.05];
    if (l.kind === 'end') extra.labelPosition = [-1.15, 1.95, l.position[2] + 0.15];
    return { ...base, ...extra, title: t.title, description: t.description, link: t.link, linkLabel: t.linkLabel };
  }),
};
