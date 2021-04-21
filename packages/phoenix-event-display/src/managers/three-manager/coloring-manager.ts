import { SceneManager } from './scene-manager';

/**
 * Coloring manager for three.js functions related to coloring of objects.
 */
export class ColoringManager {
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
      if (object.material?.color && customCheck?.(object.userData)) {
        object.material.color.set(color);
      }
    });
  }
}
