import * as THREE from 'three';
import { Object3D } from 'three';

/**
 * Physics objects that make up an event in Phoenix.
 */
export class PhoenixObjects {

  /**
   * Process the Track from the given parameters (and positions)
   * and get it as a geometry.
   * @param trackParams Parameters of the Track.
   * @returns Track object.
   */
  public static getTrack(trackParams: any): Object3D {
    const positions = trackParams.pos;
    // Track with no points
    if (!positions) {
      return;
    }

    const numPoints = positions.length;
    // Track with too few points
    if (numPoints < 3) {
      return;
    }

    // const length = 100;
    let objectColor = 0xff0000;
    if (trackParams.color) {
      objectColor = parseInt(trackParams.color, 16);
    }

    // Apply pT cut TODO - make this configurable.
    const momentum = trackParams.mom;
    if (momentum) {
      if (momentum[0] * momentum[0] + momentum[1] * momentum[1] + momentum[2] * momentum[2] < 0.25) {
        // console.log('Track mom<0.5 GeV. Skipping. Positions are: ' + positions + ' particle_id: ' + track.particle_id);
        return;
      }
    }

    const points = [];

    for (let i = 0; i < numPoints; i++) {
      points.push(new THREE.Vector3(positions[i][0], positions[i][1], positions[i][2]));
    }

    // attributes
    const curve = new THREE.CatmullRomCurve3(points);

    // TubeGeometry
    const geometry = new THREE.TubeBufferGeometry(curve, undefined, 2);
    const material = new THREE.MeshToonMaterial({ color: objectColor });
    const tubeObject = new THREE.Mesh(geometry, material);
    // Setting info to the tubeObject since it will be used for selection
    tubeObject.userData = trackParams;
    tubeObject.userData.uuid = tubeObject.uuid;
    tubeObject.name = 'Track';

    // Line - Creating a Line to put inside the tube to show tracks even on zoom out
    const vertices = curve.getPoints(50);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(vertices);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: objectColor,
      linewidth: 2
    });
    const lineObject = new THREE.Line(lineGeometry, lineMaterial);
    lineObject.name = 'Track';

    // Creating a group to add both the Tube curve and the Line
    const trackObject = new THREE.Object3D();
    trackObject.add(tubeObject);
    trackObject.add(lineObject);

    return trackObject;
  }

  /**
   * Process the Jet from the given parameters and get it as a geometry.
   * @param jetParams Parameters for the Jet.
   * @returns Jet object.
   */
  public static getJet(jetParams: any): Object3D {
    const eta = jetParams.eta;
    const phi = jetParams.phi;
    // If theta is given then use that else calculate from eta
    const theta = jetParams.theta ? jetParams.theta : (2 * Math.atan(Math.pow(Math.E, eta)));
    // Jet energy parameter can either be 'energy' or 'et'
    let length = (jetParams.energy ? jetParams.energy : jetParams.et) * 0.2;
    // Ugh - We don't want the Jets to go out of the event display
    if (length > 3000) {
      length = 3000;
    }
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

    const geometry = new THREE.CylinderBufferGeometry(width, 1, length, 50, 50, false); // Cone

    const material = new THREE.MeshBasicMaterial({ color: 0x2194CE, opacity: 0.3, transparent: true });
    material.opacity = 0.5;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(translation);
    mesh.quaternion.copy(quaternion);
    mesh.userData = jetParams;
    mesh.userData.uuid = mesh.uuid;
    mesh.name = 'Jet';

    return mesh;
  }

  /**
   * Process the Hits from the given parameters and get them as a geometry.
   * @param hitsParams Parameters for the Hits.
   * @returns Hits object.
   */
  public static getHits(hitsParams: any): Object3D {
    let positions: any[];
    let hitsParamsClone: any;

    // If the parameters is an object then take out 'pos' for hits positions
    if (typeof hitsParams === 'object' && !Array.isArray(hitsParams)) {
      positions = [hitsParams.pos];
      hitsParamsClone = hitsParams;
    } else {
      positions = hitsParams;
      hitsParamsClone = { pos: hitsParams };
    }

    // attributes
    const pointPos = new Float32Array(positions.length * 3);
    let i = 0;
    for (const hit of positions) {
      pointPos[i] = hit[0];
      pointPos[i + 1] = hit[1];
      pointPos[i + 2] = hit[2];
      i += 3;
    }

    // geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pointPos, 3));
    geometry.computeBoundingSphere();
    // material
    const material = new THREE.PointsMaterial({ size: 10 });
    material.color.set('#ff0000');
    // object
    const pointsObj = new THREE.Points(geometry, material);
    pointsObj.userData = hitsParamsClone;
    pointsObj.userData.uuid = pointsObj.uuid;
    hitsParams.uuid = pointsObj.uuid;
    pointsObj.name = 'Hit';

    return pointsObj;
  }

  /**
   * Process the CLuster from the given parameters and get it as a geometry.
   * @param clusterParams Parameters for the Cluster.
   * @returns Cluster object.
   */
  public static getCluster(clusterParams: any): Object3D {
    const maxR = 1100.0;
    const maxZ = 3200.0;
    const length = clusterParams.energy * 0.003;
    // geometry
    const geometry = new THREE.BoxBufferGeometry(30, 30, length);
    // material
    const material = new THREE.MeshPhongMaterial({ color: 0xFFD166 });
    // object
    const cube = new THREE.Mesh(geometry, material);
    const theta = 2 * Math.atan(Math.pow(Math.E, clusterParams.eta));
    const pos = new THREE.Vector3(4000.0 * Math.cos(clusterParams.phi) * Math.sin(theta),
      4000.0 * Math.sin(clusterParams.phi) * Math.sin(theta),
      4000.0 * Math.cos(theta));
    cube.position.x = pos.x;
    cube.position.y = pos.y;
    if (pos.x * pos.x + pos.y * pos.y > maxR * maxR) {
      cube.position.x = maxR * Math.cos(clusterParams.phi);
      cube.position.y = maxR * Math.sin(clusterParams.phi);
    }
    cube.position.z = Math.max(Math.min(pos.z, maxZ), -maxZ); // keep in maxZ range.
    cube.lookAt(new THREE.Vector3(0, 0, 0));
    cube.userData = clusterParams;
    cube.userData.uuid = cube.uuid;
    cube.name = 'Cluster';

    return cube;
  }

}
