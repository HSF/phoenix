import {
  Vector3,
  Object3D,
  CatmullRomCurve3,
  TubeBufferGeometry,
  MeshToonMaterial,
  Mesh,
  BufferGeometry,
  LineBasicMaterial,
  Line,
  Group,
  Quaternion,
  CylinderBufferGeometry,
  MeshBasicMaterial,
  BufferAttribute,
  PointsMaterial,
  Points,
  BoxBufferGeometry,
  MeshPhongMaterial,
  SphereBufferGeometry,
  LineSegments,
  LineDashedMaterial,
  Spherical,
} from 'three';
import { EVENT_DATA_TYPE_COLORS } from '../../helpers/constants';
import { RKHelper } from '../../helpers/rk-helper';
import { CoordinateHelper } from '../../helpers/coordinate-helper';

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
    if (!positions) {
      return;
    }

    // Track with too few points are extrapolated with RungeKutta
    if (positions.length < 2) {
      if (trackParams?.dparams) {
        // Test, for ATLAS.
        // FIXME - make configurable
        let inBounds = function (pos: Vector3) {
          if (pos.z > 3000) return false;
          if (Math.sqrt(pos.x * pos.x + pos.y * pos.y) > 1100) return false;

          return true;
        };

        positions = RKHelper.extrapolateTrackPositions(trackParams, inBounds);
      }
    }

    // Check again, in case there was an issue with the extrapolation.
    if (positions.length < 2) {
      return;
    }

    // For cuts etc we currently need to have the cut parameters on the track
    if (trackParams?.dparams) {
      if (!trackParams?.phi) {
        trackParams.phi = trackParams.dparams[2];
      }
      if (!trackParams?.eta) {
        trackParams.eta = CoordinateHelper.thetaToEta(trackParams.dparams[3]);
      }
      if (!trackParams?.d0) {
        trackParams.d0 = trackParams.dparams[0];
      }
      if (!trackParams?.z0) {
        trackParams.z0 = trackParams.dparams[1];
      }
    }

    // const length = 100;
    let objectColor = trackParams.color
      ? parseInt(trackParams.color, 16)
      : EVENT_DATA_TYPE_COLORS.Tracks.getHex();

    const points = [];

    for (let i = 0; i < positions.length; i++) {
      points.push(
        new Vector3(positions[i][0], positions[i][1], positions[i][2])
      );
      const radius = Math.sqrt(positions[i][0]*positions[i][0] + positions[i][1]*positions[i][1] + positions[i][2]*positions[i][2]);
      const thetaFromPos = Math.acos(positions[i][2]/radius)
      // const deltaTheta = Math.abs(trackParams.dparams[3]-thetaFromPos);
      // if (deltaTheta>0.1) {
      //   console.log( 'theta:', trackParams.dparams[3], 'theta from hit', thetaFromPos, 'radius', radius );
      // }
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
      linewidth: 2,
    });
    const lineObject = new Line(lineGeometry, lineMaterial);
    lineObject.name = 'Track';

    // Creating a group to add both the Tube curve and the Line
    const trackObject = new Group();
    trackObject.add(tubeObject);
    trackObject.add(lineObject);

    // Setting info to the tubeObject and trackObject for selection and cuts
    for (let object of [tubeObject, trackObject, lineObject]) {
      object.userData = Object.assign({}, trackParams);
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
    const theta = jetParams.theta
      ? jetParams.theta
      : CoordinateHelper.etaToTheta(eta);
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
    const translation = new Vector3(
      0.5 * length * cphi * stheta,
      0.5 * length * sphi * stheta,
      0.5 * length * ctheta
    );

    const x = cphi * stheta;
    const y = sphi * stheta;
    const z = ctheta;
    const v1 = new Vector3(0, 1, 0);
    const v2 = new Vector3(x, y, z);
    const quaternion = new Quaternion();
    quaternion.setFromUnitVectors(v1, v2);

    const geometry = new CylinderBufferGeometry(
      width,
      1,
      length,
      50,
      50,
      false
    ); // Cone

    const material = new MeshBasicMaterial({
      color: jetParams.color ?? EVENT_DATA_TYPE_COLORS.Jets,
      opacity: 0.3,
      transparent: true,
    });
    material.opacity = 0.5;
    const mesh = new Mesh(geometry, material);
    mesh.position.copy(translation);
    mesh.quaternion.copy(quaternion);
    mesh.userData = Object.assign({}, jetParams);
    mesh.name = 'Jet';
    // Setting uuid for selection from collections info
    jetParams.uuid = mesh.uuid;

    return mesh;
  }

  /**
   * Process the Hits from the given parameters and get them as a geometry.
   * @param hitsParams Either an array of positions, or of Hit objects. If objects, they must contain 'pos', the array of [x,y,z] positions,
   * Can optionally contain extraInfo, which will be added to the resultant hit.
   * `type` tells Phoenix how to draw this - currently can be Point (default), or Line.
   * @returns Hits object.
   */
  public static getHits(hitsParams: any): Object3D {
    let hitsParamsClone: any;
    let positions: any[];
    let type: string = 'Point'; // Default is point and 3 coordinates per hit
    let coordlength = 3;
    let isSimpleArray = false;

    // if (typeof hitsParams === 'object' && !Array.isArray(hitsParams)) {
    //   positions = [hitsParams.pos];
    //   hitsParamsClone = hitsParams;
    // } else {
    //   positions = hitsParams;
    //   hitsParamsClone = { pos: hitsParams };
    // }

    if (hitsParams.length > 0) {
      // Peek at first one. Would be better to make these properties of the collections.
      const first = hitsParams[0];
      if (Array.isArray(first)) {
        isSimpleArray = true;
        hitsParamsClone = { pos: hitsParams };
      } else {
        hitsParamsClone = hitsParams;
        if ('type' in first) {
          type = first.type;
        }
      }
    } else {
      console.log('No hits! Aborting from getHits.');
      return new Object3D();
    }

    // Lines need 6 coords
    if (type === 'Line') {
      coordlength = 6;
    }

    // attributes
    let hitLength = hitsParams.length * coordlength;
    if (isSimpleArray) length = hitLength; // These are already arrays
    const pointPos = new Float32Array(hitLength);
    let i = 0;
    for (const hit of hitsParams) {
      for (let j = 0; j < coordlength; ++j, ++i) {
        if (isSimpleArray) {
          pointPos[i] = hit[j];
        } else {
          pointPos[i] = hit.pos[j];
        }
      }
    }

    // geometry
    switch (type) {
      case 'Point':
        return PhoenixObjects.hitsToPoints(
          pointPos,
          hitsParams,
          hitsParamsClone
        );
      case 'Line':
        return PhoenixObjects.hitsToLines(
          pointPos,
          hitsParams,
          hitsParamsClone
        );
      default:
        console.log('ERROR: Unknown hit type!');
        return;
    }
  }

  /**
   * Get a Points object from Hits parameters.
   * @param pointPos Position of the point.
   * @param hitsParams Parameters of the Hit.
   * @param hitParamsClone Cloned parameters of the Hit to avoid object references.
   * @returns A 3D object of type `Points`.
   */
  private static hitsToPoints(
    pointPos: any,
    hitsParams: any,
    hitParamsClone: any
  ): Object3D {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(pointPos, 3));
    geometry.computeBoundingSphere();
    // material
    const material = new PointsMaterial({
      size: 10,
      color: hitsParams.color ?? EVENT_DATA_TYPE_COLORS.Hits,
    });
    // object
    const pointsObj = new Points(geometry, material);
    pointsObj.userData = Object.assign({}, hitParamsClone);
    pointsObj.name = 'Hit';
    // Setting uuid for selection from collections info
    hitsParams.uuid = pointsObj.uuid;

    return pointsObj;
  }

  /**
   * Get a Lines object from Hits parameters.
   * @param pointPos Position of the HIt.
   * @param hitsParams Parameters of the Hit.
   * @param hitParamsClone Cloned parameters of the Hit to avoid object references.
   * @returns A 3D object of type `LineSegments`.
   */
  private static hitsToLines(
    pointPos: any,
    hitsParams: any,
    hitParamsClone: any
  ): Object3D {
    // geometry
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(pointPos, 3));
    geometry.computeBoundingSphere();
    // material
    const material = new LineBasicMaterial({
      linewidth: 2,
      color: hitsParams.color ?? EVENT_DATA_TYPE_COLORS.Hits,
    });
    // object
    const linesObj = new LineSegments(geometry, material);
    linesObj.userData = Object.assign({}, hitParamsClone);
    linesObj.name = 'Hit';
    // Setting uuid for selection from collections info
    hitsParams.uuid = linesObj.uuid;

    return linesObj;
  }

  /**
   * Process the CLuster from the given parameters and get it as a geometry.
   * @param clusterParams Parameters for the Cluster.
   * @returns Cluster object.
   */
  public static getCluster(clusterParams: any): Object3D {
    const drawRadius = 1800.0; // FIXME - maker this configurable
    const drawZ = 3600.0; // FIXME - maker this configurable

    const maxR2 = drawRadius * drawRadius;
    const maxZ = drawZ;
    const length = clusterParams.energy * 0.03;
    // geometry
    const geometry = new BoxBufferGeometry(30, 30, length);
    // material
    const material = new MeshPhongMaterial({
      color: clusterParams.color ?? EVENT_DATA_TYPE_COLORS.CaloClusters,
    });
    // object
    const cube = new Mesh(geometry, material);
    const theta = CoordinateHelper.etaToTheta(clusterParams.eta);
    clusterParams.theta = theta;

    let position = CoordinateHelper.sphericalToCartesian(
      drawZ + drawRadius,
      theta,
      clusterParams.phi
    );

    // How to generalise to other experiments? Pass in limit lambda?
    let cylRadius2 = position.x * position.x + position.y * position.y;
    if (cylRadius2 > maxR2) {
      position.setLength(
        (position.length() * Math.sqrt(maxR2)) / Math.sqrt(cylRadius2)
      );
    }

    if (Math.abs(position.z) > maxZ) {
      position.setLength((position.length() * maxZ) / Math.abs(position.z));
    }

    cube.position.copy(position);

    cube.lookAt(new Vector3(0, 0, 0));
    cube.userData = Object.assign({}, clusterParams);
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
    const material = new MeshPhongMaterial({
      color: vertexParams.color ?? EVENT_DATA_TYPE_COLORS.Vertices,
    });
    // object
    const sphere = new Mesh(geometry, material);
    sphere.position.x = vertexParams.x;
    sphere.position.y = vertexParams.y;
    sphere.position.z = vertexParams.y;

    sphere.userData = Object.assign({}, vertexParams);
    sphere.name = 'Vertex';
    // Setting uuid for selection from collections info
    vertexParams.uuid = sphere.uuid;

    return sphere;
  }

  /**
   * Process the Vertex from the given parameters and get it as a geometry.
   * @param metParams Parameters for the Vertex.
   * @returns MET object.
   */
  public static getMissingEnergy(metParams: any): Object3D {
    // geometry
    const points = [];
    points.push(new Vector3(0, 0, 0));
    points.push(new Vector3(metParams.etx, metParams.ety, 0));

    const geometry = new BufferGeometry().setFromPoints(points);

    // material
    const material = new LineDashedMaterial({
      linewidth: 2,
      dashSize: 2,
      color: metParams.color ?? EVENT_DATA_TYPE_COLORS.MissingEnergy,
    });
    // object
    const object = new Line(geometry, material);
    object.computeLineDistances();
    object.userData = Object.assign({}, metParams);
    object.name = 'Missing Energy';
    // Setting uuid for selection from collections info
    metParams.uuid = object.uuid;

    return object;
  }
}
