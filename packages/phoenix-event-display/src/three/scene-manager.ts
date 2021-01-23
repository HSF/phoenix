import { Scene, Object3D, Color, LineSegments, Mesh, MeshPhongMaterial, LineBasicMaterial, Vector3, Group, AxesHelper, AmbientLight, DirectionalLight, Line, MeshBasicMaterial, Material, Points, PointsMaterial, MeshToonMaterial, Camera } from 'three';
import { Cut } from '../extras/cut.model';

/**
 * Manager for managing functions of the three.js scene.
 */
export class SceneManager {
  /** Object group ID containing event data. */
  public static EVENT_DATA_ID = 'EventData';
  /** Object group ID containing detector geometries. */
  public static GEOMETRIES_ID = 'Geometries';

  /** Three.js scene containing all the objects and event data. */
  private scene: Scene;
  /** List of objects to ignore for getting a clean scene. */
  private ignoreList: string[];
  /** An axes helper for visualizing the x, y and z-axis. */
  private axis: AxesHelper;
  /** Whether to use directional light placed at the camera position. */
  private useCameraLight: boolean = true;
  /** Directional light following the camera position. */
  public cameraLight: DirectionalLight;

  /**
   * Create the scene manager.
   * @param ignoreList List of objects to ignore for getting a clean scene.
   * @param useCameraLight Whether to use directional light placed at the camera position.
   */
  constructor(ignoreList: string[], useCameraLight: boolean = true) {
    this.getScene();
    this.ignoreList = ignoreList;
    this.scene.background = new Color('hsl(0, 0%, 100%)');
    this.axis = null;
    this.setLights(useCameraLight);
  }

  /**
   * Initializes the lights in the scene.
   * @param useCameraLight Whether to use directional light placed at the camera position.
   */
  private setLights(useCameraLight: boolean = true) {
    this.useCameraLight = useCameraLight;

    const ambientLight = new AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    if (this.useCameraLight) {
      this.cameraLight = new DirectionalLight(0xffffff, 0.45);
      this.cameraLight.position.set(0, 0, 10);
      this.scene.add(this.cameraLight);
    } else {
      [
        [-100, -50, 100],   // Bottom left
        [100, 50, -100],    // Top right
        [-100, 50, -100],   // Top left
        [100, -50, 100]     // Bottom right
      ].forEach((position) => {
        const directionalLight = new DirectionalLight(0xffffff, 0.2);
        directionalLight.position.set(position[0], position[1], position[2]);
        this.scene.add(directionalLight);
      });
    }
  }

  /**
   * Update position of directional light for each frame rendered.
   * @param camera Camera for setting the position of directional light.
   */
  public updateLights(camera: Camera) {
    if (this.useCameraLight) {
      this.cameraLight.position.copy(camera.position);
    }
  }

  /**
   * Get the current scene and create new if it doesn't exist.
   * @returns The scene.
   */
  public getScene(): Scene {
    if (!this.scene) {
      this.scene = new Scene();
    }
    return this.scene;
  }

  /**
   * Get a clean copy of the scene.
   * @returns A clear scene with no objects from the ignoreList.
   */
  public getCleanScene(): Scene {
    const clearScene: Scene = this.scene.clone();
    const removeList = [];

    clearScene.traverse((object: Object3D) => {
      if (this.ignoreList.includes(object.type)) {
        removeList.push(object);
      }
    });

    clearScene.remove(...removeList);

    return clearScene;
  }

  /**
   * Sets the scene background to be dark or white.
   * @param dark If the scene background is dark (true) or white (false).
   */
  public darkBackground(dark: boolean) {
    let background = 0xffffff;
    if (dark) {
      background = 0x0;
    }
    if (this.scene) {
      this.scene.background = new Color(background);
    }
  }

  /**
   * Modifies an object's opacity.
   * @param name Name of the object to change its opacity.
   * @param value Value of opacity, between 0 (transparent) and 1 (opaque).
   */
  public setGeometryOpacity(name: string, value: number) {
    const object = this.scene.getObjectByName(name);

    if (value && object) {
      object.traverse((o) => {
        if (o instanceof Mesh && o.material instanceof Material) {
          o.material.transparent = true;
          o.material.opacity = value;
        }
      });
    }
  }


  /**
   * Changes color of an OBJ geometry.
   * @param name Name of the geometry.
   * @param value Value representing the color in hex format.
   */
  public OBJGeometryColor(name: string, value: any) {
    const object = this.scene.getObjectByName(name);
    if (object) {
      object.traverse(child => {
        if (child instanceof Mesh || child instanceof LineSegments) {
          if (
            child.material instanceof MeshPhongMaterial ||
            child.material instanceof MeshBasicMaterial ||
            child.material instanceof LineBasicMaterial
          ) {
            (child.material.color as Color).set(value);
          }
        }
      });
    }
  }

  /**
   * Changes objects visibility.
   * @param name Name of the object to change its visibility.
   * @param visible If the object will be visible (true) or hidden (false).
   * @param parentName Name of the parent object to look inside for object
   * whose visibility is to be toggled.
   */
  public objectVisibility(name: string, visible: boolean, parentName?: string) {
    const parent = parentName
      ? this.scene.getObjectByName(parentName)
      : this.scene;
    const object = parent.getObjectByName(name);
    if (object) {
      object.traverse((child) => {
        child.visible = visible;
        if (!visible) {
          child.layers.disable(0);
          child.layers.enable(1);
        } else {
          child.layers.enable(0);
          child.layers.disable(1);
        }
      });
    }
  }

  /**
   * Gets an object's position.
   * @param name Name of the object.
   * @returns Object position.
   */
  public getObjectPosition(name: string): Vector3 {
    const object = this.scene.getObjectByName(name);
    if (object) {
      return object.position;
    }
  }

  /**
   * Removes an object from the scene.
   * @param name Name of the object to be removed.
   */
  public removeGeometry(name: string) {
    const object = this.scene.getObjectByName(name);
    const geometries = this.getGeometries() as Group;
    geometries.remove(object);
  }

  /**
   * Scales an object.
   * @param name Name of the object to scale.
   * @param value Value to scale the object by.
   */
  public scaleObject(name: string, value: any) {
    const object = this.scene.getObjectByName(name);
    object.scale.set(value, value, value);
  }

  /**
   * Adds new type of objects (Jets, Tracks...) to the event data group.
   * @param objectType Name of the object type.
   * @returns The new group added to the event data.
   */
  public addEventDataTypeGroup(objectType: string): Group {
    const eventData = this.getEventData();
    let typeGroup = this.scene.getObjectByName(objectType) as Group;
    if (!typeGroup) {
      typeGroup = new Group();
    }
    typeGroup.name = objectType;
    eventData.add(typeGroup);
    return typeGroup;
  }

  /**
   * Changes the color of all objects inside an event data collection.
   * @param collectionName Name of the collection.
   * @param color Hex value representing the color.
   */
  public collectionColor(collectionName: string, color: any) {
    const collection = this.getScene()
      .getObjectByName(SceneManager.EVENT_DATA_ID)
      .getObjectByName(collectionName);

    for (const child of Object.values(collection.children)) {
      child.traverse((object: THREE.Object3D) => {
        // For jets and tracks
        if (object instanceof Line ||
          object instanceof Mesh ||
          object instanceof Points) {
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

  /**
   * Applies a cut to all objects inside a collection, filtering them given a parameter.
   * @param collectionName Name of the collection.
   * @param filters Cuts used to filter the objects in the collection.
   */
  public collectionFilter(collectionName: string, filters: Cut[]) {
    const collection = this.getScene()
      .getObjectByName(SceneManager.EVENT_DATA_ID)
      .getObjectByName(collectionName);
    for (const child of Object.values(collection.children)) {
      if (child.userData) {
        for (const filter of filters) {
          const value = child.userData[filter.field];
          if (value) {
            if (value <= filter.maxValue && value >= filter.minValue) {
              child.visible = true;
            } else {
              child.visible = false;
              // Break even if one filter hides the object
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Changes the visibility of all elements in a group.
   * @param name Name of the group.
   * @param visible If the group will be visible (true) or hidden (false).
   * @param parentName Name of the parent object to look inside for object
   * whose visibility is to be toggled.
   */
  public groupVisibility(name: string, visible: boolean, parentName?: string) {
    const parent = parentName
      ? this.scene.getObjectByName(parentName)
      : this.scene;
    const collection = parent.getObjectByName(name);
    for (const child of Object.values(collection.children)) {
      child.visible = visible;
    }
  }


  /**
   * Gets a group of objects from the scene.
   * @param identifier String that identifies the group's name.
   * @returns The object.
   */
  public getObjectsGroup(identifier: string): Object3D {
    let group = this.scene.getObjectByName(identifier);
    if (group == null) {
      group = new Group();
      group.name = identifier;
      this.scene.add(group);
    }
    return group;
  }

  /**
   * Get event data inside the scene.
   * @returns A group of objects with event data.
   */
  public getEventData(): Object3D {
    return this.getObjectsGroup(SceneManager.EVENT_DATA_ID);
  }

  /**
   * Get geometries inside the scene.
   * @returns A group of objects with geometries.
   */
  public getGeometries(): Object3D {
    return this.getObjectsGroup(SceneManager.GEOMETRIES_ID);
  }

  /**
   * Clears event data of the scene.
   */
  public clearEventData() {
    const eventData = this.getEventData();
    if (eventData != null) {
      this.scene.remove(eventData);
    }
    this.getEventData();
  }

  /**
   * Sets scene axis visibility.
   * @param visible If the axes will be visible (true) or hidden (false).
   */
  public setAxis(visible: boolean) {
    if (this.axis == null) {
      this.axis = new AxesHelper(2000);
      this.scene.add(this.axis);
    }
    this.axis.visible = visible;
  }

  /**
   * Toggle depthTest of event data by updating all children's depthTest and renderOrder.
   * @param value If depthTest will be true or false.
   */
  public eventDataDepthTest(value: boolean) {
    const object = this.getEventData();

    if (object !== null) {
      // Traversing all event data objects to change material's depthTest
      object.traverse((objectChild: any) => {
        if (objectChild.material) {
          // Changing renderOrder to make event data render on top of geometry
          // Arbitrarily setting a high value of 999
          value ? objectChild.renderOrder = 0 : objectChild.renderOrder = 999;
          // Applying depthTest
          objectChild.material.depthTest = value;
        }
      });
    }
  }

  /**
   * Wireframe geometries and decrease their opacity.
   * @param value A boolean to specify if geometries are to be wireframed
   * or not.
   */
  public wireframeGeometries(value: boolean) {
    const allGeoms = this.getGeometries();
    allGeoms.traverse((object: any) => {
      if (object.material) {
        object.material.wireframe = value;
        if (value) {
          object.material.transparent = true;
          object.material.opacity = 0.1;
        } else {
          // Rolling back transparency because depthTest doesn't work with it
          object.material.transparent = false;
          object.material.opacity = 1;
        }
      }
    });
  }

  /**
   * Change the scale of Jets.
   * @param value Percentage factor by which the Jets are to be scaled.
   */
  public scaleJets(value: number) {
    const jets = this.scene.getObjectByName('Jets');
    value /= 100;

    jets.traverse((objectChild: Object3D) => {
      if (objectChild.name === 'Jet') {
        const previousScale = objectChild.scale.x;
        objectChild.scale.setScalar(value);
        // Restoring to original position and then moving again with the current value.
        objectChild.position.divideScalar(previousScale).multiplyScalar(value);
      }
    });
  }

  public addLabelToObject(uuid: string) {
    this.scene.getObjectByProperty('uuid', uuid);
  }
}
