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
  WebGLRenderer
} from 'three';
import {Configuration} from './configuration';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {WebVR} from './web-vr';


@Injectable({
  providedIn: 'root'
})
export class ThreeService {

  // Threejs Variables
  private scene: Scene;
  private controls: OrbitControls;
  renderer: WebGLRenderer;
  private camera: PerspectiveCamera;
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
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
    this.camera.position.z = 200;

    // Main renderer for current browsers
    this.setRenderer();

    // Object Collections
    this.objects = [];
    // Axis
    this.axis = null;

    // Orbit controls allow to move around
    this.setOrbitControls();
    // Different lights to better see the object
    this.setLights();
    // Customizing with configuration
    this.setConfiguration(configuration);
  }

  public updateControls() {
    this.controls.update();
    TWEEN.update();
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  /*********************************
   * Private auxiliary functions.  *
   *********************************/

  private setRenderer() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.domElement.className = 'ui-element';
    this.renderer.domElement.id = 'three-canvas';
    let canvas = document.getElementById('eventDisplay');
    if (canvas == null) {
      canvas = document.body;
    }
    canvas.appendChild(this.renderer.domElement);
  }

  private setOrbitControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.enableZoom = true;
    this.controls.autoRotate = false;
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

  /*********************************
   *      Public functions.        *
   *********************************/

  public exportScene() {
    // Instantiate a exporter
    const exporter = new GLTFExporter();

    const sceneConfig = {eventData: {}, geometries: {}};

    this.saveEventDataConfiguration(sceneConfig.eventData);
    // this.saveGeometriesConfiguration();

    // Parse the input and generate the glTF output
    exporter.parse(this.scene, (result) => {
      const jsonResult = {sceneConfiguration: sceneConfig, scene: result};
      const output = JSON.stringify(jsonResult, null, 2);
      this.saveString(output, 'phoenix-scene.gltf');
    }, null);
  }

  public loadScene(scene: any) {
    const loader = new GLTFLoader();
    const sceneString = JSON.stringify(scene, null, 2);
    // @ts-ignore
    loader.parse(sceneString, '', (gltf) => {
      this.scene = gltf.scene;
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
    this.controls.autoRotate = value;
  }

  public setClipping(value: boolean) {
    this.renderer.localClippingEnabled = value;
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
      this.renderer.setSize(window.innerWidth / 2, window.innerHeight / 2, false);
    } else {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
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
      new TWEEN.Tween(this.camera.position).to({
        x: cameraPos[0],
        y: cameraPos[1],
        z: cameraPos[2]
      }, 1000).start();
    };
  }

  private enableSelecting() {
    if (document.getElementById('three-canvas')) {
      document.getElementById('three-canvas').addEventListener('mousedown', this.onDocumentMouseDown.bind(this));
    }
  }

  public setAnimationLoop(animate: () => void) {
    this.renderer.vr.enabled = true;
    this.renderer.setAnimationLoop(animate);
  }

  public setVRButton() {
    const webVR = new WebVR();
    let canvas = document.getElementById('eventDisplay');
    if (canvas == null) {
      canvas = document.body;
    }
    canvas.appendChild(webVR.createButton(this.renderer, null));
  }

  public onDocumentMouseDown(event, selectedObject: any) {
    event.preventDefault();
    const mouse = new THREE.Vector2((event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.linePrecision = 20;
    raycaster.setFromCamera(mouse, this.camera);

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
      console.log(elZ);
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

  public addCollection(collection: any, collname: string, addObject: (object: any, scene: any) => void, typeGroup: Group) {
    const collscene = new THREE.Group();
    collscene.name = collname;
    for (const object of collection) {
      addObject(object, collscene);
    }
    typeGroup.add(collscene);
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


}
