import {
  Scene,
  Object3D,
  Color,
  LineSegments,
  Mesh,
  MeshPhongMaterial,
  LineBasicMaterial,
  LineDashedMaterial,
  Vector3,
  Group,
  AxesHelper,
  AmbientLight,
  DirectionalLight,
  MeshBasicMaterial,
  Camera,
  BufferGeometry,
  Quaternion,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { Font } from 'three/examples/jsm/loaders/FontLoader';
import { Cut } from '../../lib/models/cut.model';
import { CoordinateHelper } from '../../helpers/coordinate-helper';
import HelvetikerFont from './fonts/helvetiker_regular.typeface.json';

/**
 * Manager for managing functions of the three.js scene.
 */
export class SceneManager {
  /** Object group ID containing event data. */
  public static EVENT_DATA_ID = 'EventData';
  /** Object group ID containing detector geometries. */
  public static GEOMETRIES_ID = 'Geometries';
  /** Object group ID containing label texts. */
  public static LABELS_ID = 'Labels';

  /** Three.js scene containing all the objects and event data. */
  private scene: Scene;
  /** List of objects to ignore for getting a clean scene. */
  private ignoreList: string[];
  /** An axes helper for visualizing the x, y and z-axis. */
  private axis: AxesHelper;
  /** Labels for the x, y and z-axis. */
  private axisLabels: Object3D;
  /** Eta/phi grid */
  private grid: Object3D;
  /** Whether to use directional light placed at the camera position. */
  private useCameraLight: boolean = true;
  /** Directional light following the camera position. */
  public cameraLight: DirectionalLight;
  /** Font for text geometry. */
  private textFont: Font = new Font(HelvetikerFont);
  /** An object containing look at camera change callbacks for labels. */
  private labelTextLookCallbacks: { [key: string]: () => void } = {};

  /**
   * Create the scene manager.
   * @param ignoreList List of objects to ignore for getting a clean scene.
   * @param useCameraLight Whether to use directional light placed at the camera position.
   */
  constructor(ignoreList: string[], useCameraLight: boolean = true) {
    this.getScene();
    this.ignoreList = ignoreList;
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
        [-100, -50, 100], // Bottom left
        [100, 50, -100], // Top right
        [-100, 50, -100], // Top left
        [100, -50, 100], // Bottom right
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
    const clearScene = this.scene.clone() as Scene;
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
   * Modifies an object's opacity.
   * @param object Object whose opacity needs to be changed.
   * @param value Value of opacity, between 0 (transparent) and 1 (opaque).
   */
  public setGeometryOpacity(object: Object3D, value: number) {
    if (value && object) {
      object.traverse((child) => {
        if (child?.['material']) {
          child['material'].transparent = true;
          child['material'].opacity = value;
        }
      });
    }
  }

  /**
   * Changes color of an OBJ geometry.
   * @param object Object to change the color of.
   * @param value Value representing the color in hex format.
   */
  public changeObjectColor(object: Object3D, value: any) {
    if (object) {
      object.traverse((child) => {
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
   * @param object Object to change the visibility of.
   * @param visible If the object will be visible (true) or hidden (false).
   */
  public objectVisibility(object: Object3D, visible: boolean) {
    if (object) {
      object.visible = visible;
      object.traverse((child) => {
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
    return this.scene.getObjectByName(name)?.position;
  }

  /**
   * Removes a geometry from the scene.
   * @param object Geometry object to be removed.
   */
  public removeGeometry(object: Object3D) {
    const geometries = this.getGeometries() as Group;
    geometries.remove(object);
  }

  /**
   * Remove label from the scene.
   * @param name Name of the label to remove.
   */
  public removeLabel(name: string) {
    const object = this.scene.getObjectByName(name);
    this.getObjectsGroup(SceneManager.LABELS_ID).remove(object);
  }

  /**
   * Scales an object.
   * @param object Object to scale.
   * @param value Value to scale the object by.
   */
  public scaleObject(object: Object3D, value: any) {
    object.scale.setScalar(value);
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

  /** Returns a mesh representing the passed text. It will use this.textFont. */
  public getText(text: string, colour: Color): Mesh {
    const textGeometry = new TextGeometry(text, {
      font: this.textFont,
      size: 60,
      curveSegments: 1,
      height: 1,
    });

    const mesh = new Mesh(
      textGeometry,
      new MeshBasicMaterial({
        color: new Color(colour),
      })
    );
    return mesh;
  }

  /**
   * Sets scene axis visibility.
   * @param visible If the axes will be visible (true) osr hidden (false).
   * @param scale Set the scale of the axes.
   * @param labels If true (default), show labels on the end of the axes.
   */
  public setAxis(
    visible: boolean,
    scale: number = 2000,
    labels: boolean = true
  ) {
    if (this.axis == null) {
      this.axis = new AxesHelper(scale);
      this.scene.add(this.axis);
    }
    this.axis.visible = visible;

    if (labels && this.axisLabels == null) {
      this.axisLabels = new Group();

      const labels = ['X', 'Y', 'Z'];
      const colours = [0xff0000, 0x00ff00, 0x0000ff];
      let colourIndex = 0;
      for (const label of labels) {
        const mesh = this.getText(label, new Color(colours[colourIndex++]));
        this.axisLabels.add(mesh);
      }
      this.axisLabels.children[0].position.set(scale + 20, 0, 0);
      this.axisLabels.children[1].position.set(0, scale + 20, 0);
      this.axisLabels.children[2].position.set(0, 0, scale + 20);

      this.scene.add(this.axisLabels);
    }
    this.axisLabels.visible = visible;
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
          value
            ? (objectChild.renderOrder = 0)
            : (objectChild.renderOrder = 999);
          // Applying depthTest
          objectChild.material.depthTest = value;
        }
      });
    }
  }

  /**
   * Wireframe geometries and decrease their opacity.
   * @param value A boolean to specify if geometries are to be wireframed or not.
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
   * Wireframe a group of objects.
   * @param objectsGroup Group of the objects to be wireframed.
   * @param value A boolean to specify if objects are to be wireframed or not.
   */
  public wireframeObjects(objectsGroup: Object3D, value: boolean) {
    objectsGroup.traverse((object: any) => {
      if (object.material) {
        object.material.wireframe = value;
      }
    });
  }

  /**
   * Change the scale of Jets.
   * @param value Factor by which the Jets are to be scaled.
   */
  public scaleJets(value: number) {
    if (value <= 0) return;

    const jets = this.scene.getObjectByName('Jets');

    jets.traverse((objectChild: Object3D) => {
      if (objectChild.name === 'Jet') {
        const previousScale = objectChild.scale.x;
        objectChild.scale.setScalar(value);
        // Restoring to original position and then moving again with the current value.
        objectChild.position.divideScalar(previousScale).multiplyScalar(value);
      }
    });
  }

  /**
   * Scale lowest level objects in a group.
   * @param groupName Name of the group to scale objects of.
   * @param value Value of the scale. Default is 1.
   * @param axis If passed, the local axis to scale.
   */
  public scaleChildObjects(groupName: string, value: number, axis?: string) {
    const object = this.scene.getObjectByName(groupName);

    object.traverse((objectChild: Object3D) => {
      if (objectChild.children.length === 0) {
        if (!axis) {
          objectChild.scale.setScalar(value);
        } else {
          objectChild.scale[axis] = value;
        }
      }
    });
  }

  /**
   * Add label to the three.js object.
   * @param label Label to add to the event object.
   * @param uuid UUID of the three.js object.
   * @param labelId Unique ID of the label.
   * @param objectPosition Position of the object to place the label.
   * @param cameraControls Camera controls for making the text face the camera.
   */
  public addLabelToObject(
    label: string,
    uuid: string,
    labelId: string,
    objectPosition: Vector3,
    cameraControls: OrbitControls
  ) {
    const object = this.scene.getObjectByProperty('uuid', uuid);
    object.userData.label = label;

    const labelsGroup = this.getObjectsGroup(SceneManager.LABELS_ID);
    const labelObject = this.scene.getObjectByName(labelId);

    if (labelObject) {
      labelsGroup.remove(labelObject);
    }

    const textMesh = this.getText(label, new Color('#a8a8a8'));
    textMesh.position.fromArray(objectPosition.toArray());
    textMesh.name = labelId;

    labelsGroup.add(textMesh);

    cameraControls.removeEventListener(
      'change',
      this.labelTextLookCallbacks[uuid]
    );
    this.labelTextLookCallbacks[uuid] = () => {
      textMesh.lookAt(cameraControls.object.position);
    };
    this.labelTextLookCallbacks[uuid]();
    cameraControls.addEventListener(
      'change',
      this.labelTextLookCallbacks[uuid]
    );
  }

  /**
   * Sets scene eta/phi grid visibility.
   * @param visible If the axes will be visible (true) osr hidden (false).
   * @param scale Set the scale of the axes.
   */
  public setEtaPhiGrid(visible: boolean, scale: number = 3000) {
    if (this.grid == null) {
      this.grid = new Group();

      // Currently hardcoding some of this
      let points = [];
      const radius = scale;
      const etaColour = new Color(0x0000ff);
      for (let eta = -3.0; eta <= 3.0; eta += 1.0) {
        points.push(new Vector3(0, 0, 0));
        const etaVec = CoordinateHelper.etaPhiToCartesian(
          radius,
          eta,
          Math.PI / 2.0
        );
        const text = this.getText('η=' + eta.toPrecision(2), etaColour);
        text.position.set(etaVec.x, etaVec.y, etaVec.z);
        text.rotateOnWorldAxis(new Vector3(0, 1, 0), Math.PI / 2.0);
        this.grid.add(text);
        points.push(etaVec);
      }

      const etaGeometry = new BufferGeometry().setFromPoints(points);
      const etaMaterial = new LineDashedMaterial({
        color: etaColour,
        dashSize: 2,
        gapSize: 1,
        scale: 0.01,
      });
      const etaLines = new LineSegments(etaGeometry, etaMaterial);
      etaLines.computeLineDistances(); // Needed for dashed lines

      const step = (2 * Math.PI) / 8; // 8 steps
      const phiLabels = [
        '-π',
        '-3π/4',
        '-π/2,',
        '-π/4',
        '0',
        'π/4',
        'π/2,',
        '3π/4',
      ];
      let labelIndex = 0;
      const phiColor = new Color(0xff0000);
      points = [];
      const phiradius = radius * 0.9;
      for (let phi = -Math.PI; phi < Math.PI; phi += step) {
        points.push(new Vector3(0, 0, 0));
        const phiVec = CoordinateHelper.etaPhiToCartesian(phiradius, 0.0, phi);
        const text = this.getText('φ=' + phiLabels[labelIndex++], phiColor);
        text.position.set(phiVec.x, phiVec.y, phiVec.z);
        this.grid.add(text);
        points.push(phiVec);
      }
      const phiGeometry = new BufferGeometry().setFromPoints(points);
      const phiMaterial = new LineDashedMaterial({
        color: phiColor,
        dashSize: 1,
        gapSize: 1,
        scale: 0.01,
      });
      const phiLines = new LineSegments(phiGeometry, phiMaterial);
      phiLines.computeLineDistances(); // Needed for dashed lines

      // Add to group and scene
      this.grid.add(etaLines);
      this.grid.add(phiLines);
      this.scene.add(this.grid);

      // Now, for debugging, draw phi / theta native to threejs (though flipping for azimuthal)
      // eslint-disable-next-line no-constant-condition
      if (false) {
        points = [];
        for (let polar = 0; polar < Math.PI; polar += step) {
          for (let azi = -Math.PI; azi < Math.PI; azi += step) {
            if (polar === 0 && azi > -Math.PI) continue;
            points.push(new Vector3(0, 0, 0));
            const end = new Vector3(0, 0, 0);
            end.setFromSphericalCoords(radius, polar, azi); // For threejs, phi=polar, theta=azimuthal

            const v1 = new Vector3(0, 1, 0);
            const v2 = new Vector3(0, 0, 1);
            const quaternion = new Quaternion();
            quaternion.setFromUnitVectors(v1, v2);
            end.applyQuaternion(quaternion);

            points.push(end);
            const text = this.getText(
              '(\u03C6,\u03B8) = ' +
                azi.toPrecision(1) +
                ' , ' +
                polar.toPrecision(1),
              new Color(0x00ff00)
            );
            text.position.set(end.x, end.y, end.z);
            this.grid.add(text);
          }
        }
        const geometry2 = new BufferGeometry().setFromPoints(points);
        const material2 = new LineDashedMaterial({ color: 0x00ff00 });
        const lines2 = new LineSegments(geometry2, material2);
        this.grid.add(lines2);
        this.scene.add(this.grid);
      }
    }
    this.grid.visible = visible;
  }

  /**
   * Get an object by its name.
   * @param name Name of the object.
   * @returns The object.
   */
  public getObjectByName(name: string): Object3D {
    return this.scene.getObjectByName(name);
  }
}
