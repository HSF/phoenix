import {
  Scene,
  Object3D,
  Color,
  LineSegments,
  Material,
  Mesh,
  MeshPhongMaterial,
  LineBasicMaterial,
  LineDashedMaterial,
  Vector3,
  Group,
  AmbientLight,
  DirectionalLight,
  MeshBasicMaterial,
  Camera,
  BufferGeometry,
  Quaternion,
  DoubleSide,
  BoxGeometry,
  type Object3DEventMap,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
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
  private axis: Object3D;
  /** Labels for the x, y and z-axis. */
  private axisLabels: Object3D;
  /** Eta/phi grid */
  private etaPhiGrid: Object3D;
  /** Cartesian grid */
  private cartesianGrid: Object3D;
  /** Cartesian Grid Config */
  private cartesianGridConfig = {
    showXY: true,
    showYZ: true,
    showZX: true,
    xDistance: 0,
    yDistance: 0,
    zDistance: 0,
    sparsity: 2,
  };
  /** Cartesian grid labels */
  private cartesianLabels: Object3D;
  /** Whether to use directional light placed at the camera position. */
  private useCameraLight: boolean = true;
  /** Directional light following the camera position. */
  public cameraLight: DirectionalLight;
  /** Font for text geometry. */
  private textFont: Font = new Font(HelvetikerFont);
  /** An object containing look at camera change callbacks for labels. */
  private labelTextLookCallbacks: { [key: string]: () => void } = {};
  /** Numbers on the X, Y and Z axes */
  private axesNumbers: Mesh[] = [];

  /**
   * Create the scene manager.
   * @param ignoreList List of objects to ignore for getting a clean scene.
   * @param useCameraLight Whether to use directional light placed at the camera position.
   */
  constructor(ignoreList: string[], useCameraLight: boolean = true) {
    this.getScene();
    this.ignoreList = ignoreList;
    this.axis = new Object3D();
    this.setLights(useCameraLight);
  }

  /**
   * Initializes the lights in the scene.
   * @param useCameraLight Whether to use directional light placed at the camera position.
   */
  private setLights(useCameraLight: boolean = true) {
    this.useCameraLight = useCameraLight;

    const ambientLight = new AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    if (this.useCameraLight) {
      this.cameraLight = new DirectionalLight(0xffffff, 0.9);
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
    const removeList: Object3D<Object3DEventMap>[] = [];

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
  public setGeometryOpacity(object: Mesh, value: number) {
    if (value && object) {
      object.traverse((child) => {
        const mesh = child as Mesh;
        if (mesh?.['material']) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => {
              material.transparent = true;
              material.opacity = value;
            });
          } else {
            mesh.material.transparent = true;
            mesh.material.opacity = value;
          }
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
  public getObjectPosition(name: string): Vector3 | undefined {
    const object = this.scene.getObjectByName(name);
    if (object) {
      return object.position;
    }
    return undefined;
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
    const labelsGroup = this.getObjectsGroup(SceneManager.LABELS_ID);
    if (labelsGroup && object) {
      labelsGroup.remove(object);
    }
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
    const eventData = this.getScene().getObjectByName(
      SceneManager.EVENT_DATA_ID,
    );
    if (!eventData) {
      return;
    }

    const collection = eventData.getObjectByName(collectionName);
    if (collection) {
      for (const child of Object.values(collection.children)) {
        if (child.userData) {
          for (const filter of filters) {
            const value = child.userData[filter.field];
            if (value) {
              if (filter.cutPassed(value)) {
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
    if (!parent) {
      return;
    }
    const collection = parent.getObjectByName(name);
    if (collection) {
      for (const child of Object.values(collection.children)) {
        child.visible = visible;
      }
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
      depth: 1,
    });

    const mesh = new Mesh(
      textGeometry,
      new MeshBasicMaterial({
        color: new Color(colour),
      }),
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
    labels: boolean = true,
  ) {
    if (this.axis == null) {
      this.axis = new Group();

      const xColor = new Color(0xd63333);
      const yColor = new Color(0x33d633);
      const zColor = new Color(0x3333d6);
      const xMaterial = new LineBasicMaterial({ color: xColor });
      const yMaterial = new LineBasicMaterial({ color: yColor });
      const zMaterial = new LineBasicMaterial({ color: zColor });

      // X axis
      let points = [new Vector3(-scale, 0, 0), new Vector3(scale, 0, 0)];
      let geometry = new BufferGeometry().setFromPoints(points);
      const xAxis = new LineSegments(geometry, xMaterial);
      this.axis.add(xAxis);

      // Y axis
      points = [new Vector3(0, -scale, 0), new Vector3(0, scale, 0)];
      geometry = new BufferGeometry().setFromPoints(points);
      const yAxis = new LineSegments(geometry, yMaterial);
      this.axis.add(yAxis);

      // Z axis
      points = [new Vector3(0, 0, -scale), new Vector3(0, 0, scale)];
      geometry = new BufferGeometry().setFromPoints(points);
      const zAxis = new LineSegments(geometry, zMaterial);
      this.axis.add(zAxis);

      this.axis.name = 'gridline';
      this.axis.traverse((child) => (child.name = 'gridline'));
      this.scene.add(this.axis);
    }
    this.axis.visible = visible;

    if (labels && this.axisLabels == null) {
      this.axisLabels = new Group();

      const labels = ['X [cm]', 'Y [cm]', 'Z [cm]'];
      const colours = [0xff0000, 0x00ff00, 0x0000ff];
      let colourIndex = 0;
      for (const label of labels) {
        const mesh = this.getText(label, new Color(colours[colourIndex++]));
        this.axisLabels.add(mesh);
      }
      this.axisLabels.children[0].position.set(scale + 200, 0, 0);
      this.axisLabels.children[1].position.set(0, scale + 200, 0);
      this.axisLabels.children[2].position.set(0, 0, scale + 200);

      this.axisLabels.name = 'XYZ Labels';
      this.axisLabels.traverse((child) => (child.name = 'XYZ Labels'));

      this.scene.add(this.axisLabels);
    }
    this.axisLabels.visible = visible;
  }

  /**
   * Creates the cartesian grid if doesn't exist already
   * @param scale the maximum scale (dimensions: height, width, length) of the grid
   */
  private createCartesianGrid(scale: number = 3000) {
    if (this.cartesianGrid == null) {
      this.cartesianGrid = new Group();

      const xColor = new Color(0xd63333);
      const yColor = new Color(0x33d633);
      const zColor = new Color(0x3333d6);

      const xMaterial = new LineDashedMaterial({
        color: xColor,
        dashSize: 0.5,
        gapSize: 0.1,
        scale: 0.01,
      });
      const yMaterial = new LineDashedMaterial({
        color: yColor,
        dashSize: 0.5,
        gapSize: 0.1,
        scale: 0.01,
      });
      const zMaterial = new LineDashedMaterial({
        color: zColor,
        dashSize: 0.5,
        gapSize: 0.1,
        scale: 0.01,
      });

      // xy plane
      let xyPlane = new Group();
      for (let z = -scale; z <= scale; z += 0.1 * scale) {
        xyPlane = new Group();

        let points = [];
        for (let y = -scale; y <= scale; y += 0.1 * scale) {
          points.push(new Vector3(-scale, y, z));
          points.push(new Vector3(scale, y, z));
        }
        let geometry = new BufferGeometry().setFromPoints(points);
        const material = zMaterial;
        let lines = new LineSegments(geometry, material);
        lines.computeLineDistances();
        xyPlane.add(lines);

        points = [];
        for (let x = -scale; x <= scale; x += 0.1 * scale) {
          points.push(new Vector3(x, -scale, z));
          points.push(new Vector3(x, scale, z));
        }
        geometry = new BufferGeometry().setFromPoints(points);
        lines = new LineSegments(geometry, material);
        lines.computeLineDistances();
        xyPlane.add(lines);
        this.cartesianGrid.add(xyPlane);
      }

      // YZ plane
      let yzPlane = new Group();
      for (let x = -scale; x <= scale; x += 0.1 * scale) {
        yzPlane = new Group();

        let points = [];
        for (let y = -scale; y <= scale; y += 0.1 * scale) {
          points.push(new Vector3(x, y, -scale));
          points.push(new Vector3(x, y, scale));
        }
        let geometry = new BufferGeometry().setFromPoints(points);
        const material = xMaterial;
        let lines = new LineSegments(geometry, material);
        lines.computeLineDistances();
        yzPlane.add(lines);

        points = [];
        for (let z = -scale; z <= scale; z += 0.1 * scale) {
          points.push(new Vector3(x, -scale, z));
          points.push(new Vector3(x, scale, z));
        }
        geometry = new BufferGeometry().setFromPoints(points);
        lines = new LineSegments(geometry, material);
        lines.computeLineDistances();
        yzPlane.add(lines);
        this.cartesianGrid.add(yzPlane);
      }

      // ZX plane
      let zxPlane = new Group();
      for (let y = -scale; y <= scale; y += 0.1 * scale) {
        zxPlane = new Group();

        let points = [];
        for (let x = -scale; x <= scale; x += 0.1 * scale) {
          points.push(new Vector3(x, y, -scale));
          points.push(new Vector3(x, y, scale));
        }
        let geometry = new BufferGeometry().setFromPoints(points);
        const material = yMaterial;
        let lines = new LineSegments(geometry, material);
        lines.computeLineDistances();
        zxPlane.add(lines);

        points = [];
        for (let z = -scale; z <= scale; z += 0.1 * scale) {
          points.push(new Vector3(-scale, y, z));
          points.push(new Vector3(scale, y, z));
        }
        geometry = new BufferGeometry().setFromPoints(points);
        lines = new LineSegments(geometry, material);
        lines.computeLineDistances();
        zxPlane.add(lines);
        this.cartesianGrid.add(zxPlane);
      }

      this.cartesianGrid.name = 'gridline';
      this.cartesianGrid.traverse((child) => (child.name = 'gridline'));
      this.cartesianGrid.children.forEach((child) => (child.visible = false));
      this.scene.add(this.cartesianGrid);
    }
  }

  /**
   * Sets scene cartesian grid visibility.
   * @param visible If the grid will be visible.
   * @param showXY If the XY planes are to be shown.
   * @param showYZ If the YZ planes are to be shown.
   * @param showZX If the ZX planes are to be shown.
   * @param xDistance The distance in x direction upto which YZ planes will be shown.
   * @param yDistance The distance in y direction upto which ZX planes will be shown.
   * @param zDistance The distance in z direction upto which XY planes will be shown.
   * @param sparsity Sparsity of the gridlines.
   * @param scale Set the scale of the grid.
   */
  public setCartesianGrid(
    visible: boolean,
    scale: number,
    config?: {
      showXY: boolean;
      showYZ: boolean;
      showZX: boolean;
      xDistance: number;
      yDistance: number;
      zDistance: number;
      sparsity: number;
    },
  ) {
    this.createCartesianGrid(scale);
    for (let i = 0; i <= 62; i += 1) {
      this.cartesianGrid.children[i].visible = false;
    }

    if (typeof config === 'undefined') {
      config = this.cartesianGridConfig;
    } else {
      this.cartesianGridConfig = config;
    }

    const childPoints = [10, 31, 52];
    const distances = [config.zDistance, config.xDistance, config.yDistance];
    const visiblePlanes = [config.showXY, config.showYZ, config.showZX];

    if (visible) {
      for (let i = 0; i < 3; i += 1) {
        if (visiblePlanes[i]) {
          for (
            let j = childPoints[i];
            j >= childPoints[i] - (distances[i] * 10) / scale;
            j -= config.sparsity
          ) {
            this.cartesianGrid.children[j].visible = visible;
          }

          for (
            let j = childPoints[i];
            j <= childPoints[i] + (distances[i] * 10) / scale;
            j += config.sparsity
          ) {
            this.cartesianGrid.children[j].visible = visible;
          }
        }
      }
    }
  }

  /**
   * Returns the cartesian grid configuration
   */
  public getCartesianGridConfig() {
    return this.cartesianGridConfig;
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
          // eslint-disable-next-line
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
    if (!jets) return;
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
    if (!object) return;
    object.traverse((objectChild: Object3D) => {
      if (objectChild.children.length === 0) {
        switch (axis) {
          case 'x':
            objectChild.scale.x = value;
            break;
          case 'y':
            objectChild.scale.y = value;
            break;
          case 'z':
            objectChild.scale.z = value;
            break;
          default:
            objectChild.scale.setScalar(value);
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
    cameraControls: OrbitControls,
  ) {
    const object = this.scene.getObjectByProperty('uuid', uuid);
    if (!object) return;
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
      this.labelTextLookCallbacks[uuid],
    );
    this.labelTextLookCallbacks[uuid] = () => {
      textMesh.lookAt(cameraControls.object.position);
    };
    this.labelTextLookCallbacks[uuid]();
    cameraControls.addEventListener(
      'change',
      this.labelTextLookCallbacks[uuid],
    );
  }

  /**
   * Translate the cartesianGrid
   */
  public translateCartesianGrid(translate: Vector3) {
    this.createCartesianGrid();

    const distance = translate.length();
    const unitVector = translate.normalize();
    this.cartesianGrid.translateOnAxis(unitVector, distance);
  }

  /**
   * Translate Cartesian labels
   */
  public translateCartesianLabels(translate: Vector3) {
    this.createCartesianLabels();

    const distance = translate.length();
    const unitVector = translate.normalize();
    this.cartesianLabels.translateOnAxis(unitVector, distance);
    this.axis.translateOnAxis(unitVector, distance);
    this.axisLabels.translateOnAxis(unitVector, distance);
  }

  /**
   * Adds numbers (coordinates) to the axes.
   * @param scale The maximum length upto which labels are to be shown
   */
  private createCartesianLabels(scale: number = 3000) {
    if (this.cartesianLabels == null) {
      this.cartesianLabels = new Group();
      this.cartesianLabels.name = 'XYZ Labels';

      const xColor = new Color(0xd63333);
      const yColor = new Color(0x33d633);
      const zColor = new Color(0x3333d6);
      const xMaterial = new MeshBasicMaterial({
        color: xColor,
        side: DoubleSide,
      });
      const yMaterial = new MeshBasicMaterial({
        color: yColor,
        side: DoubleSide,
      });
      const zMaterial = new MeshBasicMaterial({
        color: zColor,
        side: DoubleSide,
      });

      // X Labels
      for (let x = -scale; x <= scale; x += 0.1 * scale) {
        const text = this.getText((x / 10).toString(), xColor);
        text.position.set(x, 40, 0);
        this.axesNumbers.push(text);
        this.cartesianLabels.add(text);

        const geometry = new BoxGeometry(10, 30, 10);
        geometry.translate(x, 0, 0);
        const xTicks = new Mesh(geometry, xMaterial);
        this.cartesianLabels.add(xTicks);
      }

      // Y Labels
      for (let y = -scale; y <= scale; y += 0.1 * scale) {
        const text = this.getText((y / 10).toString(), yColor);
        text.position.set(-40, y, 0);
        this.axesNumbers.push(text);
        this.cartesianLabels.add(text);

        const geometry = new BoxGeometry(30, 10, 10);
        geometry.translate(0, y, 0);
        const yTicks = new Mesh(geometry, yMaterial);
        this.cartesianLabels.add(yTicks);
      }

      // Z Labels
      for (let z = -scale; z <= scale; z += 0.1 * scale) {
        const text = this.getText((z / 10).toString(), zColor);
        text.position.set(-40, 0, z);
        this.axesNumbers.push(text);
        this.cartesianLabels.add(text);

        const geometry = new BoxGeometry(30, 10, 10);
        geometry.translate(0, 0, z);
        const zTicks = new Mesh(geometry, zMaterial);
        this.cartesianLabels.add(zTicks);
      }

      this.cartesianLabels.traverse((child) => (child.name = 'XYZ Labels'));
      this.scene.add(this.cartesianLabels);
      this.cartesianLabels.children.forEach((child) => (child.visible = false));

      this.setAxis(false, 3000);
    }
  }

  /**
   * Aligns the axes numbers always towards the main camera
   */
  public alignText(camera: Camera) {
    if (this.cartesianLabels != null)
      this.axesNumbers.forEach((element) => {
        element.lookAt(camera.position);
      });

    if (this.axisLabels != null) {
      this.axisLabels.children.forEach((element) =>
        element.lookAt(camera.position),
      );
    }
  }

  /**
   * Show labels of the cartesian grid.
   */
  public showLabels(visible: boolean) {
    this.createCartesianLabels();
    this.setAxis(visible, 3000);
    this.cartesianLabels.children.forEach((child) => (child.visible = visible));
  }

  /**
   * Sets scene eta/phi grid visibility.
   * @param visible If the axes will be visible (true) osr hidden (false).
   * @param scale Set the scale of the axes.
   */
  public setEtaPhiGrid(visible: boolean, scale: number = 3000) {
    if (this.etaPhiGrid == null) {
      this.etaPhiGrid = new Group();

      // Currently hardcoding some of this
      let points = [];
      const radius = scale;
      const etaColour = new Color(0x0000ff);
      for (let eta = -3.0; eta <= 3.0; eta += 1.0) {
        points.push(new Vector3(0, 0, 0));
        const etaVec = CoordinateHelper.etaPhiToCartesian(
          radius,
          eta,
          Math.PI / 2.0,
        );
        const text = this.getText('η=' + eta.toPrecision(2), etaColour);
        text.position.set(etaVec.x, etaVec.y, etaVec.z);
        text.rotateOnWorldAxis(new Vector3(0, 1, 0), Math.PI / 2.0);
        this.etaPhiGrid.add(text);
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
        this.etaPhiGrid.add(text);
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
      this.etaPhiGrid.add(etaLines);
      this.etaPhiGrid.add(phiLines);

      this.etaPhiGrid.name = 'gridline';
      this.etaPhiGrid.traverse((child) => (child.name = 'gridline'));
      this.scene.add(this.etaPhiGrid);

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
              new Color(0x00ff00),
            );
            text.position.set(end.x, end.y, end.z);
            this.etaPhiGrid.add(text);
          }
        }
        const geometry2 = new BufferGeometry().setFromPoints(points);
        const material2 = new LineDashedMaterial({ color: 0x00ff00 });
        const lines2 = new LineSegments(geometry2, material2);
        this.etaPhiGrid.add(lines2);
        this.scene.add(this.etaPhiGrid);
      }
    }
    this.etaPhiGrid.visible = visible;
  }

  /**
   * Get an object by its name.
   * @param name Name of the object.
   * @returns The object.
   */
  public getObjectByName(name: string): Object3D {
    const object = this.scene.getObjectByName(name);
    if (object) return object;
    return new Object3D();
  }
}
