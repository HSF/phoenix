import {
  Color,
  MeshPhongMaterial,
  Mesh,
  Object3D,
  type Object3DEventMap,
  Line,
  Points,
} from 'three';
import { SceneManager } from './scene-manager';
import { PhoenixMenuNode } from '../ui-manager/phoenix-menu/phoenix-menu-node';
import { type ConfigColor } from '../ui-manager/phoenix-menu/config-types';

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
   * Color objects by a color computed from each object's parameters.
   * @param objectsGroup Name of the object(s) group to color.
   * @param getColor Function computing the color from object params, or
   * `undefined` to leave the object's color unchanged.
   */
  colorObjectsByComputedColor(
    objectsGroup: string,
    getColor: (objectUserData: any) => Color | string | undefined,
  ) {
    const objects = this.sceneManager.getScene().getObjectByName(objectsGroup);
    if (objects) {
      objects.traverse((object: any) => {
        if (object.material?.color) {
          const color = getColor(object.userData);
          if (color !== undefined) {
            object.material.color.set(color);
          }
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
   * @param optionsFolder Reporting random color back to the menu color box.
   */
  public collectionColorRandom(
    collectionName: string,
    optionsFolder?: PhoenixMenuNode,
  ) {
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
            const randomColor = Math.floor(Math.random() * 0xffffff);
            setColorForObject(object, randomColor);
            if (typeof optionsFolder === 'undefined') {
              return;
            }
            if (optionsFolder.configs.length < 1) {
              return;
            }
            if (optionsFolder.configs[0].type !== 'color') {
              return;
            }
            const configColor = optionsFolder.configs[0] as ConfigColor;
            configColor.color = `#${randomColor.toString(16)}`;
          });
        }
      }
    }
  }

  /**
   * Color tracks by the vertex they are associated with, giving each vertex
   * (and its linked tracks) a distinct color.
   * @param collectionName Name of the track collection.
   * @returns The number of tracks that were colored.
   */
  public colorTracksByVertex(collectionName: string): number {
    const scene = this.sceneManager.getScene();
    const vertices = scene.getObjectByName('Vertices');
    if (!vertices) {
      return 0;
    }

    const vertexObjects: Object3D[] = [];
    vertices.traverse((object) => {
      if (object.name === 'Vertex') {
        vertexObjects.push(object);
      }
    });

    const trackCollection = scene.getObjectByName(collectionName);
    // Tracks can be dropped on load, so prefer matching by the original index
    // stored in userData over the position in the collection.
    const tracksByIndex = new Map<number, Object3D>();
    trackCollection?.children.forEach((track) => {
      if (track.userData.index !== undefined) {
        tracksByIndex.set(track.userData.index, track);
      }
    });

    let coloredTracks = 0;
    vertexObjects.forEach((vertexObject, vertexIndex) => {
      const { linkedTrackCollection, linkedTracks } = vertexObject.userData;
      if (
        !trackCollection ||
        !linkedTrackCollection?.includes(collectionName) ||
        !linkedTracks
      ) {
        return;
      }

      const collectionIndex = linkedTrackCollection.indexOf(collectionName);
      // Use explicit vertex color if set in event data, otherwise the current
      // material color (e.g. set by the user via the UI), otherwise deterministic
      // distinct color per vertex (golden ratio hue steps).
      const materialColor =
        vertexObject instanceof Mesh
          ? ((vertexObject.material as any)?.color as Color | undefined)
          : undefined;
      const vertexColor =
        vertexObject.userData.color ??
        materialColor ??
        new Color().setHSL((vertexIndex * 0.618034) % 1, 0.9, 0.55);

      setColorForObject(vertexObject, vertexColor);
      linkedTracks[collectionIndex].forEach((trackIndex: number) => {
        const track =
          tracksByIndex.get(trackIndex) ?? trackCollection.children[trackIndex];
        track?.traverse((trackObject) => {
          setColorForObject(trackObject, vertexColor);
        });
        if (track) {
          coloredTracks++;
        }
      });
    });

    return coloredTracks;
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
  } else if (object instanceof Line) {
    const line = object as Line;
    const material = line.material;
    if ('color' in material) {
      (material.color as Color).set(color);
    }
  } else if (object instanceof Points) {
    const points = object as Points;
    const material = points.material;
    if ('color' in material) {
      (material.color as Color).set(color);
    }
  }
}
