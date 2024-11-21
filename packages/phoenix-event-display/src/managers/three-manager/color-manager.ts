import {
  Color,
  MeshPhongMaterial,
  Mesh,
  Object3D,
  Material,
  type Object3DEventMap,
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
    customCheck: (objectUserData: any) => boolean,
  ) {
    const objects = this.sceneManager.getScene().getObjectByName(objectsGroup);
    if (objects) {
      objects.traverse((object: any) => {
        if (object.material?.color && customCheck(object.userData)) {
          object.material.color.set(color);
        }
      });
    }
  }

  /**
   * Changes the color of all objects inside an event data collection.
   * @param collectionName Name of the collection.
   * @param color Hex value representing the color.
   */
  public collectionColor(collectionName: string, color: any) {
    const eventData = this.sceneManager
      .getScene()
      .getObjectByName(SceneManager.EVENT_DATA_ID);
    const collection = eventData?.getObjectByName(collectionName);

    if (collection) {
      for (const child of Object.values(collection.children)) {
        child.traverse((object) => {
          setColorForObject(object, color);
        });
      }
    }
  }

  /**
   * Changes the color of all objects inside an event data collection to some random color.
   * @param collectionName Name of the collection.
   */
  public collectionColorRandom(collectionName: string) {
    if (!this.sceneManager || !this.sceneManager.getScene()) {
      return;
    }
    const scene = this.sceneManager.getScene();
    if (scene) {
      const eventData = scene.getObjectByName(SceneManager.EVENT_DATA_ID);
      const collection = eventData?.getObjectByName(collectionName);

      if (collection) {
        for (const child of Object.values(collection.children)) {
          child.traverse((object) => {
            const randomColor = Math.random() * 0xffffff;
            setColorForObject(object, randomColor);
          });
        }
      }
    }
  }

  /**
   * Randomly color tracks by the vertex they are associated with.
   * @param collectionName Name of the collection.
   */
  public colorTracksByVertex(collectionName: string) {
    const scene = this.sceneManager.getScene();
    const vertices = scene.getObjectByName('Vertices');
    if (!vertices) {
      return;
    }
    vertices.traverse((object) => {
      const { linkedTrackCollection, linkedTracks } = object.userData;
      if (
        object.name === 'Vertex' &&
        linkedTrackCollection === collectionName &&
        linkedTracks
      ) {
        const mat = (object as Mesh).material as Material;
        if ('color' in mat) {
          // Should always be true, but basetype doesn't have color property
          const colorForTracksVertex = mat.color;
          const trackCollection = scene.getObjectByName(linkedTrackCollection);
          if (trackCollection) {
            linkedTracks.forEach((trackIndex: number) => {
              trackCollection.children[trackIndex].traverse((trackObject) => {
                setColorForObject(trackObject, colorForTracksVertex);
              });
            });
          }
        }
      }
    });
  }
}
/**
 * Change colour of object.
 * @param object Object to be update
 * @param color Color to set for the object.
 */
function setColorForObject(object: Object3D<Object3DEventMap>, color: any) {
  if (object instanceof Mesh) {
    const mesh = object as Mesh;
    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((mat) => {
        (mat as MeshPhongMaterial)?.color?.set(color);
      });
    } else if ('color' in material) {
      (material.color as Color).set(color);
    }
  }
}
