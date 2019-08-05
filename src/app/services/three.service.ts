import {Injectable} from '@angular/core';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {
  AxesHelper,
  EdgesGeometry,
  Group, Line,
  LineBasicMaterial,
  LineSegments, Mesh,
  MeshBasicMaterial, Object3D,
  PerspectiveCamera,
  Scene, Vector3,
  WebGLRenderer,
  OrthographicCamera,
  WebGLRendererParameters,
} from 'three';
import {Configuration} from './loaders/configuration.model';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {WebVR} from './extras/web-vr';
import {ControlsManager} from './extras/controls-manager';
import {RendererManager} from './extras/renderer-manager';
import {OBJExporter} from 'three/examples/jsm/exporters/OBJExporter';
import {Cut} from './extras/cut.model';


@Injectable({
  providedIn: 'root'
})
export class ThreeService {

  // Threejs Variables
  private scene: Scene;
  private sceneColor: THREE.Color | THREE.Texture;
  private perspectiveControls: OrbitControls;
  private orthographicControls: OrbitControls;
  private perspectiveCamera: PerspectiveCamera;
  private orthographicCamera: OrthographicCamera;
  // Managers
  private rendererManager: RendererManager;
  private controlsManager: ControlsManager;
  // Array of objects we are going to pass to the RayCaster for intersecting
  private objects: Object3D[];
  // Clipping planes
  private clipPlanes = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)
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
    this.perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
    // Arguments: left, right, top, bottom, near and far distances
    this.orthographicCamera = new THREE.OrthographicCamera(
      -window.innerWidth / 2, window.innerWidth / 2,
      window.innerHeight / 2, -window.innerHeight / 2, 0.1, 100000);
    this.perspectiveCamera.position.z = this.orthographicCamera.position.z = 200;

    // Renderer manager
    this.rendererManager = new RendererManager();
    // Main renderer for current browsers
    this.setRenderer();
    // Overlay renderer
    this.setOverlayRenderer();

    // Orbit controls allow to move around
    this.perspectiveControls = this.setOrbitControls(this.perspectiveCamera, this.rendererManager.mainRenderer.domElement);
    this.orthographicControls = this.setOrbitControls(this.orthographicCamera, this.rendererManager.mainRenderer.domElement);
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
      (function(scope) {
        let controlsManager = scope.controlsManager;

        return function() {
          controlsManager.transformSync();
          controlsManager.updateSync();
        };
      })(this)
    );

    // Object Collections
    this.objects = [];
    // Axis
    this.axis = null;

    // Different lights to better see the object
    this.setLights();
    // Customizing with configuration
    this.setConfiguration(configuration);
  }

  public updateControls() {
    this.controlsManager.activeControls.update();
    this.controlsManager.updateSync();
    TWEEN.update();
  }

  public render() {
    this.rendererManager.mainRenderer.render(this.scene, this.controlsManager.mainCamera);

    if (!this.rendererManager.overlayRenderer.domElement.hidden) {
      this.sceneColor = this.scene.background;
      this.scene.background = null;

      this.rendererManager.overlayRenderer.render(this.scene, this.controlsManager.overlayCamera);

      this.scene.background = this.sceneColor;
    }
  }

  /*********************************
   * Private auxiliary functions.  *
   *********************************/

  private setRenderer() {
    let renderer: WebGLRenderer = new THREE.WebGLRenderer();

    this.rendererManager.addRenderer(renderer);
    this.rendererManager.mainRenderer = renderer;
    this.rendererManager.mainRenderer.setSize(window.innerWidth, window.innerHeight, false);
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
   * @returns {void}
   * @private
   */
  private setOverlayRenderer(): void {
    let overlayCanvas: HTMLCanvasElement = this.initializeOverlayCanvas('overlay-canvas', window.innerWidth / 2.5, window.innerHeight / 2.5);
    let overlayRenderer: WebGLRenderer = this.intializeOverlayRenderer(overlayCanvas);

    this.rendererManager.addRenderer(overlayRenderer);
    this.rendererManager.overlayRenderer = overlayRenderer;

    let canvas = document.getElementById('eventDisplay');
    canvas.appendChild(this.rendererManager.overlayRenderer.domElement);
  }

  /**
   * Initializes overlay HTML canvas element.
   * @param {string} ID ID of the canvas element.
   * @param {number} width Desired width of the canvas element.
   * @param {number} height Desired height of the canvas element.
   * @returns {HTMLCanvasElement}
   * @private
   */
  private initializeOverlayCanvas(ID: string, width: number, height: number): HTMLCanvasElement {
    let canvas: HTMLCanvasElement = this.initializeCanvas(ID, width, height);
    canvas.style.width = width.toString() + 'px';
    canvas.style.height = height.toString() + 'px';
    canvas.style.position = 'absolute';
    canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    canvas.style.left = (window.innerWidth - width - 100) + 'px';
    canvas.style.top = 100 + 'px';
    canvas.style.border = '1px solid #ccc';
    canvas.style.borderRadius = '8px';
    //canvas.style.pointerEvents = "none";

    // Add listener 
    let offset: { x: number, y: number } = {x: 0, y: 0};
    let mouseDown: boolean = false;

    canvas.addEventListener('mousedown', function(event) {
      mouseDown = true;
      offset.x = event.clientX - canvas.offsetLeft;
      offset.y = event.clientY - canvas.offsetTop;
    }, true);

    document.addEventListener('mouseup', function() {
      mouseDown = false;
    }, true);

    document.addEventListener('mousemove', function(event) {
      event.preventDefault();
      if (mouseDown) {

        canvas.style.left = (event.clientX - offset.x) + 'px';
        canvas.style.top = (event.clientY - offset.y) + 'px';
      }
    }, true);

    return canvas;
  }

  /**
   * Initializes overlay renderer.
   * @param {WebGLRendererParameters} overlayCanvas Canvas element for the renderer.
   * @returns {WebGLRenderer}
   * @private
   */
  private intializeOverlayRenderer(overlayCanvas: HTMLCanvasElement): WebGLRenderer {
    let parameters: WebGLRendererParameters = {canvas: overlayCanvas, antialias: false, alpha: true};

    return this.initializeRenderer(parameters);
  }

  /**
   * Initializes HTML canvas element.
   * @param {string} ID ID of the canvas element.
   * @param {number} width Desired width of the canvas element.
   * @param {number} height Desired height of the canvas element.
   * @returns {HTMLCanvasElement}
   * @private
   */
  private initializeCanvas(ID: string, width: number = window.innerWidth, height: number = window.innerHeight): HTMLCanvasElement {
    let canvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
    canvas.id = ID;
    canvas.width = width;
    canvas.height = height;

    return canvas;
  }

  /**
   * Initializes WebGL Renderer.
   * @param {WebGLRendererParameters} [parameters] Optional parameters for the renderer.
   * @returns {WebGLRenderer}
   * @private
   */
  private initializeRenderer(parameters?: WebGLRendererParameters): WebGLRenderer {
    let renderer: WebGLRenderer = new THREE.WebGLRenderer(parameters);
    //renderer.setSize(canvas.width, canvas.height);
    //renderer.domElement.style.cssText = canvas.style.cssText;

    return renderer;
  }

  private setOrbitControls(camera: PerspectiveCamera | OrthographicCamera, domElement?: HTMLElement): OrbitControls {
    const controls: OrbitControls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.autoRotate = false;

    return controls;
  }

  private setLights() {
    const ambientLight = new THREE.AmbientLight(0x404040);
    const directionalLight1 = new THREE.DirectionalLight(0xBFBFBF);
    const directionalLight2 = new THREE.DirectionalLight(0xBFBFBF);

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
    this.save(new Blob([text], {type: 'text/plain'}), filename);
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

    const sceneConfig = {eventData: {}, geometries: []};

    this.saveEventDataConfiguration(sceneConfig.eventData);
    this.saveGeometriesConfiguration(sceneConfig.geometries);

    // Parse the input and generate the glTF output
    const result = exporter.parse(this.scene);
    this.saveString(result, 'phoenix-obj.obj');
  }

  public exportPhoenixScene() {
    // Instantiate a exporter
    const exporter = new GLTFExporter();

    const sceneConfig = {eventData: {}, geometries: []};

    this.saveEventDataConfiguration(sceneConfig.eventData);
    this.saveGeometriesConfiguration(sceneConfig.geometries);

    // Parse the input and generate the glTF output
    exporter.parse(this.scene, (result) => {
      const jsonResult = {sceneConfiguration: sceneConfig, scene: result};
      const output = JSON.stringify(jsonResult, null, 2);
      this.saveString(output, 'phoenix-scene.phnx');
    }, null);
  }

  public loadScene(scene: any) {
    const loader = new GLTFLoader();
    const sceneString = JSON.stringify(scene, null, 2);
    // @ts-ignore
    loader.parse(sceneString, '', (gltf) => {
      this.scene = gltf.scene;
      this.setLights();
      this.darkBackground(false);
    });
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
      this.rendererManager.mainRenderer.setSize(window.innerWidth / 2, window.innerHeight / 2, false);
    } else {
      this.rendererManager.mainRenderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  public darkBackground(value: boolean) {
    let background = 0xffffff;
    if (value) {
      background = 0x0;
    }
    this.scene.background = new THREE.Color(background);
  }

  public setCameraPos(cameraPos: number[]) {
    return () => {
      new TWEEN.Tween(this.controlsManager.activeCamera.position).to({
        x: cameraPos[0],
        y: cameraPos[1],
        z: cameraPos[2]
      }, 1000).start();
    };
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
        console.log('Error : ¡ Invalid camera align parameter (use x, y or z)!');
      }
    }
  }

  /**
   * Aligns a camera (and move its orbit target) with a vector.
   * @param targetlookAtVector Vector to align camera to.
   */
  private alignCameraWithVector(targetlookAtVector: THREE.Vector3): void {
    const activeLookAtVector = new THREE.Vector3(0, 0, -1);
    activeLookAtVector.applyQuaternion(this.controlsManager.mainCamera.quaternion);

    const orbitTargetVector = new THREE.Vector3();
    orbitTargetVector.subVectors(this.controlsManager.mainControls.target, this.controlsManager.mainCamera.position);

    const direction = orbitTargetVector.dot(targetlookAtVector);
    targetlookAtVector.normalize().multiplyScalar(orbitTargetVector.length());
    if (direction < 0) {
      targetlookAtVector.multiplyScalar(-1);
    }

    const newLookAtPoint = targetlookAtVector.add(this.controlsManager.mainCamera.position);
    this.controlsManager.mainControls.target = newLookAtPoint;

    this.updateControls();
  }

  private enableSelecting() {
    if (document.getElementById('three-canvas')) {
      document.getElementById('three-canvas').addEventListener('mousedown', this.onDocumentMouseDown.bind(this));
    }
  }

  public setAnimationLoop(animate: () => void) {
    this.rendererManager.mainRenderer.vr.enabled = true;
    this.rendererManager.mainRenderer.setAnimationLoop(animate);
  }

  public setVRButton() {
    const webVR = new WebVR();
    let canvas = document.getElementById('eventDisplay');
    if (canvas == null) {
      canvas = document.body;
    }
    canvas.appendChild(webVR.createButton(this.rendererManager.mainRenderer, null));
  }

  public onDocumentMouseDown(event, selectedObject: any) {
    event.preventDefault();
    const mouse = new THREE.Vector2((event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.linePrecision = 20;
    raycaster.setFromCamera(mouse, this.controlsManager.mainCamera);

    // @ts-ignore
    const intersects = raycaster.intersectObjects(this.objects, true);

    if (intersects.length > 0) {
      // We want the closest one
      selectedObject.name = intersects[0].object.name;
      selectedObject.attributes.splice(0, selectedObject.attributes.length);

      for (const key of Object.keys(intersects[0].object.userData)) {
        selectedObject.attributes.push({attributeName: key, attributeValue: intersects[0].object.userData[key]});
      }
    }
  }

  /**
   * Sets visibility of an overlay.
   * @param value Boolean value whether to show and render overlay or not.
   * @returns {void}
   * @public
   */
  public renderOverlay(value: boolean): void {
    this.rendererManager.overlayRenderer.domElement.hidden = !value;
  }

  /**************************************
   * Functions for loading geometries . *
   **************************************/

  public buildGeometryFromParameters(parameters) {
    // Make the geometry and material
    const geometry = new THREE.BoxGeometry(parameters.xDim, parameters.yDim, parameters.zDim);
    const material = new THREE.MeshBasicMaterial({color: parameters.colour, opacity: 0.5, transparent: true});

    const zstep = (parameters.maxZ - parameters.minZ) / parameters.numZEl;
    const phistep = 2.0 * Math.PI / parameters.numPhiEl;

    let z = parameters.minZ + zstep / 2.0;

    const halfPi = Math.PI / 2.0;
    let modulecentre;
    const ztiltAngle = 0;
    for (let elZ = 0; elZ < parameters.numZEl; elZ++) {
      // console.log(elZ);
      let phi = parameters.phiOffset;
      for (let elPhi = 0; elPhi < parameters.numPhiEl; elPhi++) {
        phi += phistep;
        modulecentre = new THREE.Vector3(parameters.radius * Math.cos(phi), parameters.radius * Math.sin(phi), z);
        const cube = new THREE.Mesh(geometry.clone(), material);

        cube.matrix.makeRotationFromEuler(new THREE.Euler(ztiltAngle, 0.0, halfPi + phi + parameters.tiltAngle));
        cube.matrix.setPosition(modulecentre);
        cube.matrixAutoUpdate = false;
        this.scene.add(cube);

        const egh = new LineSegments(new EdgesGeometry(cube.geometry), new LineBasicMaterial({color: parameters.colour}));
        // @ts-ignore
        egh.material.linewidth = 2;
        this.scene.add(egh);
      }
      z += zstep;
    }
  }

  public loadOBJFile(filename: string, name: string, colour, doubleSided: boolean): void {
    if (colour == null) {
      colour = 0x41a6f4;
    }
    const objLoader = new OBJLoader();
    objLoader.load(filename, (object) => {
      this.processOBJ(object, name, colour, doubleSided, 'OBJ file');
    });
  }

  public loadOBJFromContent(content: string, name: string) {
    const objLoader = new OBJLoader();
    const object = objLoader.parse(content);
    this.processOBJ(object, name, 0x41a6f4, false, 'OBJ file loaded from the client.');
  }

  private processOBJ(object: Object3D, name: string, colour: any, doubleSided: boolean, data?: string) {
    object.name = name;
    object.userData = {info: data};
    this.setObjFlat(object, colour, doubleSided);
    this.scene.add(object);
    this.objects.push(object);
  }

  private setObjFlat(object3d, colour, doubleSided) {
    const material2 = new THREE.MeshPhongMaterial({color: colour, wireframe: false});
    material2.clippingPlanes = this.clipPlanes;
    material2.clipIntersection = true;
    material2.clipShadows = false;
    material2.wireframe = false;
    if (doubleSided) {
      material2.side = THREE.DoubleSide;
    }

    object3d.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.name = object3d.name;
        child.userData = object3d.userData;
        child.material = material2;
        // enable casting shadows
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
  }

  public objColor(name: string, value: any) {
    const object = this.scene.getObjectByName(name);
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material instanceof THREE.MeshPhongMaterial) {
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
      let color;
      // For jets and tracks
      if (child instanceof Line || child instanceof Mesh) {
        if (child.material instanceof LineBasicMaterial || child.material instanceof MeshBasicMaterial) {
          color = child.material.color;
        }
      }
      color.set(value);
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

}
