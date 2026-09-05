// Registry of available 3D scenes. Add an entry per exported .glb.
export const SCENES = [
  {
    id: 'city',
    title: 'Low-Poly City',
    blurb: 'A quiet grid of streets, towers and pocket parks. Seven loci along the route.',
    model: 'models/city.glb',
    config: () => import('./city.js').then((m) => m.default),
  },
  {
    id: 'chinatown-street',
    title: 'Chinatown Street',
    blurb: 'A lantern-lit lane past a paifang gate and red shopfronts. Six loci down the street.',
    model: 'models/chinatown-street.glb',
    config: () => import('./chinatown-street.js').then((m) => m.default),
  },
  {
    id: 'coffee-shop',
    title: 'Coffee Shop',
    blurb: 'A small cafe: counter, pendant lamps, scattered tables. Five loci inside.',
    model: 'models/coffee-shop.glb',
    config: () => import('./coffee-shop.js').then((m) => m.default),
  },
  {
    id: 'portal-island',
    title: 'Portal Island',
    blurb: 'A floating island ringed by eight portal gates around a plaza, cabin and garden. Eight loci.',
    model: 'models/portal-island.glb',
    config: () => import('./portal-island.js').then((m) => m.default),
  },
  {
    id: 'writing-room',
    title: 'Writing Room',
    blurb: "An author's study: bookshelf, typewriter desk, hourglass, reading stool. Six loci.",
    model: 'models/writing-room.glb',
    config: () => import('./writing-room.js').then((m) => m.default),
  },
  {
    id: 'castle',
    title: 'Castle',
    blurb: 'A walled keep with corner towers and a gatehouse. Seven loci from the gate to the roof.',
    model: 'models/castle.glb',
    config: () => import('./castle.js').then((m) => m.default),
  },
  {
    id: 'time-machine',
    title: 'Time Machine',
    blurb: 'An orrery on a plinth with a timeline of markers running into the dark. Five loci.',
    model: 'models/time-machine.glb',
    config: () => import('./time-machine.js').then((m) => m.default),
  },
];

export function getScene(id) {
  return SCENES.find((s) => s.id === id) || null;
}
