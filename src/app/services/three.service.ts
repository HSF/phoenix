import { Injectable } from '@angular/core';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import {
  AxesHelper,
  EdgesGeometry,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  OrthographicCamera,
  WebGLRendererParameters,
  Plane,
  Quaternion
} from 'three';
import { Configuration } from './extras/configuration.model';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ControlsManager } from './three/controls-manager';
import { RendererManager } from './three/renderer-manager';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';
import { Cut } from './extras/cut.model';
import { ExportManager } from './three/export-manager';
import { ImportManager } from './three/import-manager';
import { SelectionManager } from './three/selection-manager';

@Injectable({
  providedIn: 'root'
})
export class ThreeService {
  public static EVENT_DATA_ID = 'EventData';
  public static GEOMETRIES_ID = 'Geometries';
  // Threejs Variables
  private scene: Scene;
  private detector: Object3D;
  private perspectiveControls: OrbitControls;
  private orthographicControls: OrbitControls;
  private perspectiveCamera: PerspectiveCamera;
  private orthographicCamera: OrthographicCamera;
  // Managers
  private rendererManager: RendererManager;
  private controlsManager: ControlsManager;
  private exportManager: ExportManager;
  private importManager: ImportManager;
  private selectionManager: SelectionManager;
  // Scene export ignore list
  private ignoreList: string[];
  // Clipping planes
  private clipPlanes: Plane[] = [
    new Plane(new THREE.Vector3(0, 1, 0), 0),
    new Plane(new THREE.Vector3(0, -1, 0), 0),
    new Plane(new THREE.Vector3(0, 0, 1), -15000)
  ];
  // Axis
  private axis: AxesHelper;


  constructor() {
  }

  /**
   * Initializes the necessary three.js functionality.
   * @param configuration used to customize different aspects.
   */
  public init(configuration: Configuration) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('hsl(0, 0%, 100%)');

    // Arguments: FOV, aspect ratio, near and far distances
    this.perspectiveCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100000
    );
    // Arguments: left, right, top, bottom, near and far distances
    this.orthographicCamera = new THREE.OrthographicCamera(
      -window.innerWidth / 2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      -window.innerHeight / 2,
      0.1,
      100000
    );
    this.perspectiveCamera.position.z = this.orthographicCamera.position.z = 200;

    // IO Managers
    this.exportManager = new ExportManager();
    this.importManager = new ImportManager(this.clipPlanes, ThreeService.EVENT_DATA_ID, ThreeService.GEOMETRIES_ID);
    // Renderer manager
    this.rendererManager = new RendererManager();

    // Orbit controls allow to move around
    this.perspectiveControls = this.setOrbitControls(
      this.perspectiveCamera,
      this.rendererManager.getMainRenderer().domElement
    );
    this.orthographicControls = this.setOrbitControls(
      this.orthographicCamera,
      this.rendererManager.getMainRenderer().domElement
    );
    // Controls manager
    this.controlsManager = new ControlsManager(this.perspectiveControls);
    // Set active orbit controls
    this.controlsManager.addControls(this.perspectiveControls);
    this.controlsManager.addControls(this.orthographicControls);
    this.controlsManager.setMainControls(this.perspectiveControls);
    this.controlsManager.setOverlayControls(this.orthographicControls);
    // Add listener
    this.controlsManager.getActiveControls().addEventListener(
      'change',
      ((scope) => {
        const controlsManager = scope.controlsManager;

        return () => {
          controlsManager.transformSync();
          controlsManager.updateSync();
        };
      })(this)
    );


    // Selection manager
    this.getSelectionManager().init(
      this.controlsManager.getMainCamera(),
      this.getScene(),
      this.rendererManager.getMainRenderer());

    // Export ignore list
    this.ignoreList = [
      new THREE.AmbientLight().type,
      new THREE.DirectionalLight().type,
      new THREE.AxesHelper().type
    ];
    // Axis
    this.axis = null;

    // Different lights to better see the object
    this.setLights();
    // Customizing with configuration
    this.setConfiguration(configuration);
  }

  public updateControls() {
    this.controlsManager.getActiveControls().update();
    this.controlsManager.updateSync();
    TWEEN.update();
  }

  public render() {
    this.rendererManager.getMainRenderer().render(
      this.scene,
      this.controlsManager.getMainCamera()
    );

    if (this.rendererManager.getOverlayRenderer()) {
      if (!this.rendererManager.getOverlayRenderer().domElement.hidden) {
        const sceneColor = this.scene.background;
        this.scene.background = null;

        if (!this.rendererManager.isFixedOverlay()) {
          this.rendererManager.getOverlayRenderer().render(
            this.scene,
            this.controlsManager.getOverlayCamera()
          );
        }
        this.scene.background = sceneColor;
      }
    }

    this.selectionManager.render();

  }

  /*********************************
   * Private auxiliary functions.  *
   *********************************/

  /**
   * Sets overlay renderer to a renderer manager.
   *
   */
  public setOverlayRenderer(overlayCanvas: HTMLCanvasElement): void {
    if (this.rendererManager) {
      const parameters: WebGLRendererParameters = {
        canvas: overlayCanvas,
        antialias: false,
        alpha: true
      };
      const overlayRenderer: WebGLRenderer = new THREE.WebGLRenderer(parameters);
      this.rendererManager.addRenderer(overlayRenderer);
      this.rendererManager.setOverlayRenderer(overlayRenderer);
    }
  }



  private setOrbitControls(
    camera: PerspectiveCamera | OrthographicCamera,
    domElement?: HTMLElement
  ): OrbitControls {
    const controls: OrbitControls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.autoRotate = false;

    return controls;
  }

  private setLights() {
    const ambientLight = new THREE.AmbientLight(0x404040);
    const directionalLight1 = new THREE.DirectionalLight(0xbfbfbf);
    const directionalLight2 = new THREE.DirectionalLight(0xbfbfbf);

    directionalLight1.position.set(-100, -50, 100);
    directionalLight2.position.set(100, 50, -100);

    this.scene.add(directionalLight1);
    this.scene.add(directionalLight2);
    this.scene.add(ambientLight);
  }

  private setConfiguration(configuration: Configuration) {
    if (configuration.allowShowAxes) {
      this.setAxis(configuration.allowShowAxes);
    }
  }

  private getObjectsGroup(identifier: string): Object3D {
    let group = this.scene.getObjectByName(identifier);
    if (group == null) {
      group = new Group();
      group.name = identifier;
      this.scene.add(group);
    }
    return group;
  }

  private getEventData(): Object3D {
    return this.getObjectsGroup(ThreeService.EVENT_DATA_ID);
  }

  private getGeometries(): Object3D {
    return this.getObjectsGroup(ThreeService.GEOMETRIES_ID);
  }

  /*********************************
   *      Public functions.        *
   *********************************/

  public exportSceneToOBJ() {
    // Instantiate a exporter
    const scene = this.cleanScene(this.getScene());
    this.exportManager.exportSceneToOBJ(scene);
  }

  // SAVE SCENE
  public exportPhoenixScene() {
    const scene = this.cleanScene(this.getScene());
    // Instantiate a exporter
    this.exportManager.exportPhoenixScene(
      this.getScene(), this.getEventData(),
      this.getGeometries());
  }

  // LOAD SCENE
  public parseGLTFGeometry(geometry: any) {
    const callback = (geometries: Object3D, eventData: Object3D) => {
      this.scene.add(geometries);
      this.scene.add(eventData);
    };
    this.importManager.parseGLTFGeometry(geometry, callback);
  }

  // LOAD SCENE
  public loadGLTFGeometry(sceneUrl: any) {
    const callback = (geometry: Object3D) => {
      this.scene.add(geometry);
    };
    this.importManager.loadGLTFGeometry(sceneUrl, callback);
  }

  /**
   * Creates a cleaned copy of a scene.
   * @param scene Scene to copy and clean.
   * @returns a clean scene
   */
  private cleanScene(scene: THREE.Scene): THREE.Scene {
    const clearScene: THREE.Scene = scene.clone();
    const scope = this;
    const removeList = [];

    clearScene.traverse((object: THREE.Object3D) => {
      if (scope.ignoreList.includes(object.type)) {
        removeList.push(object);
      }
    });

    clearScene.remove(...removeList);

    return clearScene;
  }

  public clearEventData() {
    const eventData = this.getEventData();
    if (eventData != null) {
      this.scene.remove(eventData);
    }
    this.getEventData();
  }

  public setAxis(value: boolean) {
    if (this.axis == null) {
      this.axis = new THREE.AxesHelper(2000);
      this.scene.add(this.axis);
    }
    this.axis.visible = value;
  }

  public autoRotate(value) {
    this.controlsManager.getActiveControls().autoRotate = value;
  }

  public setClipping(value: boolean) {
    this.rendererManager.setLocalClippingEnabled(value);
  }

  public rotateClipping(angle: number) {
    const q = new Quaternion();
    q.setFromAxisAngle(new Vector3(0, 0, 1), (angle * Math.PI) / 180);
    this.clipPlanes[0].normal.set(0, 1, 0).applyQuaternion(q);
  }

  public darkBackground(value: boolean) {
    let background = 0xffffff;
    if (value) {
      background = 0x0;
    }
    if (this.scene) {
      this.scene.background = new THREE.Color(background);
    }
  }

  public setGeometryOpacity(name: string, value: number) {
    const object = this.scene.getObjectByName(name);

    if (value) {
      object.traverse((o: any) => {
        if (o.isMesh === true) {
          o.material.transparent = true;
          o.material.opacity = value;
        }
      });
    }
  }

  /**
   * Animates camera transform.
   * @param cameraPosition End position.
   * @param cameraTarget End target.
   * @param duration Duration of an animation in seconds.
   */
  public animateCameraTransform(
    cameraPosition: number[],
    cameraTarget: number[],
    duration: number
  ): void {
    this.animateCameraPosition(cameraPosition, duration);
    this.animateCameraTarget(cameraTarget, duration);
  }

  /**
   * Animates camera position.
   * @param cameraPosition End position.
   * @param duration Duration of an animation in seconds.
   */
  public animateCameraPosition(
    cameraPosition: number[],
    duration: number
  ): void {
    const posAnimation = new TWEEN.Tween(
      this.controlsManager.getActiveCamera().position
    );
    posAnimation.to(
      {
        x: cameraPosition[0],
        y: cameraPosition[1],
        z: cameraPosition[2]
      },
      duration
    );
    posAnimation.start();
  }

  /**
   * Animates camera target.
   * @param cameraTarget End target.
   * @param duration Duration of an animation in seconds.
   */
  public animateCameraTarget(cameraTarget: number[], duration: number): void {
    const rotAnimation = new TWEEN.Tween(
      this.controlsManager.getActiveControls().target
    );
    rotAnimation.to(
      {
        x: cameraTarget[0],
        y: cameraTarget[1],
        z: cameraTarget[2]
      },
      duration
    );
    rotAnimation.start();
  }

  /**
   * Swaps cameras.
   * @param useOrthographic Boolean value whether to use orthographic or perspective camera.
   */
  public swapCameras(useOrthographic: boolean): void {
    let cameraType: string;

    if (useOrthographic) {
      // perspective -> ortho
      cameraType = 'OrthographicCamera';
    } else {
      // ortho -> perspective
      cameraType = 'PerspectiveCamera';
    }

    if (this.controlsManager.getMainCamera().type !== cameraType) {
      this.controlsManager.swapControls();
    }
  }

  private toggleSelecting(enable: boolean) {

  }

  public setAnimationLoop(animate: () => void) {
    this.rendererManager.getMainRenderer().xr.enabled = true;
    this.rendererManager.getMainRenderer().setAnimationLoop(animate);
  }

  public setVRButton() {
    let canvas = document.getElementById('eventDisplay');
    if (canvas == null) {
      canvas = document.body;
    }
    canvas.appendChild(
      VRButton.createButton(this.rendererManager.getMainRenderer())
    );
  }



  /**************************************
   * Functions for loading geometries . *
   **************************************/

  public loadOBJGeometry(
    filename: string,
    name: string,
    colour,
    doubleSided: boolean
  ): void {
    const geometries = this.getGeometries();
    const callback = (object: Group) => geometries.add(object);
    this.importManager.loadOBJGeometry(callback, filename, name, colour, doubleSided);
  }

  public parseOBJGeometry(content: string, name: string) {
    const geometries = this.getGeometries();
    const object = this.importManager.parseOBJGeometry(content, name);
    geometries.add(object);
  }

  public objColor(name: string, value: any) {
    const object = this.scene.getObjectByName(name);
    object.traverse(child => {
      if (child instanceof THREE.Mesh || child instanceof LineSegments) {
        if (
          child.material instanceof THREE.MeshPhongMaterial ||
          child.material instanceof LineBasicMaterial
        ) {
          child.material.color.set(value);
        }
      }
    });
  }

  public objectVisibility(name: string, value: boolean) {
    const object = this.scene.getObjectByName(name);
    if (object != null) {
      object.visible = value;
    }
  }

  public getObjectPosition(name: string): Vector3 {
    const object = this.scene.getObjectByName(name);
    if (object) {
      return object.position;
    }
  }

  public removeObject(name: string) {
    const object = this.scene.getObjectByName(name);
    this.scene.remove(object);
  }

  public scaleObject(name: string, value: any) {
    const object = this.scene.getObjectByName(name);
    object.scale.set(value, value, value);
  }

  public addEventDataTypeGroup(objectType: string): Group {
    const eventData = this.getGeometries();
    const typeGroup = new Group();
    typeGroup.name = objectType;
    eventData.add(typeGroup);
    return typeGroup;
  }

  public collectionColor(collectionName: string, value: any) {
    const collection = this.scene.getObjectByName(collectionName);

    for (const child of Object.values(collection.children)) {
      child.traverse((object: THREE.Object3D) => {
        // For jets and tracks
        if (object instanceof Line || object instanceof Mesh) {
          if (
            object.material instanceof LineBasicMaterial ||
            object.material instanceof MeshBasicMaterial
          ) {
            object.material.color.set(value);
          }
        }
      });
    }
  }

  public collectionFilter(collectionName: string, filter: Cut) {
    const collection = this.scene.getObjectByName(collectionName);
    for (const child of Object.values(collection.children)) {
      if (child.userData) {
        const value = child.userData[filter.field];
        if (value) {
          if (value <= filter.maxValue && value >= filter.minValue) {
            child.visible = true;
          } else {
            child.visible = false;
          }
        }
      }
    }
  }

  public groupVisibility(name: string, value: boolean) {
    const collection = this.scene.getObjectByName(name);
    for (const child of Object.values(collection.children)) {
      child.visible = value;
    }
  }

  public fixOverlayView(value: boolean) {
    this.rendererManager.setFixOverlay(value);
  }

  public getScene(): any {
    return this.scene;
  }

  public setSelectedObjectDisplay(selectedObject: { name: string, attributes: any[] }) {
    this.getSelectionManager().setSelectedObject(selectedObject);
  }

  public enableSelecting(enable: boolean) {
    this.getSelectionManager().setSelecting(enable);
  }

  private getSelectionManager(): SelectionManager {
    if (!this.selectionManager) {
      this.selectionManager = new SelectionManager();
    }
    return this.selectionManager;
  }
}
