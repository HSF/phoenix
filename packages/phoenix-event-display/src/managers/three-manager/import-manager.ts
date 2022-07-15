import {
  DoubleSide,
  Mesh,
  LineSegments,
  LineBasicMaterial,
  MeshPhongMaterial,
  Object3D,
  Plane,
  Material,
  ObjectLoader,
  Color,
  FrontSide,
  Vector3,
} from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GeometryUIParameters } from '../../lib/types/geometry-ui-parameters';

/**
 * Manager for managing event display's import related functionality.
 */
export class ImportManager {
  /** Planes for clipping geometry. */
  private clipPlanes: Plane[];
  /** Object group ID containing event data. */
  private EVENT_DATA_ID: string;
  /** Object group ID containing detector geometries. */
  private GEOMETRIES_ID: string;

  /**
   * Constructor for the import manager.
   * @param clipPlanes Planes for clipping geometry.
   * @param EVENT_DATA_ID Object group ID containing event data.
   * @param GEOMETRIES_ID Object group ID containing detector geometries.
   */
  constructor(
    clipPlanes: Plane[],
    EVENT_DATA_ID: string,
    GEOMETRIES_ID: string
  ) {
    this.clipPlanes = clipPlanes;
    this.EVENT_DATA_ID = EVENT_DATA_ID;
    this.GEOMETRIES_ID = GEOMETRIES_ID;
  }

  /**
   * Loads an OBJ (.obj) geometry from the given filename.
   * @param filename Path to the geometry.
   * @param name Name given to the geometry.
   * @param color Color to initialize the geometry.
   * @param doubleSided Renders both sides of the material.
   * @param setFlat Whether object should be flat-shaded or not.
   * @returns Promise for loading the geometry.
   */
  public loadOBJGeometry(
    filename: string,
    name: string,
    color: any,
    doubleSided: boolean,
    setFlat: boolean
  ): Promise<GeometryUIParameters> {
    color = color ?? 0x41a6f4;
    const objLoader = new OBJLoader();

    return new Promise<GeometryUIParameters>((resolve, reject) => {
      objLoader.load(
        filename,
        (object) => {
          const processedObject = this.processOBJ(
            object,
            name,
            color,
            doubleSided,
            setFlat
          );

          resolve({ object: processedObject });
        },
        null,
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Parses and loads a geometry in OBJ (.obj) format.
   * @param geometry Geometry in OBJ (.obj) format.
   * @param name Name given to the geometry.
   * @returns The processed object.
   */
  public parseOBJGeometry(geometry: string, name: string): Object3D {
    const objLoader = new OBJLoader();
    const object = objLoader.parse(geometry);
    return this.processOBJ(object, name, 0x41a6f4, false, false);
  }

  /**
   * Process the geometry object being loaded from OBJ (.obj) format.
   * @param object 3D object.
   * @param name Name of the object.
   * @param color Color of the object.
   * @param doubleSided Renders both sides of the material.
   * @param setFlat Whether object should be flat-shaded or not.
   * @returns The processed object.
   */
  private processOBJ(
    object: Object3D,
    name: string,
    color: any,
    doubleSided: boolean,
    setFlat: boolean
  ): Object3D {
    object.name = name;
    object.userData = { name };
    return this.setObjFlat(object, color, doubleSided, setFlat);
  }

  /**
   * Process the 3D object and flatten it.
   * @param object3d Group of geometries that make up the object.
   * @param color Color of the object.
   * @param doubleSided Renders both sides of the material.
   * @param setFlat Whether object should be flat-shaded or not.
   * @returns The processed object.
   */
  private setObjFlat(
    object3d: Object3D,
    color: any,
    doubleSided: boolean,
    setFlat: boolean
  ): Object3D {
    const material2 = new MeshPhongMaterial({
      color: color,
      shininess: 0,
      wireframe: false,
      clippingPlanes: this.clipPlanes,
      clipIntersection: true,
      clipShadows: false,
      side: doubleSided ? DoubleSide : FrontSide,
      flatShading: setFlat,
    });

    object3d.traverse((child: Object3D) => {
      if (child instanceof Mesh) {
        child.name = object3d.name;
        child.userData = object3d.userData;
        child.userData.size = this.getObjectSize(child);
        // Use the new material
        if (child.material instanceof Material) {
          child.material.dispose();
          child.material = material2;
        }
        // enable casting shadows
        child.castShadow = false;
        child.receiveShadow = false;
      } else {
        if (
          child instanceof LineSegments &&
          child.material instanceof LineBasicMaterial
        ) {
          (child.material.color as Color).set(color);
        }
      }
    });
    return object3d;
  }

  /**
   * Parses and loads a scene in Phoenix (.phnx) format.
   * @param scene Geometry in Phoenix (.phnx) format.
   * @param callback Callback called after the scene is loaded.
   * @returns Promise for loading the scene.
   */
  public parsePhnxScene(
    scene: any,
    callback: (geometries: Object3D, eventData: Object3D) => void
  ): Promise<void> {
    const loader = new GLTFLoader();
    const sceneString = JSON.stringify(scene, null, 2);

    return new Promise<void>((resolve, reject) => {
      loader.parse(
        sceneString,
        '',
        (gltf) => {
          const eventData = gltf.scene.getObjectByName(this.EVENT_DATA_ID);
          const geometries = gltf.scene.getObjectByName(this.GEOMETRIES_ID);
          callback(eventData, geometries);
          resolve();
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Loads a GLTF (.gltf) scene(s)/geometry from the given URL.
   * @param sceneUrl URL to the GLTF (.gltf) file.
   * @param name Name of the loaded scene/geometry if a single scene is present, ignored if several scenes are present.
   * @param menuNodeName Path to the node in Phoenix menu to add the geometry to. Use `>` as a separator.
   * @param scale Scale of the geometry.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   * @returns Promise for loading the geometry.
   */
  public loadGLTFGeometry(
    sceneUrl: string,
    name: string,
    menuNodeName: string,
    scale: number,
    initiallyVisible: boolean
  ): Promise<GeometryUIParameters[]> {
    const loader = new GLTFLoader();
    return new Promise<GeometryUIParameters[]>((resolve, reject) => {
      loader.load(
        sceneUrl,
        (gltf) => {
          const allGeometries: GeometryUIParameters[] = [];

          for (const scene of gltf.scenes) {
            scene.visible = scene.userData.visible ?? initiallyVisible;
            const sceneName = this.processGLTFSceneName(
              scene.name,
              menuNodeName
            );

            this.processGeometry(
              scene,
              name ?? sceneName.name,
              scale,
              true // doublesided
            );

            allGeometries.push({
              object: scene,
              menuNodeName: menuNodeName ?? sceneName.menuNodeName,
            });
          }

          resolve(allGeometries);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Parses and loads a geometry in GLTF (.gltf) format.
   * @param geometry Geometry in GLTF (.gltf) format.
   * @param name Name given to the geometry.
   * @returns Promise for loading the geometry.
   */
  public parseGLTFGeometry(
    geometry: string | ArrayBuffer,
    name: string
  ): Promise<GeometryUIParameters[]> {
    const loader = new GLTFLoader();

    return new Promise<GeometryUIParameters[]>((resolve, reject) => {
      loader.parse(
        geometry,
        '',
        (gltf) => {
          const allGeometriesUIParameters: GeometryUIParameters[] = [];

          for (const scene of gltf.scenes) {
            scene.visible = scene.userData.visible;
            const sceneName = this.processGLTFSceneName(scene.name);
            this.processGeometry(scene, name ?? sceneName.name);

            allGeometriesUIParameters.push({
              object: scene,
            });
          }

          resolve(allGeometriesUIParameters);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * Get geometry name and menuNodeName from GLTF scene name.
   * @param sceneName GLTF scene name.
   * @param menuNodeName Path to the node in Phoenix menu to add the geometry to. Use `>` as a separator.
   * @returns Geometry name and menuNodeName if present in scene name.
   */
  private processGLTFSceneName(sceneName?: string, menuNodeName?: string) {
    if (sceneName) {
      const nodes = sceneName.split('_>_');
      menuNodeName && nodes.unshift(menuNodeName);
      const fullNodeName = nodes.join(' > ');
      nodes.pop();
      const menuName = nodes.join(' > ');

      return { name: fullNodeName, menuNodeName: menuName };
    }
  }

  /**
   * Loads geometries from JSON.
   * @param json JSON or URL to JSON file of the geometry.
   * @param name Name of the geometry or group of geometries.
   * @param scale Scale of the geometry.
   * @param doubleSided Renders both sides of the material.
   * @returns Promise for loading the geometry.
   */
  public loadJSONGeometry(
    json: string | { [key: string]: any },
    name: string,
    scale?: number,
    doubleSided?: boolean
  ): Promise<GeometryUIParameters> {
    const loader = new ObjectLoader();

    switch (typeof json) {
      case 'string':
        return new Promise<GeometryUIParameters>((resolve, reject) => {
          loader.load(
            json,
            (object: Object3D) => {
              this.processGeometry(object, name, scale, doubleSided);
              resolve({ object });
            },
            null,
            (error) => {
              reject(error);
            }
          );
        });
      case 'object':
        return new Promise<GeometryUIParameters>((resolve) => {
          const object = loader.parse(json);
          this.processGeometry(object, name, scale, doubleSided);
          resolve({ object });
        });
    }
  }

  /**
   * Process the geometry by setting up material and clipping attributes.
   * @param geometry Geometry to be processed.
   * @param name Name of the geometry.
   * @param scale Scale of the geometry.
   * @param doubleSided Renders both sides of the material.
   * @param transparent Whether the transparent property of geometry is true or false. Default `false`.
   */
  private processGeometry(
    geometry: Object3D,
    name: string,
    scale?: number,
    doubleSided?: boolean
  ) {
    geometry.name = name;
    // Set a custom scale if provided
    if (scale) {
      geometry.scale.setScalar(scale);
    }
    geometry.traverse((child) => {
      if (child instanceof Mesh) {
        child.name = child.userData.name = name;
        child.userData.size = this.getObjectSize(child);
        if (child.material instanceof Material) {
          const color = child.material['color']
            ? child.material['color']
            : 0x2fd691;
          const side = doubleSided ? DoubleSide : child.material['side'];

          // Disposing of the default material
          child.material.dispose();

          // Should tranparency be used?
          let isTransparent = false;
          if (geometry.userData.opacity) {
            isTransparent = true;
          }

          // Changing to a material with 0 shininess
          child.material = new MeshPhongMaterial({
            color,
            shininess: 0,
            side: side,
            transparent: isTransparent,
            opacity: geometry.userData.opacity ?? 1,
          });

          // Setting up the clipping planes
          child.material.clippingPlanes = this.clipPlanes;
          child.material.clipIntersection = true;
          child.material.clipShadows = false;
        }
      }
    });
  }

  /**
   * Get the size of object.
   * @param object Object to get the size of.
   * @returns The size (vector) of object as a string.
   */
  private getObjectSize(object: Mesh): string {
    const size = new Vector3();
    object.geometry.computeBoundingBox();
    object.geometry?.boundingBox?.getSize(size);
    return JSON.stringify(size, null, 2);
  }
}
