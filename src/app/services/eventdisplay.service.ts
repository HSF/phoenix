import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {ThreeService} from './three.service';

@Injectable({
  providedIn: 'root'
})
export class EventdisplayService {

  constructor(private graphicsLibrary: ThreeService) {
  }

  init(): void {
    this.graphicsLibrary.init();
  }


  task1() {
    this.init();
    this.graphicsLibrary.loadOBJFile('../../assets/files/Pix.obj');
  }
}
