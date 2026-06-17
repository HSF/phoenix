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
  Matrix4,
  REVISION,
  ColorRepresentation,
  Texture,
  BufferGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
} from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import type { GeometryUIParameters } from '../../lib/types/geometry-ui-parameters';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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

  /** Cached GLTFLoader instance */
  private gltfLoader?: GLTFLoader;
  /** Cached OBJLoader instance */
  private objLoader?: OBJLoader;
  /** Cached ObjectLoader instance */
  private objectLoader?: ObjectLoader;

  /**
   * Constructor for the import manager.
   * @param clipPlanes Planes for clipping geometry.
   * @param EVENT_DATA_ID Object group ID containing event data.
   * @param GEOMETRIES_ID Object group ID containing detector geometries.
   */
  constructor(
    clipPlanes: Plane[],
    EVENT_DATA_ID: string,
    GEOMETRIES_ID: string,
  ) {
    this.clipPlanes = clipPlanes;
    this.EVENT_DATA_ID = EVENT_DATA_ID;
    this.GEOMETRIES_ID = GEOMETRIES_ID;
  }

  /**
   * Lazily instantiates and caches the GLTFLoader and DRACOLoader.
   * @returns The GLTFLoader instance.
   */
  private getGLTFLoader(): GLTFLoader {
    if (!this.gltfLoader) {
      this.gltfLoader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      // Optimization Note: Consider hosting these files locally in production
      dracoLoader.setDecoderPath(
        `https://cdn.jsdelivr.net/npm/three@0.${REVISION}.0/examples/jsm/libs/draco/`,
      );
      this.gltfLoader.setDRACOLoader(dracoLoader);
    }
    return this.gltfLoader;
  }

  /**
   * Lazily instantiates and caches the OBJLoader.
   * @returns The OBJLoader instance.
   */
  private getOBJLoader(): OBJLoader {
    if (!this.objLoader) this.objLoader = new OBJLoader();
    return this.objLoader;
  }

  /**
   * Lazily instantiates and caches the ObjectLoader.
   * @returns The ObjectLoader instance.
   */
  private getObjectLoader(): ObjectLoader {
    if (!this.objectLoader) this.objectLoader = new ObjectLoader();
    return this.objectLoader;
  }

  /**
   * Helper to safely dispose of a material and its associated textures to prevent GPU memory leaks.
   * @param material The material or array of materials to dispose.
   */
  private disposeMaterial(material: Material | Material[]) {
    const materials = Array.isArray(material) ? material : [material];
    for (const mat of materials) {
      mat.dispose();
      // Dispose of textures attached to the material
      for (const key in mat) {
        const value = (mat as unknown as Record<string, unknown>)[key];
        if (value && value instanceof Texture) {
          value.dispose();
        }
      }
    }
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
  public async loadOBJGeometry(
    filename: string,
    name: string,
    color: ColorRepresentation,
    doubleSided: boolean,
    setFlat: boolean,
  ): Promise<GeometryUIParameters> {
    const finalColor = color ?? 0x41a6f4;
    const loader = this.getOBJLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        filename,
        (object) => {
          const processedObject = this.processOBJ(
            object,
            name,
            finalColor,
            doubleSided,
            setFlat,
          );
          resolve({ object: processedObject });
        },
        undefined,
        (error) => reject(error),
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
    const loader = this.getOBJLoader();
    const object = loader.parse(geometry);
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
    color: ColorRepresentation,
    doubleSided: boolean,
    setFlat: boolean,
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
    color: ColorRepresentation,
    doubleSided: boolean,
    setFlat: boolean,
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

        if (child.material) {
          this.disposeMaterial(child.material);
        }
        child.material = material2;
        child.castShadow = false;
        child.receiveShadow = false;
      } else if (
        child instanceof LineSegments &&
        child.material instanceof LineBasicMaterial
      ) {
        child.material.color.set(color as Color);
      }
    });
    return object3d;
  }

  /**
   * Parses and loads a scene in Phoenix (.phnx) format.
   * Resolves to an object containing eventData and geometries.
   * @param scene Geometry in Phoenix (.phnx) format.
   * @returns Promise for loading the scene.
   */
  public async parsePhnxScene(
    scene: Record<string, unknown>,
  ): Promise<{ geometries?: Object3D; eventData?: Object3D }> {
    const loader = this.getGLTFLoader();
    const sceneString = JSON.stringify(scene, null, 2);

    return new Promise((resolve, reject) => {
      loader.parse(
        sceneString,
        '',
        (gltf) => {
          const eventData = gltf.scene.getObjectByName(this.EVENT_DATA_ID);
          const geometries = gltf.scene.getObjectByName(this.GEOMETRIES_ID);
          resolve({ eventData, geometries });
        },
        (error) => reject(error),
      );
    });
  }

  /**
   * Modernized async/await handler for processing standard files or extracting zips.
   * @param filename Name of the original file.
   * @param data Content of the original file.
   * @param path Path of the original file.
   * @param processFileCallback The method to be called on each file content.
   * @returns Promise for loading the geometry.
   */
  private async handleZipOrArrayBuffer(
    filename: string,
    data: ArrayBuffer,
    path: string,
    processFileCallback: (
      fileContent: ArrayBuffer,
      filePath: string,
      name: string,
    ) => Promise<GeometryUIParameters[]>,
  ): Promise<GeometryUIParameters[]> {
    if (filename.toLowerCase().endsWith('.zip')) {
      try {
        const JSZip = (await import('jszip')).default;
        const archive = await JSZip.loadAsync(data);
        const promises: Promise<GeometryUIParameters[]>[] = [];

        for (const [filePath, zipObject] of Object.entries(archive.files)) {
          if (!zipObject.dir) {
            const filePromise = zipObject
              .async('arraybuffer')
              .then((fileData) => {
                const extractedName = filePath.split('.')[0];
                return processFileCallback(fileData, path, extractedName);
              });
            promises.push(filePromise);
          }
        }

        const results = await Promise.allSettled(promises);
        const successfulGeometries: GeometryUIParameters[] = [];
        for (const result of results) {
          if (result.status === 'fulfilled') {
            successfulGeometries.push(...result.value);
          } else {
            console.warn(
              'Failed to parse a file within the zip archive:',
              result.reason,
            );
          }
        }
        return successfulGeometries;
      } catch (error) {
        console.error('Failed to extract or parse zip archive:', error);
        throw error;
      }
    }

    const name = filename.split('.')[0];
    return processFileCallback(data, path, name);
  }

  /**
   * Loads a GLTF (.gltf,.glb) scene(s)/geometry from the given URL.
   * Also supports zipped versions of the files.
   * @param sceneUrl URL to the GLTF (.gltf/.glb or a zip with such file(s)) file.
   * @param name Name of the loaded scene/geometry if a single scene is present, ignored if several scenes are present.
   * @param menuNodeName Path to the node in Phoenix menu to add the geometry to. Use `>` as a separator.
   * @param scale Scale of the geometry.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   * @returns Promise for loading the geometry.
   */
  public async loadGLTFGeometry(
    sceneUrl: string,
    name: string,
    menuNodeName: string,
    scale: number,
    initiallyVisible: boolean,
  ): Promise<GeometryUIParameters[]> {
    const response = await fetch(sceneUrl);
    if (!response.ok) throw new Error(`Failed to fetch ${sceneUrl}`);

    const data = await response.arrayBuffer();
    const path = sceneUrl.substring(0, sceneUrl.lastIndexOf('/') + 1);

    return this.handleZipOrArrayBuffer(
      sceneUrl,
      data,
      path,
      (fileContent, filePath, extractedName) => {
        return this.parseGLTFData(
          fileContent,
          filePath,
          name || extractedName,
          menuNodeName,
          scale,
          initiallyVisible,
        );
      },
    );
  }

  /**
   * Parses and loads a geometry in GLTF (.gltf,.glb) format from a File object.
   * Also supports zip versions of those.
   * @param file Geometry file in GLTF (.gltf or .glb) format or zip file containing them.
   * @returns Promise for loading the geometry.
   */
  public async parseGLTFGeometry(file: File): Promise<GeometryUIParameters[]> {
    const data = await file.arrayBuffer();
    return this.handleZipOrArrayBuffer(
      file.name,
      data,
      '',
      (fileContent, filePath, extractedName) => {
        return this.parseGLTFData(
          fileContent,
          filePath,
          extractedName,
          '',
          1,
          true,
        );
      },
    );
  }

  /**
   * Unified parsing logic for GLTF data.
   * @param sceneData ArrayBuffer containing the geometry file's content (gltf or glb data).
   * @param path The base path from which to find subsequent glTF resources.
   * @param name Name given to the geometry.
   * @param menuNodeName Path to the node in Phoenix menu to add the geometry to.
   * @param scale Scale of the geometry.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   * @returns Promise for loading the geometry.
   */
  private parseGLTFData(
    sceneData: ArrayBuffer,
    path: string,
    name: string,
    menuNodeName: string,
    scale: number,
    initiallyVisible: boolean,
  ): Promise<GeometryUIParameters[]> {
    const loader = this.getGLTFLoader();

    return new Promise((resolve, reject) => {
      loader.parse(
        sceneData,
        path,
        (gltf) => {
          const allGeometries: GeometryUIParameters[] = [];

          for (const scene of gltf.scenes) {
            scene.visible = scene.userData.visible ?? initiallyVisible;
            const sceneName = this.processGLTFSceneName(
              scene.name,
              menuNodeName,
            );

            const materials: Record<
              string,
              {
                material: Material;
                geoms: BufferGeometry[];
                renderOrder: number;
              }
            > = {};

            const findMeshes = (
              node: Object3D,
              parentMatrix: Matrix4,
              depth: number,
            ) => {
              const mat = parentMatrix.clone().multiply(node.matrix);
              if (node instanceof Mesh) {
                const materialId = (node.material as any).id.toString();
                if (!materials[materialId]) {
                  materials[materialId] = {
                    material: node.material as Material,
                    geoms: [],
                    renderOrder: -depth,
                  };
                }
                materials[materialId].geoms.push(
                  node.geometry.clone().applyMatrix4(mat),
                );
              }

              for (const obj of node.children) {
                findMeshes(obj, mat, depth + 1);
              }
            };

            findMeshes(scene, new Matrix4(), 0);

            // Improve render order for transparent materials and merge geometries
            scene.remove(...scene.children);
            for (const val of Object.values(materials)) {
              if (val.geoms.length === 0) continue;

              try {
                const mergedGeometry = BufferGeometryUtils.mergeGeometries(
                  val.geoms,
                );
                if (mergedGeometry) {
                  const mesh = new Mesh(mergedGeometry, val.material);
                  mesh.renderOrder = val.renderOrder;
                  scene.add(mesh);
                }
              } catch (e) {
                console.warn('Failed to merge geometries:', e);
                // Fallback to adding individual meshes if merging fails
                for (const geom of val.geoms) {
                  const mesh = new Mesh(geom, val.material);
                  mesh.renderOrder = val.renderOrder;
                  scene.add(mesh);
                }
              }

              // Dispose intermediate geometries to free GPU memory
              for (const geom of val.geoms) {
                geom.dispose();
              }
            }

            this.processGeometry(scene, name ?? sceneName?.name, scale, true);

            allGeometries.push({
              object: scene,
              menuNodeName: menuNodeName ?? sceneName?.menuNodeName,
            });
          }
          resolve(allGeometries);
        },
        (error) => reject(error),
      );
    });
  }

  /**
   * Get geometry name and menuNodeName from GLTF scene name.
   * @param sceneName GLTF scene name.
   * @param menuNodeName Path to the node in Phoenix menu to add the geometry to.
   * @returns Geometry name and menuNodeName if present in scene name.
   */
  private processGLTFSceneName(sceneName?: string, menuNodeName?: string) {
    if (sceneName) {
      const nodes = sceneName.split('_>_');
      if (menuNodeName) nodes.unshift(menuNodeName);
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
  public async loadJSONGeometry(
    json: string | Record<string, unknown>,
    name: string,
    scale?: number,
    doubleSided?: boolean,
  ): Promise<GeometryUIParameters> {
    const loader = this.getObjectLoader();

    if (typeof json === 'string') {
      return new Promise((resolve, reject) => {
        loader.load(
          json,
          (object: Object3D) => {
            this.processGeometry(object, name, scale, doubleSided);
            resolve({ object });
          },
          undefined,
          (error) => reject(error),
        );
      });
    } else {
      const object = loader.parse(json);
      this.processGeometry(object, name, scale, doubleSided);
      return Promise.resolve({ object });
    }
  }

  /**
   * Process the geometry by setting up material and clipping attributes.
   * @param geometry Geometry to be processed.
   * @param name Name of the geometry.
   * @param scale Scale of the geometry.
   * @param doubleSided Renders both sides of the material.
   */
  private processGeometry(
    geometry: Object3D,
    name: string,
    scale?: number,
    doubleSided?: boolean,
  ) {
    geometry.name = name;
    if (scale) {
      geometry.scale.setScalar(scale);
    }

    geometry.traverse((child) => {
      if (child instanceof Mesh) {
        child.name = child.userData.name = name;
        child.userData.size = this.getObjectSize(child);

        if (child.material) {
          const mat = child.material as Material | Material[];
          const singleMat = Array.isArray(mat) ? mat[0] : mat;

          let color = 0x2fd691;
          if ('color' in singleMat) {
            const matColor = (
              singleMat as
                | MeshStandardMaterial
                | MeshBasicMaterial
                | MeshPhongMaterial
            ).color;
            if (matColor) {
              color = matColor.getHex();
            }
          }

          const side = doubleSided ? DoubleSide : singleMat.side;

          this.disposeMaterial(mat);

          const isTransparent = !!geometry.userData.opacity;

          child.material = new MeshPhongMaterial({
            color,
            shininess: 0,
            side: side,
            transparent: isTransparent,
            opacity: geometry.userData.opacity ?? 1,
            clippingPlanes: this.clipPlanes,
            clipIntersection: true,
            clipShadows: false,
          });
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
    if (!object.geometry.boundingBox) {
      object.geometry.computeBoundingBox();
    }
    object.geometry.boundingBox?.getSize(size);
    return JSON.stringify(size, null, 2);
  }
}
