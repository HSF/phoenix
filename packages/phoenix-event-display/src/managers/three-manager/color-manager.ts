import { Color, MeshPhongMaterial } from 'three';
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
      child.traverse((object) => {
        (object['material']?.color as Color)?.set(color);
      });
    }
  }

  /**
   * Changes the color of all objects inside an event data collection to some random color.
   * @param collectionName Name of the collection.
   */
  public collectionColorRandom(collectionName: string) {
    const collection = this.sceneManager
      .getScene()
      .getObjectByName(SceneManager.EVENT_DATA_ID)
      .getObjectByName(collectionName);

    for (const child of Object.values(collection.children)) {
      child.traverse((object) => {
        (object['material']?.color as Color)?.set(Math.random() * 0xffffff);
      });
    }
  }

  /**
   * Randomly color tracks by the vertex they are associated with.
   * @param collectionName Name of the collection.
   */
  public colorTracksByVertex(collectionName: string) {
    const scene = this.sceneManager.getScene();
    const vertices = scene.getObjectByName('Vertices');
    vertices.traverse((object) => {
      const { linkedTrackCollection, linkedTracks } = object.userData;

      if (
        object.name === 'Vertex' &&
        linkedTrackCollection === collectionName &&
        linkedTracks
      ) {
        const colorForTracksVertex = (object['material'] as MeshPhongMaterial)
          .color;
        const trackCollection = scene.getObjectByName(linkedTrackCollection);

        linkedTracks.forEach((trackIndex: number) => {
          trackCollection.children[trackIndex].traverse((trackObject) => {
            trackObject?.['material']?.color?.set(colorForTracksVertex);
          });
        });
      }
    });
  }
}
