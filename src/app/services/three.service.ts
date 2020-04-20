import { Injectable } from '@angular/core';
import * as TWEEN from '@tweenjs/tween.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import {
  Group,
  Object3D,
  Scene,
  Vector3,
  Plane,
  Quaternion,
  Points,
  PointsMaterial,
  MeshPhongMaterial,
  AmbientLight,
  DirectionalLight,
  AxesHelper
} from 'three';
import { Configuration } from './extras/configuration.model';
import { ControlsManager } from './three/controls-manager';
import { RendererManager } from './three/renderer-manager';
import { ExportManager } from './three/export-manager';
import { ImportManager } from './three/import-manager';
import { SelectionManager } from './three/selection-manager';
import { SceneManager } from './three/scene-manager';

@Injectable({
  providedIn: 'root'
})
export class ThreeService {
  // Managers
  private sceneManager: SceneManager;
  private rendererManager: RendererManager;
  private controlsManager: ControlsManager;
  private exportManager: ExportManager;
  private importManager: ImportManager;
  private selectionManager: SelectionManager;
  // Scene export ignore list
  private ignoreList = [
    new AmbientLight().type,
    new DirectionalLight().type,
    new AxesHelper().type
  ];
  // Clipping planes
  private clipPlanes: Plane[] = [
    new Plane(new Vector3(0, 1, 0), 0),
    new Plane(new Vector3(0, -1, 0), 0),
    new Plane(new Vector3(0, 0, 1), -15000)
  ];

  /**
   * Initializes the necessary three.js functionality.
   * @param configuration used to customize different aspects.
   */
  public init(configuration: Configuration) {
    // Scene manager
    this.sceneManager = new SceneManager(this.ignoreList);
    // IO Managers
    this.exportManager = new ExportManager();
    this.importManager = new ImportManager(this.clipPlanes, SceneManager.EVENT_DATA_ID, SceneManager.GEOMETRIES_ID);
    // Renderer manager
    this.rendererManager = new RendererManager();
    // Controls manager
    this.controlsManager = new ControlsManager(this.rendererManager);
    // Selection manager
    this.getSelectionManager().init(
      this.controlsManager.getMainCamera(),
      this.sceneManager.getScene(),
      this.rendererManager.getMainRenderer());
    // Customizing with configuration
    this.setConfiguration(configuration);
  }

  /**
   * Updates controls
   */
  public updateControls() {
    this.controlsManager.getActiveControls().update();
    this.controlsManager.updateSync();
    TWEEN.update();
  }

  /**
   * Renders three service
   */
  public render() {
    this.rendererManager.render(this.sceneManager.getScene(), this.controlsManager);
    this.selectionManager.render(this.sceneManager.getScene(), this.controlsManager);
  }

  /**
   * Returns the scene manager.
   */
  public getSceneManager(): SceneManager {
    if (!this.sceneManager) {
      this.sceneManager = new SceneManager(this.ignoreList);
    }
    return this.sceneManager;
  }

  /**
   * Sets controls to auto rotate.
   */
  public autoRotate(autoRotate) {
    this.controlsManager.getActiveControls().autoRotate = autoRotate;
  }

  /**
   * Enables geometries to be clipped with clipping planes.
   */
  public setClipping(clippingEnabled: boolean) {
    this.rendererManager.setLocalClippingEnabled(clippingEnabled);
  }

  /**
   * Rotates clipping planes.
   * @param angle Angle to rotate the clipping planes
   */
  public rotateClipping(angle: number) {
    const q = new Quaternion();
    q.setFromAxisAngle(new Vector3(0, 0, 1), (angle * Math.PI) / 180);
    this.clipPlanes[0].normal.set(0, 1, 0).applyQuaternion(q);
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

  /**
   * Sets animation loop for vr playground.
   * @param animate Function to render the loop.
   */
  public setAnimationLoop(animate: () => void) {
    this.rendererManager.getMainRenderer().xr.enabled = true;
    this.rendererManager.getMainRenderer().setAnimationLoop(animate);
  }

  /**
   * Displays a button to toggle VR.
   */
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

  /**
   * Loads a geometry in GLTF format given a URL.
   * @param filename Path to the geometry.
   * @param name Given name to the geometry.
   * @param colour Color to initialize the geometry.
   * @param doubleSided Renders both sides of the material.
   */
  public loadOBJGeometry(
    filename: string,
    name: string,
    colour,
    doubleSided: boolean
  ): void {
    const geometries = this.sceneManager.getGeometries();
    const callback = (object: Group) => geometries.add(object);
    this.importManager.loadOBJGeometry(callback, filename, name, colour, doubleSided);
  }

  /**
   * Loads a geometry in GLTF format given a URL.
   * @param sceneUrl Path to the geometry.
   */
  public loadGLTFGeometry(sceneUrl: any, name: string) {
    const geometries = this.sceneManager.getGeometries();
    const callback = (geometry: Object3D) => geometries.add(geometry);
    this.importManager.loadGLTFGeometry(sceneUrl, name, callback);
  }

  /**
   * Parses and loads a geometry in OBJ format.
   * @param geometry Geometry in OBJ format.
   * @param name Given name to the geometry.
   */
  public parseOBJGeometry(geometry: string, name: string) {
    const geometries = this.sceneManager.getGeometries();
    const object = this.importManager.parseOBJGeometry(geometry, name);
    geometries.add(object);
  }

  /**
   * Parses and loads a geometry in GLTF format.
   * @param geometry Geometry in GLTF format.
   */
  public parseGLTFGeometry(geometry: any) {
    const callback = (geometries: Object3D, eventData: Object3D) => {
      this.sceneManager.getScene().add(geometries);
      this.sceneManager.getScene().add(eventData);
    };
    this.importManager.parseGLTFGeometry(geometry, callback);
  }

  /**
   * Exports scene to OBJ file format
   */
  public exportSceneToOBJ() {
    const scene = this.sceneManager.getCleanScene();
    this.exportManager.exportSceneToOBJ(scene);
  }

  /**
   * Exports scene as phoenix format, allowing to load it later and recover the saved configuration.
   */
  public exportPhoenixScene() {
    const scene = this.sceneManager.getCleanScene();
    this.exportManager.exportPhoenixScene(
      scene, this.sceneManager.getEventData(),
      this.sceneManager.getGeometries());
  }

  /**
   * Fixes the camera position of the overlay view.
   */
  public fixOverlayView(fixed: boolean) {
    this.rendererManager.setFixOverlay(fixed);
  }

  /**
   * Initializes the object in which will be shown the information of the selected geometries.
   * @param selectedObject Object to display the data.
   */
  public setSelectedObjectDisplay(selectedObject: { name: string, attributes: any[] }) {
    this.getSelectionManager().setSelectedObject(selectedObject);
  }

  /**
   * Set event data depthTest to enable/disable if event data should show on top of geometry.
   * @param value A boolean to specify if depthTest is to be enabled or disabled.
   */
  public eventDataDepthTest(value: boolean) {
    this.sceneManager.eventDataDepthTest(value);
  }

  /**
   * Toggles the ability of selecting geometries by clicking on the screen.
   * @param enable Value to enable or disable the functionality.
   */
  public enableSelecting(enable: boolean) {
    this.getSelectionManager().setSelecting(enable);
  }

  /**
   * Clears event data of the scene.
   */
  public clearEventData() {
    this.sceneManager.clearEventData();
  }

  /**
   * Adds to the event display all collections of a given object type.
   * @param object contains all collections of a given type (Tracks, Jets, CaloClusters...)
   * @param getObject function that handles of reconstructing objects of the given type.
   * @param typeName label for naming the object type.
   * @param cuts (Optional) filters that can be applied to the objects.
   */
  addEventDataTypeGroup(typeName: string): Group {
    return this.sceneManager.addEventDataTypeGroup(typeName);
  }

  /*********************************
  * Private auxiliary functions.  *
  *********************************/

  /**
   * Sets overlay renderer to a renderer manager.
   */
  public setOverlayRenderer(overlayCanvas: HTMLCanvasElement): void {
    if (this.rendererManager) {
      this.rendererManager.setOverlayRenderer(overlayCanvas);
    }
  }


  /**
   * Sets different parameters according to the configuration.
   * @param configuration Configuration object.
   */
  private setConfiguration(configuration: Configuration) {
  }

  /**
   * Returns the scene manager.
   */
  private getSelectionManager(): SelectionManager {
    if (!this.selectionManager) {
      this.selectionManager = new SelectionManager();
    }
    return this.selectionManager;
  }

  /**
   * Animates camera position.
   * @param cameraPosition End position.
   * @param duration Duration of an animation in seconds.
   */
  private animateCameraPosition(
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
  private animateCameraTarget(cameraTarget: number[], duration: number): void {
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
}
