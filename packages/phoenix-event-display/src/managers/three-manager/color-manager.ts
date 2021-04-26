import {
  Line,
  Mesh,
  Points,
  LineBasicMaterial,
  MeshBasicMaterial,
  PointsMaterial,
  MeshPhongMaterial,
  MeshToonMaterial,
  Color,
} from 'three';
import { SceneManager } from './scene-manager';

/**
 * Color manager for three.js functions related to coloring of objects.
 */
export class ColorManager {
  /**
   * Create the coloring manager.
   * @param sceneManager The scene manager responsible for managing the three.js scene.
   */
  constructor(private sceneManager: SceneManager) {}

  /**
   * Color objects by a property's value or range.
   * @param color Color to set for the object.
   * @param objectsGroup Name of the object(s) group to color.
   * @param customCheck Function to custom check values against object params.
   */
  colorObjectsByProperty(
    color: any,
    objectsGroup: string,
    customCheck: (objectUserData: any) => boolean
  ) {
    const objects = this.sceneManager.getScene().getObjectByName(objectsGroup);
    objects.traverse((object: any) => {
      if (object.material?.color && customCheck(object.userData)) {
        object.material.color.set(color);
      }
    });
  }

  /**
   * Changes the color of all objects inside an event data collection.
   * @param collectionName Name of the collection.
   * @param color Hex value representing the color.
   */
  public collectionColor(collectionName: string, color: any) {
    const collection = this.sceneManager
      .getScene()
      .getObjectByName(SceneManager.EVENT_DATA_ID)
      .getObjectByName(collectionName);

    for (const child of Object.values(collection.children)) {
      child.traverse((object: THREE.Object3D) => {
        // For jets and tracks
        if (
          object instanceof Line ||
          object instanceof Mesh ||
          object instanceof Points
        ) {
          if (
            object.material instanceof LineBasicMaterial ||
            object.material instanceof MeshBasicMaterial ||
            object.material instanceof MeshBasicMaterial ||
            object.material instanceof PointsMaterial ||
            object.material instanceof MeshPhongMaterial ||
            object.material instanceof MeshToonMaterial
          ) {
            (object.material.color as Color).set(color);
          }
        }
      });
    }
  }
}
