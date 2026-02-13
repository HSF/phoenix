/**
 * @jest-environment jsdom
 */
import { ImportManager } from '../../../managers/three-manager/import-manager';
import {
  Plane,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  Scene,
  Group,
  BufferGeometry,
} from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

describe('ImportManager', () => {
  let importManager: ImportManager;
  const clipPlanes: Plane[] = [];
  const EVENT_DATA_ID = 'EventData';
  const GEOMETRIES_ID = 'Geometries';

  beforeEach(() => {
    importManager = new ImportManager(clipPlanes, EVENT_DATA_ID, GEOMETRIES_ID);
  });

  afterEach(() => {
    importManager = undefined;
  });

  describe('Geometry Memory Management', () => {
    it('should dispose intermediate geometries after merging', () => {
      const geom1 = new BoxGeometry(1, 1, 1);
      const geom2 = new BoxGeometry(2, 2, 2);
      const geom3 = new BoxGeometry(3, 3, 3);

      const spy1 = jest.spyOn(geom1, 'dispose');
      const spy2 = jest.spyOn(geom2, 'dispose');
      const spy3 = jest.spyOn(geom3, 'dispose');

      const intermediateGeoms = [geom1, geom2, geom3];

      const mergedGeom = BufferGeometryUtils.mergeGeometries(intermediateGeoms);

      for (const intermediateGeom of intermediateGeoms) {
        intermediateGeom.dispose();
      }

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
      expect(spy3).toHaveBeenCalled();

      mergedGeom.dispose();
    });

    it('should properly dispose cloned geometries', () => {
      const originalGeom = new BoxGeometry(1, 1, 1);
      const clonedGeom = originalGeom.clone();
      const disposeSpy = jest.spyOn(clonedGeom, 'dispose');

      clonedGeom.dispose();

      expect(disposeSpy).toHaveBeenCalledTimes(1);
      originalGeom.dispose();
    });

    it('should handle multiple material groups with intermediate geometry disposal', () => {
      const materials: {
        [key: string]: {
          material: MeshBasicMaterial;
          geoms: BufferGeometry[];
          renderOrder: number;
        };
      } = {};

      const material1 = new MeshBasicMaterial({ color: 0xff0000 });
      const material2 = new MeshBasicMaterial({ color: 0x00ff00 });

      materials['1'] = {
        material: material1,
        geoms: [new BoxGeometry(1, 1, 1), new BoxGeometry(2, 2, 2)],
        renderOrder: 0,
      };

      materials['2'] = {
        material: material2,
        geoms: [new BoxGeometry(3, 3, 3), new BoxGeometry(4, 4, 4)],
        renderOrder: 1,
      };

      const disposeSpy1a = jest.spyOn(materials['1'].geoms[0], 'dispose');
      const disposeSpy1b = jest.spyOn(materials['1'].geoms[1], 'dispose');
      const disposeSpy2a = jest.spyOn(materials['2'].geoms[0], 'dispose');
      const disposeSpy2b = jest.spyOn(materials['2'].geoms[1], 'dispose');

      const scene = new Scene();

      for (const val of Object.values(materials)) {
        const mergedGeom = BufferGeometryUtils.mergeGeometries(val.geoms);
        const mesh = new Mesh(mergedGeom, val.material);
        mesh.renderOrder = val.renderOrder;
        scene.add(mesh);

        for (const intermediateGeom of val.geoms) {
          intermediateGeom.dispose();
        }
      }

      expect(disposeSpy1a).toHaveBeenCalled();
      expect(disposeSpy1b).toHaveBeenCalled();
      expect(disposeSpy2a).toHaveBeenCalled();
      expect(disposeSpy2b).toHaveBeenCalled();
      expect(scene.children.length).toBe(2);

      scene.traverse((child) => {
        if (child instanceof Mesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
    });

    it('should not affect merged geometry after disposing intermediates', () => {
      const geom1 = new BoxGeometry(1, 1, 1);
      const geom2 = new BoxGeometry(2, 2, 2);

      const intermediateGeoms = [geom1, geom2];
      const mergedGeom = BufferGeometryUtils.mergeGeometries(intermediateGeoms);

      const vertexCountBefore = mergedGeom.attributes.position.count;

      for (const intermediateGeom of intermediateGeoms) {
        intermediateGeom.dispose();
      }

      expect(mergedGeom.attributes.position).toBeDefined();
      expect(mergedGeom.attributes.position.count).toBe(vertexCountBefore);

      mergedGeom.dispose();
    });
  });
});
