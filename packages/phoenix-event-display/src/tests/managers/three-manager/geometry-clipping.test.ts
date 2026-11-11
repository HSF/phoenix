/**
 * @jest-environment jsdom
 */
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshPhongMaterial,
  Plane,
  Vector3,
} from 'three';
import { ThreeManager } from '../../../managers/three-manager/index';

describe('ThreeManager selective geometry clipping', () => {
  let three: any;
  let clipPlanes: Plane[];

  beforeEach(() => {
    clipPlanes = [
      new Plane(new Vector3(0, -1, 0), 0),
      new Plane(new Vector3(0, 1, 0), 0),
    ];
    three = Object.create(ThreeManager.prototype);
    three.clipPlanes = clipPlanes;
    three.clipIntersection = true;
    three.stateManager = null;
    three.isEventData = null;
    three.isVisible = null;
  });

  it('should exclude and re-include a geometry and its child meshes from clipping planes', () => {
    const group = new Group();
    const mat1 = new MeshPhongMaterial({ clippingPlanes: clipPlanes });
    const mat2 = new MeshPhongMaterial({ clippingPlanes: clipPlanes });
    const mesh1 = new Mesh(new BoxGeometry(1, 1, 1), mat1);
    const mesh2 = new Mesh(new BoxGeometry(1, 1, 1), mat2);
    group.add(mesh1, mesh2);

    // Exclude from slicing
    three.setGeometryClipping(group, false);

    expect(group.userData.clippingEnabled).toBe(false);
    expect(mesh1.userData.clippingEnabled).toBe(false);
    expect(mat1.clippingPlanes).toEqual([]);
    expect(mat2.clippingPlanes).toEqual([]);

    // Re-include in slicing
    three.setGeometryClipping(group, true);

    expect(group.userData.clippingEnabled).toBe(true);
    expect(mesh1.userData.clippingEnabled).toBe(true);
    expect(mat1.clippingPlanes).toBe(clipPlanes);
    expect(mat2.clippingPlanes).toBe(clipPlanes);
  });

  it('should treat unclipped geometries as visible during raycast filtering even in clipped regions', () => {
    three.filterRayIntersect();

    const mesh = new Mesh(
      new BoxGeometry(1, 1, 1),
      new MeshPhongMaterial({ clippingPlanes: clipPlanes }),
    );
    three.setGeometryClipping(mesh, false);

    // Point that would normally be rejected by clipPlanes
    const intersect = {
      object: mesh,
      point: new Vector3(0, 10, 0),
    };

    expect(three.isVisible(intersect)).toBe(true);
  });
});
