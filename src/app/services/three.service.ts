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
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene, Vector3,
  WebGLRenderer
} from 'three';
import {Configuration} from './configuration';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';


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
  private objects;
  // EventData
  private eventDataCollections: Group;
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
    this.objects = {};
    this.eventDataCollections = null;
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
  }


  private saveString(text, filename) {
    this.save(new Blob([text], {type: 'text/plain'}), filename);
  }

  private save(blob, filename) {
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  /*********************************
   *      Public functions.        *
   *********************************/

  public exportScene() {
    // Instantiate a exporter
    const exporter = new GLTFExporter();

    // Parse the input and generate the glTF output
    exporter.parse(this.scene, (result) => {
      const output = JSON.stringify(result, null, 2);
      console.log(output);
      this.saveString(output, 'phoenix-scene.gltf');
    }, null);
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

  public objectVisibility(name: string, value: boolean) {
    if (this.objects[name]) {
      this.objects[name].visible = value;
    }
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

  /*********************************
   * Loading geometries functions. *
   *********************************/

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
      this.setObjFlat(object, colour, doubleSided);
      this.scene.add(object);
      this.objects[name] = object;
    });
  }

  public loadOBJFromContent(content: string, name: string) {
    const objLoader = new OBJLoader();
    const object = objLoader.parse(content);
    this.setObjFlat(object, 0x41a6f4, false);
    this.scene.add(object);
    this.objects[name] = object;
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
        child.material = material2;
        // enable casting shadows
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
  }


  public addCollection(collection: any, collname: string, addObject: (object: any, scene: any) => void) {
    if (this.eventDataCollections == null) {
      this.eventDataCollections = new Group();
      this.scene.add(this.eventDataCollections);
      this.objects['Event Data'] = this.eventDataCollections;
    }
    const collscene = new THREE.Group();
    collscene.name = collname;
    for (const objname of Object.keys(collection)) {
      const object = collection[objname];
      addObject(object, collscene);
    }
    this.eventDataCollections.add(collscene);
  }

  public addTrack(track: any, scene: any) {
    const length = 100;
    let colour = 0xff0000;
    if (track.color) {
      colour = parseInt(track.color, 16);
    }

    const positions = track.pos;
    // Now sort these.
    positions.sort((a, b) => {
      const distA = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
      const distB = b[0] * b[0] + b[1] * b[1] + b[2] * b[2];
      if (distA < distB) {
        return -1;
      }
      if (distA > distB) {
        return -1;
      }
      return 0;
    });
    const numPoints = positions.length;
    if (numPoints < 3) {
      console.log('Track with too few points[' + numPoints + ']. Skipping. Positions are: '
        + positions + ' particle_id: ' + track.particle_id);
      return;
    }

    // Apply pT cut TODO - make this configurable.
    if (track.hasOwnProperty('mom')) {
      const mom = track.mom;
      if (mom[0] * mom[0] + mom[1] * mom[1] + mom[2] * mom[2] < 0.25) {
        console.log('Track mom<0.5 GeV. Skipping. Positions are: ' + positions + ' particle_id: ' + track.particle_id);
        return;
      }
    }

    const points = [];

    for (let i = 0; i < numPoints; i++) {
      points.push(new THREE.Vector3(positions[i][0], positions[i][1], positions[i][2]));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const vertices = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    const material = new THREE.LineBasicMaterial({color: colour});
    const splineObject = new THREE.Line(geometry, material);

    scene.add(splineObject);
  }

  public addJet(jet: any, scene: any) {
    console.log(jet);

    const eta = jet.eta;
    const phi = jet.phi;
    const theta = 2 * Math.atan(Math.pow(Math.E, eta));
    const length = jet.energy * 0.2;
    const width = length * 0.1;

    const sphi = Math.sin(phi);
    const cphi = Math.cos(phi);
    const stheta = Math.sin(theta);
    const ctheta = Math.cos(theta);
    //
    const translation = new THREE.Vector3(0.5 * length * cphi * stheta, 0.5 * length * sphi * stheta, 0.5 * length * ctheta);

    const x = cphi * stheta;
    const y = sphi * stheta;
    const z = ctheta;
    const v1 = new THREE.Vector3(0, 1, 0);
    const v2 = new THREE.Vector3(x, y, z);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(v1, v2);

    const geometry = new THREE.CylinderGeometry(width, 1, length, 50, 50, false); // Cone

    const material = new THREE.MeshBasicMaterial({color: 0x2194CE, opacity: 0.3, transparent: true});
    material.opacity = 0.5;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(translation);
    mesh.quaternion.copy(quaternion);
    scene.add(mesh);
  }

  public collectionVisibility(collname: string, value: any) {
    const collection = this.eventDataCollections.getObjectByName(collname);
    if (collection != null) {
      collection.visible = value;
    }
  }

  public objColor(name: string, value: any) {
    const object = this.objects[name];
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material instanceof THREE.MeshPhongMaterial) {
          child.material.color.set(value);
        }
      }
    });
  }

  public collectionColor(collectionName: string, value: any) {
    const collection = this.eventDataCollections.getObjectByName(collectionName);
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

  public loadScene(scene: any) {
    const loader = new GLTFLoader();
    loader.parse(scene, '', (gltf) => {
      this.scene.add(gltf.scene);
    });
  }

  darkBackground(value: boolean) {
    let background = 0xffffff;
    if (value) {
      background = 0x1c1c1c;
    }
    this.scene.background = new THREE.Color(background);
  }

  getObjectPosition(name: string): Vector3 {
    const object = this.objects[name];
    if (object) {
      return object.position;
    }
  }

  setCameraPos(cameraPos: number[]) {
    return () => {
      new TWEEN.Tween(this.camera.position).to({
        x: cameraPos[0],
        y: cameraPos[1],
        z: cameraPos[2]
      }, 1000).start();
    };
  }

  setAnimationLoop(animate: () => void) {
    this.renderer.vr.enabled = true;
    this.renderer.setAnimationLoop(animate);
  }

  setVRButton() {
    // document.body.appendChild(WEBVR.createButton(this.renderer));
  }
}
