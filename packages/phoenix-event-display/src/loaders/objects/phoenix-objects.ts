import { Vector3, Object3D, CatmullRomCurve3, TubeBufferGeometry, MeshToonMaterial, Mesh, BufferGeometry, LineBasicMaterial, Line, Group, Quaternion, CylinderBufferGeometry, MeshBasicMaterial, BufferAttribute, PointsMaterial, Points, BoxBufferGeometry, MeshPhongMaterial, SphereBufferGeometry } from 'three';
import { RKHelper } from '../../helpers/rk-helper';

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
    let positions = trackParams.pos;
    // Track with no points
    // if (positions.length==0) {
    //   console.log("Track with no positions.")
    //   return;
    // }

    // Track with too few points are extrapolated with RungeKutta
    if (positions.length < 3) {
      if (trackParams?.dparams) {
        // Test, for ATLAS. 
        // FIXME - make configurable
        let inBounds = function (pos: Vector3) {
          if (pos.z > 3000)
            return false;
          if (Math.sqrt(pos.x * pos.x + pos.y * pos.y) > 1100)
            return false;

          return true
        };

        positions = RKHelper.extrapolateTrackPositions(trackParams, inBounds);
      }
    }
    // Check again, in case there was an issue with the extrapolation.
    if (positions.length < 3) {
      return;
    }


    // const length = 100;
    let objectColor = 0xff0000;
    if (trackParams.color) {
      objectColor = parseInt(trackParams.color, 16);
    }

    // // Apply pT cut TODO - make this configurable.
    // const momentum = trackParams.mom;
    // if (momentum) {
    //   if (momentum[0] * momentum[0] + momentum[1] * momentum[1] + momentum[2] * momentum[2] < 0.25) {
    //     // console.log('Track mom<0.5 GeV. Skipping. Positions are: ' + positions + ' particle_id: ' + track.particle_id);
    //     return;
    //   }
    // }

    const points = [];

    for (let i = 0; i < positions.length; i++) {
      points.push(new Vector3(positions[i][0], positions[i][1], positions[i][2]));
    }

    // attributes
    const curve = new CatmullRomCurve3(points);

    // TubeGeometry
    const geometry = new TubeBufferGeometry(curve, undefined, 2);
    const material = new MeshToonMaterial({ color: objectColor });
    const tubeObject = new Mesh(geometry, material);

    // Line - Creating a Line to put inside the tube to show tracks even on zoom out
    const vertices = curve.getPoints(50);
    const lineGeometry = new BufferGeometry().setFromPoints(vertices);
    const lineMaterial = new LineBasicMaterial({
      color: objectColor,
      linewidth: 2
    });
    const lineObject = new Line(lineGeometry, lineMaterial);
    lineObject.name = 'Track';

    // Creating a group to add both the Tube curve and the Line
    const trackObject = new Group();
    trackObject.add(tubeObject);
    trackObject.add(lineObject);

    // To make the output a bit cleaner, let's add some "prettyPrint" data
    let prettyPrint: object;
    if (trackParams?.dparams) {
      prettyPrint = {};
      prettyPrint['θ'] = trackParams.dparams[3];
      prettyPrint['ϕ'] = trackParams.dparams[2];
      prettyPrint['|p|'] = Math.abs(1 / trackParams.dparams[4]);
      if (trackParams?.pT) prettyPrint['pT'] = trackParams.pT;
      prettyPrint['q'] = Math.sign(1 / trackParams.dparams[4]);
      prettyPrint['d0'] = trackParams.dparams[0];
      prettyPrint['z0'] = trackParams.dparams[1];
      if (trackParams?.chi2) prettyPrint['𝛘2'] = trackParams.chi2;
      if (trackParams?.dof) prettyPrint['DOF'] = trackParams.dof;

    }

    // Setting info to the tubeObject and trackObject for selection and cuts
    for (let object of [tubeObject, trackObject]) {
      object.userData = trackParams;
      if (prettyPrint) {
        object.userData['prettyPrint'] = prettyPrint;
      }
      object.name = 'Track';
    }

    // Setting uuid for selection from collections info
    trackParams.uuid = tubeObject.uuid;

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
    const translation = new Vector3(0.5 * length * cphi * stheta, 0.5 * length * sphi * stheta, 0.5 * length * ctheta);

    const x = cphi * stheta;
    const y = sphi * stheta;
    const z = ctheta;
    const v1 = new Vector3(0, 1, 0);
    const v2 = new Vector3(x, y, z);
    const quaternion = new Quaternion();
    quaternion.setFromUnitVectors(v1, v2);

    const geometry = new CylinderBufferGeometry(width, 1, length, 50, 50, false); // Cone

    const material = new MeshBasicMaterial({ color: 0x2194CE, opacity: 0.3, transparent: true });
    material.opacity = 0.5;
    const mesh = new Mesh(geometry, material);
    mesh.position.copy(translation);
    mesh.quaternion.copy(quaternion);
    mesh.userData = jetParams;
    mesh.name = 'Jet';
    // Setting uuid for selection from collections info
    jetParams.uuid = mesh.uuid;

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
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(pointPos, 3));
    geometry.computeBoundingSphere();
    // material
    const material = new PointsMaterial({ size: 10 });
    material.color.set('#ff0000');
    // object
    const pointsObj = new Points(geometry, material);
    pointsObj.userData = hitsParamsClone;
    pointsObj.userData.uuid = pointsObj.uuid;
    pointsObj.name = 'Hit';
    // Setting uuid for selection from collections info
    hitsParams.uuid = pointsObj.uuid;

    return pointsObj;
  }

  /**
   * Process the CLuster from the given parameters and get it as a geometry.
   * @param clusterParams Parameters for the Cluster.
   * @returns Cluster object.
   */
  public static getCluster(clusterParams: any): Object3D {
    const maxR = 1100.0; // This needs to be configurable. 
    const maxZ = 3200.0;
    const length = clusterParams.energy * 0.003;
    // geometry
    const geometry = new BoxBufferGeometry(30, 30, length);
    // material
    const material = new MeshPhongMaterial({ color: 0xFFD166 });
    // object
    const cube = new Mesh(geometry, material);
    const theta = 2 * Math.atan(Math.pow(Math.E, clusterParams.eta));
    const pos = new Vector3(4000.0 * Math.cos(clusterParams.phi) * Math.sin(theta),
      4000.0 * Math.sin(clusterParams.phi) * Math.sin(theta),
      4000.0 * Math.cos(theta));
    cube.position.x = pos.x;
    cube.position.y = pos.y;
    if (pos.x * pos.x + pos.y * pos.y > maxR * maxR) {
      cube.position.x = maxR * Math.cos(clusterParams.phi);
      cube.position.y = maxR * Math.sin(clusterParams.phi);
    }
    cube.position.z = Math.max(Math.min(pos.z, maxZ), -maxZ); // keep in maxZ range.
    cube.lookAt(new Vector3(0, 0, 0));
    cube.userData = clusterParams;
    cube.name = 'Cluster';
    // Setting uuid for selection from collections info
    clusterParams.uuid = cube.uuid;

    return cube;
  }

  /**
   * Process the Vertex from the given parameters and get it as a geometry.
   * @param vertexParams Parameters for the Vertex.
   * @returns Vertex object.
   */
  public static getVertex(vertexParams: any): Object3D {
    // geometry
    const geometry = new SphereBufferGeometry(3);
    // material
    const material = new MeshPhongMaterial({ color: 0xFFD166 });
    // object
    const sphere = new Mesh(geometry, material);
    sphere.position.x = vertexParams.x;
    sphere.position.y = vertexParams.y;
    sphere.position.z = vertexParams.y;

    sphere.userData = vertexParams;
    sphere.name = 'Vertex';
    // Setting uuid for selection from collections info
    vertexParams.uuid = sphere.uuid;

    return sphere;
  }

}
