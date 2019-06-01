import {Component, OnInit} from '@angular/core';
import * as THREE from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

@Component({
  selector: 'app-task1',
  templateUrl: './task1.component.html',
  styleUrls: ['./task1.component.css']
})
export class Task1Component implements OnInit {

  constructor() {
  }

  ngOnInit() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('hsl(0, 0%, 100%)');

    // Arguments: FOV, aspect ratio, near and far distances
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.z = 200;

    // Main renderer for current browsers
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Orbit controls allow to move around
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    // Different lights to better see the object
    const keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(348, 49%, 71%)'), 1.0);
    keyLight.position.set(-100, 0, 100);

    const fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(212, 66%, 26%)'), 0.75);
    fillLight.position.set(100, 0, 100);

    const backLight = new THREE.DirectionalLight(0xffffff, 1.0);
    backLight.position.set(100, 0, -100).normalize();

    scene.add(keyLight);
    scene.add(fillLight);
    scene.add(backLight);

    // Array of objects we are going to pass to the RayCaster for intersecting
    var objects = [];

    // Loading .obj file
    var objLoader = new OBJLoader();
    objLoader.load('../../assets/files/Pix.obj', function(object) {

      scene.add(object);
      object.position.y -= 60;
      objects.push(object);

    });

    function rotateObject(rotatingObject) {
      rotatingObject.rotation.y += 0.005;
    }

// Animate loop
    var animate = function() {
      requestAnimationFrame(animate);
      controls.update();
      rotateObject(objects[0]);
      renderer.render(scene, camera);
    };

    animate();
  }

}
