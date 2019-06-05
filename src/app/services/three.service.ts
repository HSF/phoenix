import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {PerspectiveCamera, Scene, WebGLRenderer} from 'three';

@Injectable({
  providedIn: 'root'
})
export class ThreeService {

  // Variables
  private scene: Scene;
  private controls: OrbitControls;
  private renderer: WebGLRenderer;
  private camera: PerspectiveCamera;
  // Array of objects we are going to pass to the RayCaster for intersecting
  objects = [];

  constructor() {
  }

  init() {
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
  }

  setLights() {
    const keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(348, 49%, 71%)'), 1.0);
    keyLight.position.set(-100, 0, 100);
    const fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(212, 66%, 26%)'), 0.75);
    fillLight.position.set(100, 0, 100);
    const backLight = new THREE.DirectionalLight(0xffffff, 1.0);
    backLight.position.set(100, 0, -100).normalize();
    this.scene.add(keyLight);
    this.scene.add(fillLight);
    this.scene.add(backLight);
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
  loadOBJFile(filename: string): void {
    const objLoader = new OBJLoader();
    objLoader.load(filename, (object) => {
      this.scene.add(object);
      object.position.y -= 60;
      this.objects.push(object);
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
}
