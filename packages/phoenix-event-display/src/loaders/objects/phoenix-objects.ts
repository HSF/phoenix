import { Vector3, Object3D, CatmullRomCurve3, TubeBufferGeometry, MeshToonMaterial, Mesh, BufferGeometry, LineBasicMaterial, Line, Group, Quaternion, CylinderBufferGeometry, MeshBasicMaterial, BufferAttribute, PointsMaterial, Points, BoxBufferGeometry, MeshPhongMaterial, SphereBufferGeometry } from 'three';
import { RKHelper } from '../../helpers/rk-helper';

/**
 * Physics objects that make up an event in Phoenix.
 */
export class PhoenixObjects {

  /** Pretty symbols for object params. */
  public static readonly prettySymbols: object = {
    'θ': 'theta',
    'ϕ': 'phi',
    'pT': 'pt',
    '𝛘2': 'chi2',
    'η': 'eta',
    'q': 'charge',
    'NDOF': 'ndof',
    'DOF': 'dof',
    'Energy': 'energy',
    'ET': 'et',
    '|p|': ['momentum', 'mom'],
    'LinkedClusters': 'linkedclusters',
    'LinkedTracks': 'linkedtracks',
    'PassedHighPt': 'passedhighpt',
    'Quality': 'quality',
    'Type': 'type',
    'ConeR': 'coner'
  };

  /**
   * Get pretty printed parameters of an object.
   * @param params Object parameters to be pretty printed.
   * @returns New pretty printed parameterss.
   */
  public static getPrettyParams(params: { [key: string]: any }): object {
    const newParams: object = {};
    // Convert param keys to lowercase
    const paramsLowerKey: object = {};
    for (const paramKey of Object.keys(params)) {
      paramsLowerKey[paramKey.toLowerCase()] = params[paramKey];
    }
    // Go through all the symbols
    for (const symbol of Object.keys(PhoenixObjects.prettySymbols)) {
      // Check if there are multiple representations of the symbol
      if (Array.isArray(PhoenixObjects.prettySymbols[symbol])) {
        // Go through each representation of the symbol and check if any exists in params
        for (const symbolChar of PhoenixObjects.prettySymbols[symbol]) {
          if (paramsLowerKey[symbolChar]) {
            newParams[symbol] = paramsLowerKey[symbolChar];
            break;
          }
        }
      } else {
        // Check if param indeed exists
        if (paramsLowerKey[PhoenixObjects.prettySymbols[symbol]]) {
          // Set new param according to the symbol
          newParams[symbol] = paramsLowerKey[PhoenixObjects.prettySymbols[symbol]];
        }
      }
    }

    // Pretty print the dparams if any
    if (params?.dparams) {
      const prettyDParams: object = {};

      prettyDParams['θ'] = params.dparams[3];
      prettyDParams['ϕ'] = params.dparams[2];
      prettyDParams['|p|'] = Math.abs(1 / params.dparams[4]);
      prettyDParams['q'] = Math.sign(1 / params.dparams[4]);
      prettyDParams['d0'] = params.dparams[0];
      prettyDParams['z0'] = params.dparams[1];

      return { ...newParams, ...prettyDParams };
    }

    return newParams;
  }

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

    // Setting info to the tubeObject and trackObject for selection and cuts
    for (let object of [tubeObject, trackObject]) {
      object.userData = PhoenixObjects.getPrettyParams(trackParams);
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
    mesh.userData = PhoenixObjects.getPrettyParams(jetParams);
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
    pointsObj.userData = PhoenixObjects.getPrettyParams(hitsParamsClone);
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
    cube.userData = PhoenixObjects.getPrettyParams(clusterParams);
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

    sphere.userData = PhoenixObjects.getPrettyParams(vertexParams);
    sphere.name = 'Vertex';
    // Setting uuid for selection from collections info
    vertexParams.uuid = sphere.uuid;

    return sphere;
  }

}
