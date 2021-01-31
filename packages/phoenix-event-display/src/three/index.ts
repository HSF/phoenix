import * as TWEEN from '@tweenjs/tween.js';
import {
  Group,
  Object3D,
  Vector3,
  Plane,
  Quaternion,
  AmbientLight,
  DirectionalLight,
  AxesHelper,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  Euler
} from 'three';
import { Configuration } from '../extras/configuration';
import { ControlsManager } from './controls-manager';
import { RendererManager } from './renderer-manager';
import { ExportManager } from './export-manager';
import { ImportManager } from './import-manager';
import { SelectionManager } from './selection-manager';
import { SceneManager } from './scene-manager';
import { AnimationsManager } from './animations-manager';
import { InfoLogger } from '../info-logger';
import { EffectsManager } from './effects-manager';
import { VRManager } from './vr-manager';
import { StateManager } from '../managers/state-manager';
import { LoadingManager } from '../managers/loading-manager';

/**
 * Manager for all three.js related functions.
 */
export class ThreeManager {
  // Managers
  /** Manager for three.js scene */
  private sceneManager: SceneManager;
  /** Manager for three.js renderers */
  private rendererManager: RendererManager;
  /** Manager for three.js controls */
  private controlsManager: ControlsManager;
  /** Manager for export operations */
  private exportManager: ExportManager;
  /** Manager for import operations */
  private importManager: ImportManager;
  /** Manager for selection of 3D objects and event data */
  private selectionManager: SelectionManager;
  /** Manager for managing animation related operations using three.js and tween.js */
  private animationsManager: AnimationsManager;
  /** Manager for managing effects using EffectComposer */
  private effectsManager: EffectsManager;
  /** VR manager for VR related operations */
  private vrManager: VRManager;
  /** Loading manager for loadable resources */
  private loadingManager: LoadingManager;
  /** Loop to run for each frame of animation. */
  private animationLoop: () => void;
  /** Loop to run for each frame to update stats. */
  private uiLoop: () => void;
  /** Scene export ignore list */
  private ignoreList = [
    new AmbientLight().type,
    new DirectionalLight().type,
    new AxesHelper().type
  ];
  /** Clipping planes for clipping geometry */
  private clipPlanes: Plane[];

  /**
   * Create the three manager for three.js operations.
   * @param infoLogger Logger for logging data to the information panel.
   */
  constructor(private infoLogger: InfoLogger) {
    this.rendererManager = new RendererManager();
    this.loadingManager = new LoadingManager();
  }

  /**
   * Initializes the necessary three.js functionality.
   * @param configuration Configuration to customize different aspects.
   * @param infoLogger Service for logging data to the information panel.
   */
  public init(configuration: Configuration) {
    // Set the clipping planes
    this.clipPlanes = [
      new Plane(new Vector3(0, 1, 0), 0),
      new Plane(new Vector3(0, -1, 0), 0),
      new Plane(new Vector3(0, 0, 1), -15000)
    ];
    // Scene manager
    this.sceneManager = new SceneManager(this.ignoreList);
    // IO Managers
    this.exportManager = new ExportManager();
    this.importManager = new ImportManager(
      this.clipPlanes,
      SceneManager.EVENT_DATA_ID,
      SceneManager.GEOMETRIES_ID
    );
    // Renderer manager
    this.rendererManager.init(configuration.elementId);
    // Controls manager
    this.controlsManager = new ControlsManager(this.rendererManager, configuration.defaultView);
    this.controlsManager.hideTubeTracksOnZoom(this.sceneManager.getScene(), 200);
    // Effects manager
    this.effectsManager = new EffectsManager(
      this.controlsManager.getMainCamera(),
      this.sceneManager.getScene(),
      this.rendererManager.getMainRenderer()
    );
    // Animations manager
    this.animationsManager = new AnimationsManager(
      this.sceneManager.getScene(),
      this.controlsManager.getActiveCamera(),
      this.rendererManager
    );
    // VR manager
    this.vrManager = new VRManager();
    // Selection manager
    this.getSelectionManager().init(
      this.controlsManager.getMainCamera(),
      this.sceneManager.getScene(),
      this.effectsManager,
      this.infoLogger
    );
    // Set camera of the event display state
    new StateManager().setCamera(this.controlsManager.getActiveCamera());
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
   * Set up the animation loop of the renderer.
   * @param uiLoop Function to run on render for UI (stats) apart from three manager operations.
   */
  public setAnimationLoop(uiLoop: () => void) {
    this.uiLoop = uiLoop;
    this.animationLoop = () => {
      this.uiLoop();
      this.updateControls();
      this.render();
    };
    this.rendererManager.getMainRenderer().setAnimationLoop(this.animationLoop);
  }

  /**
   * Stop the animation loop from running.
   */
  public stopAnimationLoop() {
    this.rendererManager.getMainRenderer().setAnimationLoop(null);
  }

  /**
   * Render overlay renderer and effect composer, and update lights.
   */
  public render() {
    this.rendererManager.render(this.sceneManager.getScene(), this.controlsManager.getOverlayCamera());
    this.effectsManager.render(this.sceneManager.getScene(), this.controlsManager.getMainCamera());
    this.sceneManager.updateLights(this.controlsManager.getActiveCamera());
  }

  /**
   * Minimally render without any post-processing.
   */
  public vrRender() {
    this.uiLoop();
    this.rendererManager.getMainRenderer().render(
      this.sceneManager.getScene(),
      this.vrManager.getVRCamera()
    );
    // The light directs towards origin
    this.sceneManager.updateLights(this.vrManager.getVRCamera());
  }

  /**
   * Get the scene manager and create if it doesn't exist.
   * @returns The scene manager for managing different aspects and elements of the scene.
   */
  public getSceneManager(): SceneManager {
    if (!this.sceneManager) {
      this.sceneManager = new SceneManager(this.ignoreList);
    }
    return this.sceneManager;
  }

  /**
   * Sets controls to auto rotate.
   * @param autoRotate If the controls are to be automatically rotated or not.
   */
  public autoRotate(autoRotate: boolean) {
    this.controlsManager.getActiveControls().autoRotate = autoRotate;
  }

  /**
   * Enables geometries to be clipped with clipping planes.
   * @param clippingEnabled If the the geometry clipping is to be enabled or disabled.
   */
  public setClipping(clippingEnabled: boolean) {
    this.rendererManager.setLocalClippingEnabled(clippingEnabled);
  }

  /**
   * Rotates clipping planes.
   * @param angle Angle to rotate the clipping planes.
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
  ) {
    this.animateCameraPosition(cameraPosition, duration);
    this.animateCameraTarget(cameraTarget, duration);
  }

  /**
   * Swaps cameras.
   * @param useOrthographic Whether to use orthographic or perspective camera.
   */
  public swapCameras(useOrthographic: boolean) {
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

  // *************************************
  // * Functions for loading geometries. *
  // *************************************

  /**
   * Loads an OBJ (.obj) geometry from the given filename.
   * @param filename Path to the geometry.
   * @param name Name given to the geometry.
   * @param color Color to initialize the geometry.
   * @param doubleSided Renders both sides of the material.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   * @param setFlat Whether object should be flat-shaded or not.
   * @returns Promise for loading the geometry.
   */
  public loadOBJGeometry(
    filename: string,
    name: string,
    color: any,
    doubleSided?: boolean,
    initiallyVisible: boolean = true,
    setFlat: boolean = true
  ): Promise<unknown> {
    const geometries = this.sceneManager.getGeometries();
    const callback = (object: Object3D) => {
      object.visible = initiallyVisible;
      geometries.add(object);
    };
    return this.importManager.loadOBJGeometry(callback, filename, name, color, doubleSided, setFlat);
  }

  /**
   * Loads a GLTF (.gltf) scene/geometry from the given URL.
   * @param sceneUrl URL to the GLTF (.gltf) file.
   * @param name Name of the loaded scene/geometry.
   * @param scale Scale of the geometry.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   * @returns Promise for loading the geometry.
   */
  public loadGLTFGeometry(
    sceneUrl: any,
    name: string,
    scale?: number,
    initiallyVisible: boolean = true
  ): Promise<unknown> {
    const geometries = this.sceneManager.getGeometries();
    const callback = (geometry: Object3D) => {
      geometry.visible = initiallyVisible;
      geometries.add(geometry);
    };
    return this.importManager.loadGLTFGeometry(sceneUrl, name, callback, scale);
  }

  /**
   * Parses and loads a geometry in OBJ (.obj) format.
   * @param geometry Geometry in OBJ (.obj) format.
   * @param name Name given to the geometry.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   */
  public parseOBJGeometry(geometry: string, name: string, initiallyVisible: boolean = true) {
    const geometries = this.sceneManager.getGeometries();
    const object = this.importManager.parseOBJGeometry(geometry, name);
    object.visible = initiallyVisible;
    geometries.add(object);
    this.loadingManager.itemLoaded(`parse_obj_${name}`);
  }

  /**
   * Parses and loads a geometry in GLTF (.gltf) format.
   * @param geometry Geometry in GLTF (.gltf) format.
   * @param name Name given to the geometry.
   * @returns Promise for loading the geometry.
   */
  public parseGLTFGeometry(geometry: any, name: string): Promise<unknown> {
    const callback = (scene: Object3D) => {
      this.sceneManager.getScene().add(scene);
    };
    return this.importManager.parseGLTFGeometry(geometry, name, callback);
  }

  /**
   * Parses and loads a scene in Phoenix (.phnx) format.
   * @param scene Geometry in Phoenix (.phnx) format.
   * @returns Promise for loading the scene.
   */
  public parsePhnxScene(scene: any): Promise<unknown> {
    const callback = (geometries: Object3D, eventData: Object3D) => {
      this.sceneManager.getScene().add(geometries);
      this.sceneManager.getScene().add(eventData);
    };
    return this.importManager.parsePhnxScene(scene, callback);
  }

  /**
   * Loads geometries from JSON.
   * @param json JSON or URL to JSON file of the geometry.
   * @param name Name of the geometry or group of geometries.
   * @param scale Scale of the geometry.
   * @param doubleSided Renders both sides of the material.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   * @returns Promise for loading the geometry.
   */
  public loadJSONGeometry(json: string | object, name: string, scale?: number,
    doubleSided?: boolean, initiallyVisible: boolean = true): Promise<unknown> {
    const geometries = this.sceneManager.getGeometries();
    const callback = (geometry: Object3D) => {
      geometry.visible = initiallyVisible;
      geometries.add(geometry);
    };
    return this.importManager.loadJSONGeometry(json, name, callback, scale, doubleSided);
  }

  /**
   * Exports scene to OBJ file format.
   */
  public exportSceneToOBJ() {
    const scene = this.sceneManager.getCleanScene();
    this.exportManager.exportSceneToOBJ(scene);
  }

  /**
   * Exports scene as phoenix format, allowing to
   * load it later and recover the saved configuration.
   */
  public exportPhoenixScene() {
    const scene = this.sceneManager.getCleanScene();
    this.exportManager.exportPhoenixScene(
      scene, this.sceneManager.getEventData(),
      this.sceneManager.getGeometries());
  }

  /**
   * Fixes the camera position of the overlay view.
   * @param fixed Whether the overlay view is to be fixed or not.
   */
  public fixOverlayView(fixed: boolean) {
    this.rendererManager.setFixOverlay(fixed);
  }

  /**
   * Initializes the object which will show information of the selected geometry/event data.
   * @param selectedObject Object to display the data.
   */
  public setSelectedObjectDisplay(selectedObject: { name: string, attributes: any[] }) {
    this.getSelectionManager().setSelectedObject(selectedObject);
  }

  /**
   * Set event data depthTest to enable or disable if event data should show on top of geometry.
   * @param value A boolean to specify if depthTest is to be enabled or disabled.
   */
  public eventDataDepthTest(value: boolean) {
    this.sceneManager.eventDataDepthTest(value);
  }

  /**
   * Toggles the ability of selecting geometries/event data by clicking on the screen.
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
   * Adds group of an event data type to the main group containing event data.
   * @param typeName Type of event data.
   * @returns Three.js group containing the type of event data.
   */
  addEventDataTypeGroup(typeName: string): Group {
    return this.sceneManager.addEventDataTypeGroup(typeName);
  }

  /**
   * Sets the renderer to be used to render the event display on the overlayed canvas.
   * @param overlayCanvas An HTML canvas on which the overlay renderer is to be set.
   */
  public setOverlayRenderer(overlayCanvas: HTMLCanvasElement) {
    if (this.rendererManager) {
      this.rendererManager.setOverlayRenderer(overlayCanvas);
    }
  }

  /**
   * Zoom all the cameras by a specific zoom factor.
   * The factor may either be greater (zoom in) or smaller (zoom out) than 1.
   * @param zoomFactor The factor to zoom by.
   * @param zoomTime The time it takes for a zoom animation to complete.
   */
  public zoomTo(zoomFactor: number, zoomTime: number) {
    this.controlsManager.zoomTo(zoomFactor, zoomTime);
  }

  // ********************************
  // * Private auxiliary functions. *
  // ********************************

  /**
   * Get the selection manager.
   * @returns Selection manager responsible for managing selection of 3D objects.
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
  private animateCameraPosition(cameraPosition: number[], duration: number) {
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
  private animateCameraTarget(cameraTarget: number[], duration: number) {
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
   * Get the uuid of the currently selected object.
   * @returns uuid of the currently selected object.
   */
  public getActiveObjectId(): any {
    return this.getSelectionManager().getActiveObjectId();
  }

  /**
   * Move the camera to look at the object with the given uuid.
   * @param uuid uuid of the object.
   */
  public lookAtObject(uuid: string) {
    this.controlsManager.lookAtObject(uuid, this.getSceneManager().getEventData());
  }

  /**
   * Get position of object from UUID.
   * @param uuid UUID of the object.
   * @returns Position of the 3D object.
   */
  public getObjectPosition(uuid: string): Vector3 {
    return this.controlsManager.getObjectPosition(uuid, this.getSceneManager().getScene());
  }

  /**
   * Highlight the object with the given uuid by giving it an outline.
   * @param uuid uuid of the object.
   */
  public highlightObject(uuid: string) {
    this.selectionManager.highlightObject(uuid, this.getSceneManager().getEventData());
  }

  /**
   * Enable keyboard controls for some Three service operations.
   */
  public enableKeyboardControls() {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const isTyping = ['input', 'textarea'].includes(
        (e.target as HTMLElement)?.tagName.toLowerCase()
      );

      if (!isTyping && e.shiftKey) {
        switch (e.code) {
          case 'KeyR': // shift + "r"
            this.autoRotate(!this.controlsManager.getActiveControls().autoRotate);
            break;
          case 'Equal': // shift + "+"
            this.zoomTo(1 / 1.2, 100);
            break;
          case 'Minus': // shift + "-"
            this.zoomTo(1.2, 100);
            break;
          case 'KeyC': // shift + "c"
            this.setClipping(!this.rendererManager.getLocalClipping());
            if (this.rendererManager.getLocalClipping()) {
              this.rotateClipping(180);
            }
            break;
          case 'KeyV': // shift + "v"
            const isOrthographicView = this.controlsManager.getMainCamera()
              .type === 'OrthographicCamera';
            this.swapCameras(!isOrthographicView);
            break;
        }
      }
    });
  }

  /**
   * Animate the camera through the event scene.
   * @param startPos Start position of the translation animation.
   * @param tweenDuration Duration of each tween in the translation animation.
   * @param onAnimationEnd Callback when the last animation ends.
   */
  public animateThroughEvent(startPos: number[],
    tweenDuration: number,
    onAnimationEnd?: () => void) {
    this.animationsManager
      .animateThroughEvent(startPos, tweenDuration, onAnimationEnd);
  }

  /**
   * Animate the propagation and generation of event data with particle collison.
   * @param tweenDuration Duration of the animation tween.
   * @param onEnd Function to call when all animations have ended.
   */
  public animateEventWithCollision(tweenDuration: number, onEnd?: () => void) {
    this.animationsManager.animateEventWithCollision(tweenDuration, onEnd);
  }

  /**
   * Animate the propagation and generation of event data
   * using clipping planes after particle collison.
   * @param tweenDuration Duration of the animation tween.
   * @param onEnd Function to call when all animations have ended.
   */
  public animateClippingWithCollision(tweenDuration: number, onEnd?: () => void) {
    this.animationsManager.animateClippingWithCollision(tweenDuration, onEnd);
  }

  /**
   * Initialize the VR session.
   * @param onSessionEnded Callback when the VR session ends.
   */
  public initVRSession(onSessionEnded?: () => void) {
    // Set up main renderer for VR
    const mainRenderer = this.rendererManager.getMainRenderer();
    mainRenderer.xr.enabled = true;

    // Set the VR animation loop
    mainRenderer.xr.setAnimationLoop(this.vrRender.bind(this));

    // Set up the camera position in the VR - Adding a group with camera does it
    // The VR camera is only available AFTER the session starts
    // For why we can't just move the camera directly, see e.g. 
    // https://stackoverflow.com/questions/34470248/unable-to-change-camera-position-when-using-vrcontrols/34471170#34471170
    const onSessionStarted = () => {
      const cameraGroup = this.vrManager
        .getCameraGroup(this.controlsManager.getMainCamera());
      this.sceneManager.getScene().add(cameraGroup);
    };

    // Set and initialize the VR session
    this.vrManager.setVRSession(mainRenderer, onSessionStarted, onSessionEnded);
  }

  /**
   * End the current VR session.
   */
  public endVRSession() {
    this.sceneManager.getScene().remove(this.vrManager.getCameraGroup());

    const mainRenderer = this.rendererManager.getMainRenderer();
    mainRenderer.xr.setAnimationLoop(null);
    mainRenderer.xr.enabled = false;

    this.vrManager.endVRSession();
  }

  /**
   * Get an object from the scene by name.
   * @param objectName Name of the object in scene.
   */
  public getObjectByName(objectName: string): Object3D {
    return this.getSceneManager().getScene().getObjectByName(objectName);
  }

  /**
   * Set the antialiasing.
   * @param antialias Whether antialiasing is to enabled or disabled.
   */
  public setAntialiasing(antialias: boolean) {
    this.effectsManager.setAntialiasing(antialias);
  }

  /** Add parametrised geometry to the scene.
   * @param parameters The name, dimensions, and radial values for this cylindrical volume.
   */
  public addGeometryFromParameters(parameters: any): void {
    this.loadingManager.addLoadableItem('geom_from_params');

    let scene = this.getSceneManager().getScene();
    let moduleName = parameters.ModuleName;
    let moduleXdim = parameters.Xdim;
    let moduleYdim = parameters.Ydim;
    let moduleZdim = parameters.Zdim;
    let numPhiEl = parameters.NumPhiEl;
    let numZEl = parameters.NumZEl;
    let radius = parameters.Radius;

    let minZ = parameters.MinZ;
    let maxZ = parameters.MaxZ;
    let tiltAngle = parameters.TiltAngle;
    let ztiltAngle = parameters.ZTiltAngle;
    let phiOffset = parameters.PhiOffset;
    let colour = parameters.Colour;
    let edgecolour = parameters.EdgeColour;
    // Make the geometry and material
    var geometry = new BoxGeometry(moduleXdim, moduleYdim, moduleZdim);
    var material = new MeshBasicMaterial({ color: colour, opacity: 0.5, transparent: true });

    var zstep = (maxZ - minZ) / numZEl;
    var phistep = 2. * Math.PI / numPhiEl;

    var z = minZ + zstep / 2.;

    var halfPi = Math.PI / 2.0;
    var modulecentre;
    for (var elZ = 0; elZ < numZEl; elZ++) {
      var phi = phiOffset;
      for (var elPhi = 0; elPhi < numPhiEl; elPhi++) {
        phi += phistep;
        modulecentre = new Vector3(radius * Math.cos(phi), radius * Math.sin(phi), z);
        var cube = new Mesh(geometry.clone(), material);

        cube.matrix.makeRotationFromEuler(new Euler(ztiltAngle, 0.0, halfPi + phi + tiltAngle));
        cube.matrix.setPosition(modulecentre);
        cube.matrixAutoUpdate = false;
        scene.add(cube);

        // var egh = new EdgesHelper(cube, edgecolour);
        // egh.material.linewidth = 2;
        // scene.add(egh);
      }
      z += zstep
    }

    this.loadingManager.itemLoaded('geom_from_params');
  }

  /**
   * Add a 3D text label to label an event data object.
   * @param label Label to add to the event object.
   * @param uuid UUID of the three.js object.
   */
  public addLabelToObject(label: string, uuid: string) {
    const cameraControls = this.controlsManager.getActiveControls();
    const objectPosition = this.getObjectPosition(uuid);
    this.getSceneManager().addLabelToObject(label, uuid, objectPosition, cameraControls);
  }
}
