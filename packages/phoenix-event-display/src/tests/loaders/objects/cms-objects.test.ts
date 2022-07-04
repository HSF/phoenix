import {
  Euler,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from 'three';
import { CMSObjects } from '../../../loaders/objects/cms-objects';

describe('CMSObjects', () => {
  let cmsObjects: CMSObjects;

  beforeEach(() => {
    cmsObjects = new CMSObjects();
  });

  it('should create an instance', () => {
    expect(cmsObjects).toBeTruthy();
  });

  it('should process the Muon Chamber from the given parameters', () => {
    const muonChamberParams = {
      front_1: [0, 0, 0],
      front_2: [1, 0, 0],
      front_3: [1, 1, 0],
      front_4: [0, 1, 0],
      back_1: [0, 0, 1],
      back_2: [1, 0, 1],
      back_3: [1, 1, 1],
      back_4: [0, 1, 1],
    };

    const muonChamber = CMSObjects.getMuonChamber(muonChamberParams);

    expect(muonChamber.children.length).toBe(2);
    expect(muonChamber.children[0].type).toBe('Mesh');
    expect(muonChamber.children[1].type).toBe('LineSegments');

    const mesh = muonChamber.children[0] as Mesh;
    expect(mesh.position).toBeInstanceOf(Vector3);
    expect(mesh.rotation).toBeInstanceOf(Euler);
    expect(mesh.geometry.attributes.position.count).toBe(36);
    expect(mesh.receiveShadow).toBe(false);
    expect(mesh.frustumCulled).toBe(true);
    expect(mesh.renderOrder).toBe(0);
    expect(mesh.animations).toHaveLength(0);
    expect(mesh.geometry.type).toBe('BufferGeometry');
    expect(mesh.material).toBeInstanceOf(MeshBasicMaterial);

    const lineSegments = muonChamber.children[1] as LineSegments;
    expect(lineSegments.position).toBeInstanceOf(Vector3);
    expect(lineSegments.rotation).toBeInstanceOf(Euler);
    expect(lineSegments.geometry.attributes.position.count).toBe(24);
    expect(lineSegments.visible).toBe(true);
    expect(lineSegments.castShadow).toBe(false);
    expect(lineSegments.renderOrder).toBe(0);
    expect(lineSegments.userData).toBeInstanceOf(Object);
    expect(lineSegments.geometry.type).toBe('EdgesGeometry');
    expect(lineSegments.material).toBeInstanceOf(LineBasicMaterial);

    expect(muonChamber.up.x).toBe(0);
    expect(muonChamber.up.y).toBe(1);
    expect(muonChamber.up.z).toBe(0);

    expect(muonChamber.position.x).toBe(0);
    expect(muonChamber.position.y).toBe(0);
    expect(muonChamber.position.z).toBe(0);

    expect(muonChamber.rotation.x).toBe(0);
    expect(muonChamber.rotation.y).toBe(0);
    expect(muonChamber.rotation.z).toBe(0);
    expect(muonChamber.rotation.order).toBe('XYZ');

    expect(muonChamber.quaternion.x).toBe(0);
    expect(muonChamber.quaternion.y).toBe(0);
    expect(muonChamber.quaternion.z).toBe(0);
    expect(muonChamber.quaternion.w).toBe(1);

    expect(muonChamber.scale.x).toBe(1);
    expect(muonChamber.scale.y).toBe(1);
    expect(muonChamber.scale.z).toBe(1);

    expect(muonChamber.matrix.elements[0]).toBe(1);
    expect(muonChamber.matrix.elements[1]).toBe(0);

    expect(muonChamber.matrixAutoUpdate).toBe(true);
    expect(muonChamber.matrixWorldNeedsUpdate).toBe(false);
    expect(muonChamber.layers.mask).toBe(1);
    expect(muonChamber.visible).toBe(true);
    expect(muonChamber.castShadow).toBe(false);
    expect(muonChamber.receiveShadow).toBe(false);
    expect(muonChamber.frustumCulled).toBe(true);
    expect(muonChamber.renderOrder).toBe(0);
    expect(muonChamber.animations).toHaveLength(0);
    expect(muonChamber.userData).toBeInstanceOf(Object);
  });
});
