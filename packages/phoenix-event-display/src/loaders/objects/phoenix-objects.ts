import {
  Vector3,
  Object3D,
  CatmullRomCurve3,
  TubeGeometry,
  MeshToonMaterial,
  Mesh,
  BufferGeometry,
  LineBasicMaterial,
  Line,
  Group,
  Quaternion,
  CylinderGeometry,
  MeshBasicMaterial,
  BufferAttribute,
  PointsMaterial,
  Points,
  BoxGeometry,
  MeshPhongMaterial,
  SphereGeometry,
  LineSegments,
  LineDashedMaterial,
} from 'three';
import { EVENT_DATA_TYPE_COLORS } from '../../helpers/constants';
import { RKHelper } from '../../helpers/rk-helper';
import { CoordinateHelper } from '../../helpers/coordinate-helper';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TracksMaterial, TracksMesh } from './tracks';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

/**
 * Physics objects that make up an event in Phoenix.
 */
export class PhoenixObjects {
  /**
   * Get tracks as three.js obejct.
   * @param tracks Tracks params to construct tacks from.
   * @returns The object containing tracks.
   */
  public static getTracks(tracks): Object3D {
    const tracksMesh = new TracksMesh();
    const tracksMaterial = new TracksMaterial({ lineWidth: 2 });

    for (const track of tracks) {
      if (!(track.pos?.length > 2)) {
        if (track.dparams) {
          track.pos = RKHelper.extrapolateTrackPositions(track);
        }
        track.extended = true;
      }

      if (track.pos.length < 2) {
        console.log('Track too short, and extrapolation failed.');
        continue;
      }

      // For cuts etc we currently need to have the cut parameters on the track
      if (track?.dparams) {
        if (!track?.phi) {
          track.phi = track.dparams[2];
        }
        if (!track?.eta) {
          track.eta = CoordinateHelper.thetaToEta(track.dparams[3]);
        }
        if (!track?.d0) {
          track.d0 = track.dparams[0];
        }
        if (!track?.z0) {
          track.z0 = track.dparams[1];
        }
      }

      const points = track.pos.map((p) => new Vector3(p[0], p[1], p[2]));
      const curve = new CatmullRomCurve3(points);
      const vertices = curve.getPoints(50);

      const color = track.color
        ? parseInt(track.color, 16)
        : EVENT_DATA_TYPE_COLORS.Tracks.getHex();

      track.tid = tracksMesh.addTrack(vertices, color);
      track.material = tracksMaterial;
    }
    tracksMesh.process();

    const tracksObject = new Mesh(tracksMesh, tracksMaterial);
    tracksObject.name = 'Track';
    for (const track of tracks) {
      track.uuid = tracksObject.uuid;
    }
    return tracksObject;
  }

  /**
   * Process the Track from the given parameters (and positions)
   * and get it as a geometry.
   * @param trackParams Parameters of the Track.
   * @returns Track object.
   */
  public static getTrack(trackParams: any): Object3D {
    // Track with too few points are extrapolated with RungeKutta
    if (!(trackParams.pos?.length > 2)) {
      if (trackParams.dparams) {
        trackParams.pos = RKHelper.extrapolateTrackPositions(trackParams);
      }
      trackParams.extended = true;
    }

    const positions = trackParams.pos;

    // Check again, in case there was an issue with the extrapolation.
    if (positions.length < 2) {
      console.log('Track too short, and extrapolation failed.');
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
    const objectColor = trackParams.color
      ? parseInt(trackParams.color, 16)
      : EVENT_DATA_TYPE_COLORS.Tracks.getHex();

    const points = [];

    for (let i = 0; i < positions.length; i++) {
      points.push(
        new Vector3(positions[i][0], positions[i][1], positions[i][2])
      );
      const radius = Math.sqrt(
        positions[i][0] * positions[i][0] +
          positions[i][1] * positions[i][1] +
          positions[i][2] * positions[i][2]
      );
      const thetaFromPos = Math.acos(positions[i][2] / radius);
      // const deltaTheta = Math.abs(trackParams.dparams[3]-thetaFromPos);
      // if (deltaTheta>0.1) {
      //   console.log( 'theta:', trackParams.dparams[3], 'theta from hit', thetaFromPos, 'radius', radius );
      // }
    }

    // attributes
    const curve = new CatmullRomCurve3(points);

    // TubeGeometry
    const geometry = new TubeGeometry(curve, undefined, 2);
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
    for (const object of [tubeObject, trackObject, lineObject]) {
      object.userData = Object.assign({}, trackParams);
      object.name = 'Track';
    }

    // Setting uuid for selection from collections info
    trackParams.uuid = trackObject.uuid;

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
    const length = (jetParams.energy ? jetParams.energy : jetParams.et) * 0.2;

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

    const width = jetParams.coneR
      ? length * Math.sin(jetParams.coneR)
      : length * 0.1;

    const x = cphi * stheta;
    const y = sphi * stheta;
    const z = ctheta;
    const v1 = new Vector3(0, 1, 0);
    const v2 = new Vector3(x, y, z);
    const quaternion = new Quaternion();
    quaternion.setFromUnitVectors(v1, v2);

    const geometry = new CylinderGeometry(width, 10, length, 50, 50, false); // Cone

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
    if (type === 'Line' || type === 'Box') {
      coordlength = 6;
    }

    // attributes
    const hitLength = hitsParams.length * coordlength;
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
      case 'Box':
        return PhoenixObjects.hitsToBoxes(
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
    _hitParamsClone: any
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
    // Disabling for now because the data isn't readable on object selection.
    // pointsObj.userData = Object.assign({}, hitParamsClone);
    pointsObj.userData = {};
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
    _hitParamsClone: any
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
    // Disabling for now because the data isn't readable on object selection.
    // linesObj.userData = Object.assign({}, hitParamsClone);
    linesObj.userData = {};
    linesObj.name = 'LineHit';
    // Setting uuid for selection from collections info
    hitsParams.uuid = linesObj.uuid;

    return linesObj;
  }

  /**
   * Get a Mesh object from Hits parameters. The Mesh is actually a set of boxes, one per hit
   * @param pointPos Positions and dimensions of boxes
   * @param hitsParams Parameters of the Hit.
   * @param hitParamsClone Cloned parameters of the Hit to avoid object references.
   * @returns A 3D object of type `Mesh`.
   */
  private static hitsToBoxes(
    pointPos: any,
    hitsParams: any,
    _hitParamsClone: any
  ): Object3D {
    // geometry
    const geometries = [];
    for (let i = 0; i < pointPos.length; i += 6) {
      const boxGeometry = new BoxGeometry(
        pointPos[i + 3],
        pointPos[i + 4],
        pointPos[i + 5]
      );
      boxGeometry.translate(pointPos[i], pointPos[i + 1], pointPos[i + 2]);
      geometries.push(boxGeometry);
    }
    const geometry = mergeBufferGeometries(geometries);
    geometry.computeBoundingSphere();
    // material
    const material = new MeshPhongMaterial({
      color: hitsParams.color ?? EVENT_DATA_TYPE_COLORS.Hits,
    });
    // object
    const box = new Mesh(geometry, material);

    // Disabling for now because the data isn't readable on object selection.
    // linesObj.userData = Object.assign({}, hitParamsClone);
    box.userData = {};
    box.name = 'BoxHit';
    // Setting uuid for selection from collections info
    hitsParams.uuid = box.uuid;

    return box;
  }

  /**
   * Process the Cluster from the given parameters and get it as a geometry.
   * @param clusterParams Parameters for the Cluster.
   * @param drawRadius Radius where to draw barrel Clusters
   * @param drawZ Plane in z where to draw endcap Clusters
   * @param energyScaling Amount to multply the energy by to get the depth of the cell
   * @returns Cluster object.
   */
  public static getCluster(
    clusterParams: any,
    drawRadius: number = 1800.0,
    drawZ: number = 3600.0,
    energyScaling: number = 0.03,
    fixedDepth: number = 0.0
  ): Object3D {
    const maxR2 = drawRadius * drawRadius;
    const maxZ = drawZ;
    const length = clusterParams.energy * energyScaling;

    // geometry
    const cube = PhoenixObjects.getCaloCube(length, 40, clusterParams);
    const position = PhoenixObjects.getCaloPosition(
      clusterParams,
      drawZ,
      drawRadius,
      maxR2,
      maxZ
    );

    cube.position.copy(position);

    cube.lookAt(new Vector3(0, 0, 0));
    cube.userData = Object.assign({}, clusterParams);
    cube.name = 'Cluster';
    // Setting uuid for selection from collections info
    clusterParams.uuid = cube.uuid;

    return cube;
  }

  /**
   * Get the position for a Calo hit in cartesian coordinates
   * @param clusterParams Parameters for the Cluster (which must include theta and phi)
   * @param drawRadius Radius where to draw barrel Clusters
   * @param maxR2 Maximum permitted radius squared
   * @param maxZ Maximum position along the z axis
   * @returns Corrected cartesian position.
   */
  private static getCaloPosition(
    clusterParams: { phi: number; eta: number; theta: number },
    drawZ: number,
    drawRadius: number,
    maxR2: number,
    maxZ: number
  ) {
    const theta = CoordinateHelper.etaToTheta(clusterParams.eta);
    clusterParams.theta = theta;

    const position = CoordinateHelper.sphericalToCartesian(
      drawZ + drawRadius,
      theta,
      clusterParams.phi
    );

    // How to generalise to other experiments? Pass in limit lambda?
    const cylRadius2 = position.x * position.x + position.y * position.y;
    if (cylRadius2 > maxR2) {
      position.setLength(
        (position.length() * Math.sqrt(maxR2)) / Math.sqrt(cylRadius2)
      );
    }

    if (Math.abs(position.z) > maxZ) {
      position.setLength((position.length() * maxZ) / Math.abs(position.z));
    }
    return position;
  }

  /**
   * Get the cuboid geometry for a Calo hit
   * @param length length of the cuboid
   * @param width width of the cuboid
   * @param clusterParams Parameters for the Cluster (which must include color
   * @returns Geometry.
   */
  private static getCaloCube(
    length: number,
    width: number = 30,
    clusterParams: any
  ) {
    if (length < width) {
      length = width;
    }
    const geometry = new BoxGeometry(width, width, length);
    // material
    const material = new MeshPhongMaterial({
      color: clusterParams.color ?? EVENT_DATA_TYPE_COLORS.CaloClusters,
    });
    // object
    const cube = new Mesh(geometry, material);
    return cube;
  }

  /**
   * Process the CaloCell from the given parameters and get it as a geometry.
   * @param caloCells Parameters for the CaloCell.
   * @returns Calorimeter Cell object.
   */
  public static getCaloCell(caloCells: {
    energy: number;
    phi: number;
    eta: number;
    theta: number;
    uuid: string;
  }): Object3D {
    const drawRadius = 1700; // FIXME - I really need to get this from somewhere. Atlantis has a lookup based on XML geometry.
    const drawZ = 2000;
    const maxR2 = drawRadius * drawRadius;
    const maxZ = drawZ;
    const length = 30;

    // geometry
    const cube = PhoenixObjects.getCaloCube(length, 30, caloCells);
    const position = PhoenixObjects.getCaloPosition(
      caloCells,
      drawZ,
      drawRadius,
      maxR2,
      maxZ
    );

    cube.position.copy(position);

    cube.userData = Object.assign({}, caloCells);
    cube.name = 'Cluster';
    // Setting uuid for selection from collections info
    caloCells.uuid = cube.uuid;

    return cube;
  }

  /**
   * Get the planar calo cells from parameters.
   * @param caloCells Parameters to build planar calo cells.
   * @returns Geometry.
   */
  public static getPlanarCaloCells(caloCells: any[]): Object3D {
    const geoms = [];
    for (const caloCell of caloCells) {
      const position = caloCell.pos;
      if (!position) {
        continue;
      }

      const length = caloCell.energy * 0.22;
      const size = caloCell.cellSize;
      const plane = caloCell.plane;

      // geometry
      const geometry = new BoxGeometry(size, size, length);
      geometry.translate(position[0], position[1], plane[3] + length / 2);
      const qrot = new Quaternion();
      qrot.setFromUnitVectors(
        new Vector3(0, 0, 1),
        new Vector3(...plane.slice(0, 3))
      );
      geometry.applyQuaternion(qrot);
      geoms.push(geometry);
    }

    const material = new MeshPhongMaterial({
      color: caloCells[0].color ?? EVENT_DATA_TYPE_COLORS.PlanarCaloCells,
    });

    const outerBox = new Mesh(
      BufferGeometryUtils.mergeBufferGeometries(geoms),
      material
    );

    outerBox.userData = Object.assign({}, caloCells[0]);
    outerBox.name = 'PlanarCaloCell';
    for (const caloCell of caloCells) {
      caloCell.uuid = outerBox.uuid;
    }
    return outerBox;
  }

  /**
   * Process the PlanarCaloCell from the given parameters and get it as a geometry.
   * @param caloCells Parameters for the Planar Calorimeter.
   * @returns Planar Calorimeter object.
   */
  public static getPlanarCaloCell(caloCells: any): Object3D {
    const position = caloCells.pos;
    if (!position) {
      return;
    }

    const length = caloCells.energy * 0.22;
    const size = caloCells.cellSize;
    const plane = caloCells.plane;

    // geometry
    const geometry = new BoxGeometry(size, size, length);

    // there is a need of an outer box to place the proper one inside of it
    const outerBox = new Object3D();

    // material
    const material = new MeshPhongMaterial({
      color: caloCells.color ?? EVENT_DATA_TYPE_COLORS.PlanarCaloCells,
    });

    // object
    const box = new Mesh(geometry, material);

    // adding the original box to the outter created one, for proper translation / rotation purposes
    outerBox.add(box);

    // creating the box in the z direction, and moving it by d, along the z
    const boxPosition = new Vector3(
      ...position.slice(0, 2),
      plane[3] + length / 2
    );

    box.position.copy(boxPosition);

    // transforming the box from the z axis to the x,y,z of the plane
    const qrot = new Quaternion();
    qrot.setFromUnitVectors(
      new Vector3(0, 0, 1),
      new Vector3(...plane.slice(0, 3))
    );

    outerBox.quaternion.copy(qrot);

    outerBox.userData = Object.assign({}, caloCells);
    outerBox.name = 'PlanarCaloCell';
    caloCells.uuid = outerBox.uuid;

    return outerBox;
  }

  /**
   * Process the Vertex from the given parameters and get it as a geometry.
   * @param vertexParams Parameters for the Vertex.
   * @returns Vertex object.
   */
  public static getVertex(vertexParams: any): Object3D {
    // geometry
    const geometry = new SphereGeometry(3);
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
