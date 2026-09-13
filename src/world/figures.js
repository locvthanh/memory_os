import * as THREE from 'three';
import { ROLE_COLOR, MATERIAL_COLOR } from './stages.js';

// The inhabitants. Deliberately crude — four primitives and a hat — because
// they are built in JavaScript at runtime, not in Blender: the world has to be
// able to add one without anybody re-exporting a glb. Same trick Room OS uses
// for the things on its shelves.

const HEIGHT = 1.75;

export function buildFigure(person) {
  const g = new THREE.Group();
  g.name = `inhabitant-${person.id}`;
  const color = ROLE_COLOR[person.role] ?? 0x777777;

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.28, HEIGHT * 0.62, 7),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
  );
  body.position.y = HEIGHT * 0.31;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xe8c9a0, roughness: 0.9 }),
  );
  head.position.y = HEIGHT * 0.73;
  head.castShadow = true;
  g.add(head);

  // The hat is the name badge: you can tell the mason from the carter at
  // thirty metres, which is the distance most of this village is seen from.
  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.26, 0.22, 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
  );
  hat.position.y = HEIGHT * 0.86;
  g.add(hat);

  // A carried load, shown only when the state says they are carrying one.
  const load = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.3, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x9aa3a9, roughness: 0.95 }),
  );
  load.position.set(0, HEIGHT * 0.5, 0.34);
  load.visible = false;
  load.castShadow = true;
  g.add(load);
  g.userData.load = load;

  // The lamplighter carries the only light in the village that goes out.
  if (person.role === 'lamplighter') {
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0xffd98a,
        emissive: 0xffb648,
        emissiveIntensity: 1.4,
        roughness: 1,
      }),
    );
    lamp.position.set(0.3, HEIGHT * 0.55, 0.1);
    g.add(lamp);
  }

  g.userData.person = person;
  // One box makes the whole figure tappable; the parts are too small to hit
  // reliably on a phone.
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, HEIGHT, 0.8),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hit.position.y = HEIGHT / 2;
  hit.userData.pickPerson = person;
  g.add(hit);
  g.userData.hit = hit;

  return g;
}

export function setCarrying(figure, carrying) {
  const load = figure.userData.load;
  if (!load) return;
  load.visible = !!carrying;
  if (carrying && carrying.length) {
    load.material.color.setHex(MATERIAL_COLOR[carrying[0].material] ?? 0x9aa3a9);
  }
}
