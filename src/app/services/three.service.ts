import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {AxesHelper, EdgesGeometry, LineBasicMaterial, LineSegments, PerspectiveCamera, Scene, WebGLRenderer} from 'three';
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
  objects = {};
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

  init(configuration: Configuration) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('hsl(0, 0%, 100%)');

    // Arguments: FOV, aspect ratio, near and far distances
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
    this.camera.position.z = 200;

    // Main renderer for current browsers
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.className = 'ui-element';
    document.body.appendChild(this.renderer.domElement);

    // Orbit controls allow to move around
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.enableZoom = true;
    this.controls.autoRotate = false;

    // Different lights to better see the object
    this.setLights();
    // Customizing with configuration
    this.setConfiguration(configuration);
  }

  setLights() {
    const ambientLight = new THREE.AmbientLight( 0x404040 );
    const directionalLight1 = new THREE.DirectionalLight( 0xC0C090 );
    const directionalLight2 = new THREE.DirectionalLight( 0xC0C090 );

    directionalLight1.position.set( -100, -50, 100 );
    directionalLight2.position.set( 100, 50, -100 );

    this.scene.add( directionalLight1 );
    this.scene.add( directionalLight2 );
    this.scene.add( ambientLight );
  }

  setConfiguration(configuration: Configuration) {
    if (configuration.allowShowAxes) {
      this.setAxis(configuration.allowShowAxes);
    }
  }

  setAxis(value: boolean) {
    if (this.axis == null) {
      this.axis = new THREE.AxesHelper(2000);
      this.scene.add(this.axis);
    }
    this.axis.visible = value;
  }

  clearCanvas() {
    const elements = document.body.getElementsByClassName('ui-element');
    const elementsSize = elements.length;
    for (let i = 0; i < elementsSize; i++) {
      if (elements.item(0) != null) {
        elements.item(0).remove();
      }
    }
  }

  // Move to a loader Service
  loadOBJFile(filename: string, name: string, colour, doubleSided: boolean): void {
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

  autoRotate(value) {
    this.controls.autoRotate = value;
  }

  updateControls() {
    this.controls.update();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  objectVisibility(name: string, value: boolean) {
    this.objects[name].visible = value;
  }

  setClipping(value: boolean) {
    this.renderer.localClippingEnabled = value;
  }

  getXClipPlane() {
    return this.clipPlanes[0];
  }

  getYClipPlane() {
    return this.clipPlanes[1];
  }

  getZClipPlane() {
    return this.clipPlanes[2];
  }

  buildGeometryFromParameters(parameters) {
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

}
