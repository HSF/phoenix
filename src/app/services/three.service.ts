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
  Quaternion,
  Points,
  PointsMaterial,
  MeshPhongMaterial
} from 'three';
import { Configuration } from './extras/configuration.model';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ControlsManager } from './extras/controls-manager';
import { RendererManager } from './extras/renderer-manager';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { Cut } from './extras/cut.model';

@Injectable({
  providedIn: 'root'
})
export class ThreeService {
  // Threejs Variables
  private scene: Scene;
  private detector: Object3D;
  private sceneColor: THREE.Color | THREE.Texture;
  private perspectiveControls: OrbitControls;
  private orthographicControls: OrbitControls;
  private perspectiveCamera: PerspectiveCamera;
  private orthographicCamera: OrthographicCamera;
  // Managers
  private rendererManager: RendererManager;
  private controlsManager: ControlsManager;
  // Scene export ignore list
  private ignoreList: string[];
  // Array of objects we are going to pass to the RayCaster for intersecting
  private objects: Object3D[];
  // Clipping planes
  private clipPlanes: Plane[] = [
    new Plane(new THREE.Vector3(0, 1, 0), 0),
    new Plane(new THREE.Vector3(0, -1, 0), 0),
    new Plane(new THREE.Vector3(0, 0, 1), -15000)
  ];
  // Axis
  private axis: AxesHelper;

  // Post processing
  private composer: EffectComposer;
  private outlinePass: OutlinePass;
  private renderPass: RenderPass;

  // Control behaviour
  private objectSelectionActive: boolean;

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

    // Renderer manager
    this.rendererManager = new RendererManager();
    // Main renderer for current browsers
    this.setRenderer();
    // Overlay renderer
    this.setOverlayRenderer();

    // Orbit controls allow to move around
    this.perspectiveControls = this.setOrbitControls(
      this.perspectiveCamera,
      this.rendererManager.mainRenderer.domElement
    );
    this.orthographicControls = this.setOrbitControls(
      this.orthographicCamera,
      this.rendererManager.mainRenderer.domElement
    );
    // Controls manager
    this.controlsManager = new ControlsManager(this.perspectiveControls);
    // Set active orbit controls
    this.controlsManager.addControls(this.perspectiveControls);
    this.controlsManager.addControls(this.orthographicControls);
    this.controlsManager.mainControls = this.perspectiveControls;
    this.controlsManager.overlayControls = this.orthographicControls;
    // Add listener
    this.controlsManager.activeControls.addEventListener(
      'change',
      ((scope) => {
        const controlsManager = scope.controlsManager;

        return () => {
          controlsManager.transformSync();
          controlsManager.updateSync();
        };
      })(this)
    );

    // Export ignore list
    this.ignoreList = [
      new THREE.AmbientLight().type,
      new THREE.DirectionalLight().type,
      new THREE.AxesHelper().type
    ];
    // Object Collections
    this.objects = [];
    // Axis
    this.axis = null;

    // Different lights to better see the object
    this.setLights();

    // Setup postprocessing
    this.composer = new EffectComposer(this.rendererManager.mainRenderer);

    this.renderPass = new RenderPass(this.scene, this.perspectiveCamera);
    this.composer.addPass(this.renderPass);

    this.outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.perspectiveCamera);
    this.outlinePass.overlayMaterial.blending = THREE.NormalBlending;
    this.composer.addPass(this.outlinePass);
    this.outlinePass.visibleEdgeColor.set(0xffff66);
    this.outlinePass.visibleEdgeColor.set(0xdf5330);

    // Customizing with configuration
    this.setConfiguration(configuration);

    // Set some defaults
    this.objectSelectionActive = false;
  }

  public updateControls() {
    this.controlsManager.activeControls.update();
    this.controlsManager.updateSync();
    TWEEN.update();
  }

  public render() {
    // this.rendererManager.mainRenderer.render(
    //   this.scene,
    //   this.controlsManager.mainCamera
    // );

    this.composer.render();

    if (!this.rendererManager.overlayRenderer.domElement.hidden) {
      this.sceneColor = this.scene.background;
      this.scene.background = null;

      if (!this.rendererManager.isFixedOverlay()) {
        this.rendererManager.overlayRenderer.render(
          this.scene,
          this.controlsManager.overlayCamera
        );
      }
      this.scene.background = this.sceneColor;
    }

  }

  /*********************************
   * Private auxiliary functions.  *
   *********************************/

  private setRenderer() {
    const renderer: WebGLRenderer = new THREE.WebGLRenderer();

    this.rendererManager.addRenderer(renderer);
    this.rendererManager.mainRenderer = renderer;
    this.rendererManager.mainRenderer.setSize(
      window.innerWidth,
      window.innerHeight,
      false
    );
    this.rendererManager.mainRenderer.domElement.className = 'ui-element';
    this.rendererManager.mainRenderer.domElement.id = 'three-canvas';
    let canvas = document.getElementById('eventDisplay');
    if (canvas == null) {
      canvas = document.body;
    }
    canvas.appendChild(this.rendererManager.mainRenderer.domElement);
  }

  /**
   * Sets overlay renderer to a renderer manager.
   *
   */
  private setOverlayRenderer(): void {
    const overlayCanvas: HTMLCanvasElement = this.initializeOverlayCanvas(
      'overlay-canvas',
      window.innerWidth / 2.5,
      window.innerHeight / 2.5
    );
    const overlayRenderer: WebGLRenderer = this.intializeOverlayRenderer(
      overlayCanvas
    );

    this.rendererManager.addRenderer(overlayRenderer);
    this.rendererManager.overlayRenderer = overlayRenderer;

    const canvas = document.getElementById('eventDisplay');
    canvas.appendChild(this.rendererManager.overlayRenderer.domElement);
    this.renderOverlay(false);
  }

  /**
   * Initializes overlay HTML canvas element.
   * @param ID ID of the canvas element.
   * @param width Desired width of the canvas element.
   * @param height Desired height of the canvas element.
   */
  private initializeOverlayCanvas(
    ID: string,
    width: number,
    height: number
  ): HTMLCanvasElement {
    const canvas: HTMLCanvasElement = this.initializeCanvas(ID, width, height);
    canvas.style.width = width.toString() + 'px';
    canvas.style.height = height.toString() + 'px';
    canvas.style.position = 'absolute';
    canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    canvas.style.left = window.innerWidth - width - 100 + 'px';
    canvas.style.top = 100 + 'px';
    canvas.style.border = '1px solid #ccc';
    canvas.style.borderRadius = '8px';
    // canvas.style.pointerEvents = "none";

    // Add listener
    const offset: { x: number; y: number } = { x: 0, y: 0 };
    let mouseDown = false;
    // Padding limit for element dragging
    const sidePadding = 3;

    canvas.addEventListener(
      'mousedown',
      (event) => {
        mouseDown = true;
        offset.x = event.clientX - canvas.offsetLeft;
        offset.y = event.clientY - canvas.offsetTop;
      },
      true
    );

    document.addEventListener(
      'mouseup',
      () => {
        mouseDown = false;
      },
      true
    );

    document.addEventListener(
      'mousemove',
      (event) => {
        event.preventDefault();
        if (mouseDown) {
          const posX = event.clientX - offset.x;
          const posY = event.clientY - offset.y;
          const rightLimit = window.innerWidth - canvas.clientWidth - sidePadding;
          const bottomLimit = window.innerHeight - canvas.clientHeight - sidePadding;

          // If the position is inside the window width AND the position is not less than the left padding
          if ((posX < rightLimit) && (posX > sidePadding)) {
            canvas.style.left = posX + 'px';
          }
          // If the position is inside the window height AND the position is not less than the top padding
          if ((posY < bottomLimit) && (posY > sidePadding)) {
            canvas.style.top = posY + 'px';
          }
        }
      },
      true
    );

    return canvas;
  }

  /**
   * Initializes overlay renderer.
   * @param overlayCanvas Canvas element for the renderer.
   */
  private intializeOverlayRenderer(
    overlayCanvas: HTMLCanvasElement
  ): WebGLRenderer {
    const parameters: WebGLRendererParameters = {
      canvas: overlayCanvas,
      antialias: false,
      alpha: true
    };

    return this.initializeRenderer(parameters);
  }

  /**
   * Initializes HTML canvas element.
   * @param ID ID of the canvas element.
   * @param width Desired width of the canvas element.
   * @param height Desired height of the canvas element.
   * @returns canvas
   */
  private initializeCanvas(
    ID: string,
    width: number = window.innerWidth,
    height: number = window.innerHeight
  ): HTMLCanvasElement {
    const canvas: HTMLCanvasElement = document.createElement(
      'canvas'
    ) as HTMLCanvasElement;
    canvas.id = ID;
    canvas.width = width;
    canvas.height = height;

    return canvas;
  }

  /**
   * Initializes WebGL Renderer.
   * @param [parameters] Optional parameters for the renderer.
   * @returns renderer
   */
  private initializeRenderer(
    parameters?: WebGLRendererParameters
  ): WebGLRenderer {
    const renderer: WebGLRenderer = new THREE.WebGLRenderer(parameters);
    // renderer.setSize(canvas.width, canvas.height);
    // renderer.domElement.style.cssText = canvas.style.cssText;

    return renderer;
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
    if (configuration.allowSelecting) {
      this.enableSelecting();
    }
  }

  private saveString(text, filename) {
    this.save(new Blob([text], { type: 'text/plain' }), filename);
  }

  private getEventData(): Object3D {
    let eventData = this.scene.getObjectByName('EventData');
    if (eventData == null) {
      eventData = new Group();
      eventData.name = 'EventData';
      this.scene.add(eventData);
      this.objects.push(eventData);
    }
    return eventData;
  }

  private save(blob, filename) {
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  private saveEventDataConfiguration(eventDataConfig: any) {
    const eventData = this.getEventData();
    for (const objectType of eventData.children) {
      if (objectType.name) {
        eventDataConfig[objectType.name] = [];
        for (const collection of objectType.children) {
          if (collection.name) {
            eventDataConfig[objectType.name].push(collection.name);
          }
        }
      }
    }
  }

  private saveGeometriesConfiguration(geometriesConfig: any[]) {
    for (const object of this.objects) {
      if (object.name !== 'EventData') {
        geometriesConfig.push(object.name);
      }
    }
  }

  /*********************************
   *      Public functions.        *
   *********************************/

  exportSceneToOBJ() {
    // Instantiate a exporter
    const exporter = new OBJExporter();

    const sceneConfig = { eventData: {}, geometries: [] };

    this.saveEventDataConfiguration(sceneConfig.eventData);
    this.saveGeometriesConfiguration(sceneConfig.geometries);

    // Get a copy of clean scene before parse
    const cleanScene: THREE.Scene = this.cleanScene(this.scene);

    // Parse the input and generate the glTF output
    const result = exporter.parse(cleanScene);
    this.saveString(result, 'phoenix-obj.obj');
  }

  // SAVE SCENE
  public exportPhoenixScene() {
    // Instantiate a exporter
    const exporter = new GLTFExporter();

    const sceneConfig = { eventData: {}, geometries: [] };

    this.saveEventDataConfiguration(sceneConfig.eventData);
    this.saveGeometriesConfiguration(sceneConfig.geometries);

    // Get a copy of clean scene before parse
    const cleanScene: THREE.Scene = this.cleanScene(this.scene);

    // Parse the input and generate the glTF output
    exporter.parse(
      cleanScene,
      result => {
        const jsonResult = { sceneConfiguration: sceneConfig, scene: result };
        const output = JSON.stringify(jsonResult, null, 2);
        this.saveString(output, 'phoenix-scene.phnx');
      },
      null
    );
  }

  // LOAD SCENE
  public loadScene(scene: any) {
    const loader = new GLTFLoader();
    const sceneString = JSON.stringify(scene, null, 2);
    // @ts-ignore
    loader.parse(sceneString, '', gltf => {
      const eventData = this.getEventData();
      gltf.scene.children.forEach((child) => this.scene.add(child));

      const savedEvent = gltf.scene.getObjectByName('EventData');
      if (savedEvent) {
        eventData.children = savedEvent.children;
      }

      this.setLights();

      if (this.axis !== null) {
        this.scene.add(this.axis);
      }
    });
  }

  // LOAD SCENE
  public loadGLTFDetector(sceneUrl: any) {
    console.log('Loading ', sceneUrl);
    const loader = new GLTFLoader();
    // @ts-ignore
    loader.load(sceneUrl, gltf => {
      this.detector = gltf.scene;
      this.scene.add(this.detector);
      this.setLights();

      if (this.axis !== null) {
        this.scene.add(this.axis);
      }
    });
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

  public clearCanvas() {
    const elements = document.body.getElementsByClassName('ui-element');
    const elementsSize = elements.length;
    for (let i = 0; i < elementsSize; i++) {
      if (elements.item(0) != null) {
        elements.item(0).remove();
      }
    }
  }

  public clearEventData() {
    const eventData = this.getEventData();
    if (eventData != null) {
      this.scene.remove(eventData);

      // clear previously saved objects
      this.objects = [];
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
    this.controlsManager.activeControls.autoRotate = value;
  }

  public setClipping(value: boolean) {
    this.rendererManager.setLocalClippingEnabled(value);
  }

  public rotateClipping(angle: number) {
    const q = new Quaternion();
    q.setFromAxisAngle(new Vector3(0, 0, 1), (angle * Math.PI) / 180);
    this.clipPlanes[0].normal.set(0, 1, 0).applyQuaternion(q);
  }

  public getXClipPlane() {
    return this.clipPlanes[0];
  }

  public getYClipPlane() {
    return this.clipPlanes[1];
  }

  public getZClipPlane() {
    return this.clipPlanes[2];
  }

  public lowerResolution(value: boolean) {
    if (value) {
      this.rendererManager.mainRenderer.setSize(
        window.innerWidth / 2,
        window.innerHeight / 2,
        false
      );
    } else {
      this.rendererManager.mainRenderer.setSize(
        window.innerWidth,
        window.innerHeight
      );
    }
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

  public setDetectorOpacity(value: number) {
    console.log('Changing detector opacity to ', value);
    if (value) {
      this.detector.traverse((o: any) => {
        if (o.isMesh === true) {
          o.material.transparent = true;
          o.material.opacity = value;
        }
      });
    }
  }

  public setNamedDetectorOpacity(name: string, value: number) {
    console.log('Changing detector opacity to ', value);
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
      this.controlsManager.activeCamera.position
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
      this.controlsManager.activeControls.target
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

    if (this.controlsManager.mainCamera.type !== cameraType) {
      this.controlsManager.swapControls();
    }
  }

  /**
   * Aligns a camera with one of the main axis.
   * @param axis Name of the main axis to aling to (x, y, or z).
   */
  public alignCameraWithAxis(axis: string): void {
    switch (axis) {
      case 'x':
      case 'X': {
        this.alignCameraWithVector(new THREE.Vector3(1, 0, 0));
        break;
      }
      case 'y':
      case 'Y': {
        this.alignCameraWithVector(new THREE.Vector3(0, 1, 0));
        break;
      }
      case 'z':
      case 'Z': {
        this.alignCameraWithVector(new THREE.Vector3(0, 0, 1));
        break;
      }
      default: {
        console.log(
          'Error : ¡ Invalid camera align parameter (use x, y or z)!'
        );
      }
    }
  }

  /**
   * Aligns a camera (and move its orbit target) with a vector.
   * @param targetlookAtVector Vector to align camera to.
   */
  private alignCameraWithVector(targetlookAtVector: THREE.Vector3): void {
    const activeLookAtVector: THREE.Vector3 = new THREE.Vector3(0, 0, -1);
    activeLookAtVector.applyQuaternion(
      this.controlsManager.mainCamera.quaternion
    );

    const orbitTargetVector: THREE.Vector3 = new THREE.Vector3();
    orbitTargetVector.subVectors(
      this.controlsManager.mainControls.target,
      this.controlsManager.mainCamera.position
    );

    const direction: number = orbitTargetVector.dot(targetlookAtVector);
    targetlookAtVector.normalize().multiplyScalar(orbitTargetVector.length());
    if (direction < 0) {
      targetlookAtVector.multiplyScalar(-1);
    }

    const newLookAtPoint: THREE.Vector3 = targetlookAtVector.add(
      this.controlsManager.mainCamera.position
    );

    // instant change
    // this.controlsManager.mainControls.target = newLookAtPoint;
    // this.updateControls()

    // animated change
    this.animateCameraTarget(newLookAtPoint.toArray(), 1000);
  }

  private enableSelecting() {
    // FIXME - not sure if this is needed, given we have it in eventdisplay.service.ts
    if (document.getElementById('three-canvas')) {
      document
        .getElementById('three-canvas')
        .addEventListener('touchmove', this.onTouchMove.bind(this));
      document
        .getElementById('three-canvas')
        .addEventListener('mousemove', this.onTouchMove.bind(this));
    }
  }

  public setAnimationLoop(animate: () => void) {
    this.rendererManager.mainRenderer.xr.enabled = true;
    this.rendererManager.mainRenderer.setAnimationLoop(animate);
  }

  public setVRButton() {
    let canvas = document.getElementById('eventDisplay');
    if (canvas == null) {
      canvas = document.body;
    }
    canvas.appendChild(
      VRButton.createButton(this.rendererManager.mainRenderer)
    );
  }

  public setObjectSelectionActive(active: boolean) {
    console.log('Object selection' + active);
    this.objectSelectionActive = active;
    if (!active) {
      this.outlinePass.selectedObjects = []; // Clear highlighting when switched off.
    }
  }

  public onTouchMove(event, selectedObject: any) {
    console.log('Mouse moved. Objection selection: ' + this.objectSelectionActive);
    // console.log(event);
    if (!this.objectSelectionActive) { return; }

    event.preventDefault();
    const mouse = new THREE.Vector2();
    if (event.changedTouches) {
      mouse.x = event.changedTouches[0].pageX;
      mouse.y = event.changedTouches[0].pageY;
    } else {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    console.log(mouse);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.controlsManager.mainCamera);
    raycaster.params.Line.threshold = 3;

    // @ts-ignore
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    console.log('got', intersects);

    if (intersects.length > 0) {
      // We want the closest one, that is a type we can highlight
      for (const obj of intersects) {
        console.log(obj);
        // console.log(obj.object.type)
        if (this.ignoreList.includes(obj.object.type)) { continue; }

        // selectedObject.name = obj.object.name;
        // selectedObject.attributes.splice(0, selectedObject.attributes.length);
        this.outlinePass.selectedObjects = [obj.object];
        break;
      }


    }
  }

  public selectObject(event, selectedObject: any) {
    console.log('Mouse clicked. Objection selection: ' + this.objectSelectionActive);
    console.log(event);
    if (!this.objectSelectionActive) { return; }
    const object = this.outlinePass.selectedObjects[0];
    selectedObject.name = object.name;
    selectedObject.attributes.splice(0, selectedObject.attributes.length);

    for (const key of Object.keys(object.userData)) {
      selectedObject.attributes.push({
        attributeName: key,
        attributeValue: object.userData[key]
      });
    }
  }

  /**
   * Sets visibility of an overlay.
   * @param value Boolean value whether to show and render overlay or not.
   */
  public renderOverlay(value: boolean): void {
    this.rendererManager.overlayRenderer.domElement.hidden = !value;
  }

  /**************************************
   * Functions for loading geometries . *
   **************************************/

  public buildGeometryFromParameters(parameters) {
    // Make the geometry and material
    const geometry = new THREE.BoxGeometry(
      parameters.xDim,
      parameters.yDim,
      parameters.zDim
    );
    const material = new THREE.MeshBasicMaterial({
      color: parameters.colour,
      opacity: 0.5,
      transparent: true
    });

    const zstep = (parameters.maxZ - parameters.minZ) / parameters.numZEl;
    const phistep = (2.0 * Math.PI) / parameters.numPhiEl;

    let z = parameters.minZ + zstep / 2.0;

    const halfPi = Math.PI / 2.0;
    let modulecentre;
    const ztiltAngle = 0;
    for (let elZ = 0; elZ < parameters.numZEl; elZ++) {
      // console.log(elZ);
      let phi = parameters.phiOffset;
      for (let elPhi = 0; elPhi < parameters.numPhiEl; elPhi++) {
        phi += phistep;
        modulecentre = new THREE.Vector3(
          parameters.radius * Math.cos(phi),
          parameters.radius * Math.sin(phi),
          z
        );
        const cube = new THREE.Mesh(geometry.clone(), material);

        cube.matrix.makeRotationFromEuler(
          new THREE.Euler(ztiltAngle, 0.0, halfPi + phi + parameters.tiltAngle)
        );
        cube.matrix.setPosition(modulecentre);
        cube.matrixAutoUpdate = false;
        this.scene.add(cube);

        const egh = new LineSegments(
          new EdgesGeometry(cube.geometry),
          new LineBasicMaterial({ color: parameters.colour })
        );
        // @ts-ignore
        egh.material.linewidth = 2;
        this.scene.add(egh);
      }
      z += zstep;
    }
  }

  public loadOBJFile(
    filename: string,
    name: string,
    colour,
    doubleSided: boolean
  ): void {
    if (colour == null) {
      colour = 0x41a6f4;
    }
    const objLoader = new OBJLoader();
    objLoader.load(filename, object => {
      this.processOBJ(object, name, colour, doubleSided, 'OBJ file');
    });
  }

  public loadOBJFromContent(content: string, name: string) {
    const objLoader = new OBJLoader();
    const object = objLoader.parse(content);
    this.processOBJ(
      object,
      name,
      0x41a6f4,
      false,
      'OBJ file loaded from the client.'
    );
  }

  private processOBJ(
    object: Object3D,
    name: string,
    colour: any,
    doubleSided: boolean,
    data?: string
  ) {
    object.name = name;
    object.userData = { info: data };
    this.setObjFlat(object, colour, doubleSided);
    this.scene.add(object);
    this.objects.push(object);
  }

  private setObjFlat(object3d, colour, doubleSided) {
    const material2 = new THREE.MeshPhongMaterial({
      color: colour,
      wireframe: false
    });
    material2.clippingPlanes = this.clipPlanes;
    material2.clipIntersection = true;
    material2.clipShadows = false;
    material2.wireframe = false;
    if (doubleSided) {
      material2.side = THREE.DoubleSide;
    }

    object3d.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.name = object3d.name;
        child.userData = object3d.userData;
        child.material = material2;
        // enable casting shadows
        child.castShadow = false;
        child.receiveShadow = false;
      } else {
        if (
          child instanceof LineSegments &&
          child.material instanceof LineBasicMaterial
        ) {
          child.material.color.set(colour);
        }
      }
    });
  }

  public objColor(name: string, value: any) {
    const object = this.scene.getObjectByName(name);
    object.traverse(child => {
      if (child instanceof THREE.Mesh || child instanceof LineSegments) {
        if (
          child.material instanceof MeshPhongMaterial ||
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
    const object = this.objects.find(o => o.name === name);
    if (object) {
      return object.position;
    }
  }

  public removeObject(name: string) {
    const object = this.scene.getObjectByName(name);
    this.scene.remove(object);
    const index = this.objects.findIndex(o => o === object);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
  }

  public scaleObject(name: string, value: any) {
    const object = this.scene.getObjectByName(name);
    object.scale.set(value, value, value);
  }

  public addEventDataTypeGroup(objectType: string): Group {
    const eventData = this.getEventData();
    const typeGroup = new Group();
    typeGroup.name = objectType;
    eventData.add(typeGroup);
    return typeGroup;
  }

  public collectionColor(collectionName: string, value: any) {
    const collection = this.scene.getObjectByName(collectionName);

    for (const child of Object.values(collection.children)) {
      child.traverse((object: THREE.Object3D) => {
        // For jets, tracks, caloclusters, muons and hits
        if (object instanceof Line || object instanceof Mesh || object instanceof Points) {
          if (
            object.material instanceof LineBasicMaterial ||
            object.material instanceof MeshBasicMaterial ||
            object.material instanceof PointsMaterial ||
            object.material instanceof MeshPhongMaterial
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

  groupVisibility(name: string, value: boolean) {
    const collection = this.scene.getObjectByName(name);
    for (const child of Object.values(collection.children)) {
      child.visible = value;
    }
  }

  fixOverlayView(value: boolean) {
    this.rendererManager.setFixOverlay(value);
  }
}
