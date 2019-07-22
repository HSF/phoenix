import {EventDataLoader} from './event-data-loader';
import {Scene} from 'three';
import * as THREE from 'three';
import {UIService} from '../ui.service';
import {ThreeService} from '../three.service';

export class PhoenixLoader implements EventDataLoader {
  private graphicsLibrary: ThreeService;
  private ui: UIService;
  private eventData: any;

  public buildEventData(eventData: any, graphicsLibrary: ThreeService, ui: UIService): void {
    this.graphicsLibrary = graphicsLibrary;
    this.ui = ui;
    this.eventData = eventData;
    // Creating UI folder
    this.ui.addEventDataFolder();
    // Clearing existing event data
    this.graphicsLibrary.clearEventData();
    if (eventData.Tracks) {
      this.addEventCollections(eventData.Tracks, this.addTrack, 'Tracks');
    }
    if (eventData.Jets) {
      this.addEventCollections(eventData.Jets, this.addJet, 'Jets');
    }
    if (eventData.Hits) {
      this.addEventCollections(eventData.Hits, this.addHits, 'Hits');
    }
  }

  private addEventCollections(collections: any, addObject: any, objectType: string) {
    const typeFolder = this.ui.addEventDataTypeFolder(objectType);
    const typeGroup = this.graphicsLibrary.addEventDataTypeGroup(objectType);
    for (const collname of Object.keys(collections)) {
      const collection = collections[collname];
      if (collection != null) {
        this.graphicsLibrary.addCollection(collection, collname, addObject, typeGroup);
        this.ui.addCollection(typeFolder, collname);
      }
    }
  }

  protected addTrack(track: any, scene: Scene) {
    // Track with no points
    if (!track.pos) {
      return;
    }

    const length = 100;
    let colour = 0xff0000;
    if (track.color) {
      colour = parseInt(track.color, 16);
    }

    const positions = track.pos;
    const numPoints = positions.length;
    if (numPoints < 3) {
      // Track with too few points
      return;
    }
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

    // Apply pT cut TODO - make this configurable.
    if (track.hasOwnProperty('mom')) {
      const mom = track.mom;
      if (mom[0] * mom[0] + mom[1] * mom[1] + mom[2] * mom[2] < 0.25) {
        // console.log('Track mom<0.5 GeV. Skipping. Positions are: ' + positions + ' particle_id: ' + track.particle_id);
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
    material.linewidth = 2;
    const splineObject = new THREE.Line(geometry, material);
    splineObject.userData = track;
    splineObject.name = 'Track';
    scene.add(splineObject);
  }

  protected addJet(jet: any, scene: Scene) {
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
    mesh.userData = jet;
    mesh.name = 'Jet';
    scene.add(mesh);
  }

  protected addHits(hits: any, scene: Scene) {
    const pointPos = new Float32Array(hits.length * 3);
    let i = 0;
    for (const hit of hits) {
      pointPos[i] = hit[0];
      pointPos[i + 1] = hit[1];
      pointPos[i + 2] = hit[2];
      i += 3;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(pointPos, 3));
    geometry.computeBoundingSphere();
    const material = new THREE.PointsMaterial({size: 10});
    material.color.set('#ff0000');
    const pointsObj = new THREE.Points(geometry, material);
    scene.add(pointsObj);
  }


}
