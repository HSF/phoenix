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
   * @param propertyName Name of the property by which to color the object.
   * @param value Value to check in the property for coloring.
   * @param customCheck Function to custom check values against object params.
   */
  colorObjectsByProperty(
    color: any,
    objectsGroup: string,
    propertyName?: string,
    value?: [number, number] | number | string,
    customCheck?: (objectUserData: any) => boolean
  ) {
    const objects = this.sceneManager.getScene().getObjectByName(objectsGroup);
    objects.traverse((object: any) => {
      if (object.material?.color) {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            if (
              object.userData?.[propertyName] >= value[0] &&
              object.userData?.[propertyName] <= value[1]
            ) {
              object.material.color.set(color);
            }
          } else if (object.userData?.[propertyName] === value) {
            object.material.color.set(color);
          }
        } else if (customCheck?.(object.userData)) {
          object.material.color.set(color);
        }
      }
    });
  }
}
