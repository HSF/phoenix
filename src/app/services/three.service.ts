import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {AxesHelper, EdgesGeometry, Group, LineBasicMaterial, LineSegments, PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import {Configuration} from './configuration';

@Injectable({
  providedIn: 'root'
})
export class ThreeService {

  // Threejs Variables
  private scene: Scene;
  private controls: OrbitControls;
  private renderer: WebGLRenderer;
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
   * Initialization functions.
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

    // Orbit controls allow to move around
    this.setControls();
    // Different lights to better see the object
    this.setLights();
    // Customizing with configuration
    this.setConfiguration(configuration);
  }

  public updateControls() {
    this.controls.update();
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Private auxiliary functions.
   */
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

  private setControls() {
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

  /**
   * Public functions.
   */
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

  /**
   * Loading functions.
   */
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

  // Move to a loader Service
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


  public addCollection(collection: any, collname: string, addObject: any) {
    if (this.eventDataCollections == null) {
      this.eventDataCollections = new Group();
      this.scene.add(this.eventDataCollections);
    }
    const collscene = new THREE.Group();
    for (const objname of Object.keys(collection)) {
      const object = collection[objname];
      addObject(object, collscene);
    }
    collscene.name = collname;
    this.eventDataCollections.add(collscene);
    this.objects['Event Data'] = this.eventDataCollections;
  }

  public addTrack(track: any, scene: any) {
    const length = 100;
    const colour = 0xff0000;

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
    const geometry = new THREE.Geometry();
    geometry.vertices = curve.getPoints(50);
    const material = new THREE.LineBasicMaterial({color: colour});
    const splineObject = new THREE.Line(geometry, material);

    scene.add(splineObject);
  }


  public collectionVisibility(collname: string, value: any) {
    const collection = this.eventDataCollections.getObjectByName(collname);
    if (collection != null) {
      collection.visible = value;
    }
  }


  objectColor(name: string, value: any) {
    const object = this.objects[name];
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material instanceof THREE.MeshPhongMaterial) {
          child.material.color.set(value);
        }
      }
    });
  }
}
