import {EventDataLoader} from './event-data-loader';
import {Scene} from 'three';
import * as THREE from 'three';

export class AtlasLoader implements EventDataLoader {
  addTrack(track: any, scene: Scene) {
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
    const geometry = new THREE.Geometry().setFromPoints(vertices);
    const material = new THREE.LineBasicMaterial({color: colour});
    material.linewidth = 2;
    const splineObject = new THREE.Line(geometry, material);
    splineObject.userData = track;
    splineObject.name = 'Track';
    scene.add(splineObject);
  }

  addJet(jet: any, scene: Scene) {
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
    mesh.userData = jet;
    mesh.name = 'Jet';
    scene.add(mesh);
  }

}
