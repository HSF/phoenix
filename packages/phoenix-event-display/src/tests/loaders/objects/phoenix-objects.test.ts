import {
  BoxGeometry,
  BufferGeometry,
  Euler,
  Float32BufferAttribute,
  Layers,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshPhongMaterial,
  MeshToonMaterial,
  Points,
  PointsMaterial,
  Quaternion,
  SphereGeometry,
  TubeGeometry,
  Uint16BufferAttribute,
  Vector3,
} from 'three';
import { PhoenixObjects } from '../../../loaders/objects/phoenix-objects';

describe('PhoenixObjects', () => {
  let phoenixObjects: PhoenixObjects;

  beforeEach(() => {
    phoenixObjects = new PhoenixObjects();
  });

  it('should create an instance', () => {
    expect(phoenixObjects).toBeTruthy();
  });

  it('should create a Track from the given parameters and get it as an object', () => {
    const trackParams = {
      pos: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      dparams: [1, 0, 0, 3],
      extended: false,
      indices: [0, 1, 2],
      phi: 0,
      eta: 0,
      d0: 0,
      z0: 0,
      color: 0xffffff,
    };

    const trackObject = PhoenixObjects.getTrack(trackParams);

    expect(trackObject.children.length).toBe(2);
    expect(trackObject.children[0].type).toBe('Mesh');
    expect(trackObject.children[1].type).toBe('Line');

    const trackMesh = trackObject.children[0] as Mesh;
    expect(trackMesh.children.length).toBe(0);
    expect(trackMesh.position).toBeInstanceOf(Vector3);
    expect(trackMesh.rotation).toBeInstanceOf(Euler);
    expect(trackMesh.matrix).toBeInstanceOf(Matrix4);
    expect(trackMesh.matrixAutoUpdate).toBe(true);
    expect(trackMesh.layers).toBeInstanceOf(Layers);
    expect(trackMesh.visible).toBe(true);
    expect(trackMesh.castShadow).toBe(false);
    expect(trackMesh.receiveShadow).toBe(false);
    expect(trackMesh.frustumCulled).toBe(true);
    expect(trackMesh.renderOrder).toBe(0);
    expect(trackMesh.userData).toBeInstanceOf(Object);
    expect(trackMesh.geometry).toBeInstanceOf(TubeGeometry);
    expect(trackMesh.material).toBeInstanceOf(MeshToonMaterial);

    const trackLine = trackObject.children[1] as Line;
    expect(trackLine.children.length).toBe(0);
    expect(trackLine.position).toBeInstanceOf(Vector3);
    expect(trackLine.rotation).toBeInstanceOf(Euler);
    expect(trackLine.matrix).toBeInstanceOf(Matrix4);
    expect(trackLine.matrixAutoUpdate).toBe(true);
    expect(trackLine.layers).toBeInstanceOf(Layers);
    expect(trackLine.visible).toBe(true);
    expect(trackLine.castShadow).toBe(false);
    expect(trackLine.receiveShadow).toBe(false);
    expect(trackLine.frustumCulled).toBe(true);
    expect(trackLine.renderOrder).toBe(0);
    expect(trackLine.userData).toBeInstanceOf(Object);
    expect(trackLine.geometry).toBeInstanceOf(BufferGeometry);
    expect(trackLine.material).toBeInstanceOf(LineBasicMaterial);

    expect(trackObject.userData.pos).toEqual(trackParams.pos);
    expect(trackObject.userData.dparams).toEqual(trackParams.dparams);
    expect(trackObject.userData.extended).toBe(trackParams.extended);
    expect(trackObject.userData.indices).toEqual(trackParams.indices);
    expect(trackObject.userData.phi).toBe(trackParams.phi);
    expect(trackObject.userData.eta).toBe(trackParams.eta);
    expect(trackObject.userData.d0).toBe(trackParams.d0);
    expect(trackObject.userData.z0).toBe(trackParams.z0);
    expect(trackObject.userData.color).toBe(trackParams.color);
  });

  it('should create a Jet from the given parameters and get it as an object', () => {
    const jetParams = {
      eta: 1,
      phi: 1,
      theta: 1,
      energy: 1,
      et: 1,
      coneR: 1,
      color: '#000000',
    };

    const jetObject = PhoenixObjects.getJet(jetParams) as Mesh;

    expect(jetObject.name).toBe('Jet');
    expect(jetObject.children.length).toBe(0);
    expect(jetObject.up).toBeInstanceOf(Vector3);
    expect(jetObject.position).toBeInstanceOf(Vector3);
    expect(jetObject.rotation).toBeInstanceOf(Euler);
    expect(jetObject.quaternion).toBeInstanceOf(Quaternion);
    expect(jetObject.matrix).toBeInstanceOf(Matrix4);
    expect(jetObject.matrixAutoUpdate).toBe(true);
    expect(jetObject.layers).toBeInstanceOf(Layers);
    expect(jetObject.visible).toBe(true);
    expect(jetObject.castShadow).toBe(false);
    expect(jetObject.receiveShadow).toBe(false);
    expect(jetObject.frustumCulled).toBe(true);
    expect(jetObject.renderOrder).toBe(0);

    expect(jetObject.userData.eta).toBe(jetParams.eta);
    expect(jetObject.userData.phi).toBe(jetParams.phi);
    expect(jetObject.userData.theta).toBe(jetParams.theta);
    expect(jetObject.userData.energy).toBe(jetParams.energy);
    expect(jetObject.userData.et).toBe(jetParams.et);
    expect(jetObject.userData.coneR).toBe(jetParams.coneR);
    expect(jetObject.userData.color).toBe(jetParams.color);

    expect(jetObject.geometry.type).toBe('CylinderGeometry');
    expect(jetObject.geometry.index).toBeInstanceOf(Uint16BufferAttribute);
    expect(jetObject.geometry.attributes.position).toBeInstanceOf(
      Float32BufferAttribute
    );
    expect(jetObject.geometry.drawRange.start).toBe(0);
    expect(jetObject.geometry.drawRange.count).toBe(Infinity);
  });

  it('should create Hits from the given parameters and get it as an object', () => {
    const hitsParamsLine = [
      {
        pos: [
          -2545.135009765625, -2425.1064453125, 7826.09912109375,
          -2545.135009765625, -1.1222461462020874, 7826.09912109375,
        ],
        type: 'Line',
      },
    ];
    const hitsObjectLine = PhoenixObjects.getHits(hitsParamsLine) as Line;
    expect(hitsObjectLine).toBeInstanceOf(LineSegments);
    expect(hitsObjectLine.name).toBe('LineHit');
    expect(hitsObjectLine.children.length).toBe(0);
    expect(hitsObjectLine.geometry.type).toBe('BufferGeometry');
    expect(hitsObjectLine.material).toBeInstanceOf(LineBasicMaterial);

    const hitsParamsPoint = [
      {
        pos: [
          [2, 10, 30],
          [2, 10, 30],
        ],
        type: 'Point',
      },
    ];
    const hitsObjectPoint = PhoenixObjects.getHits(hitsParamsPoint) as Points;
    expect(hitsObjectPoint.type).toBe('Points');
    expect(hitsObjectPoint.name).toBe('Hit');
    expect(hitsObjectPoint.children.length).toBe(0);
    expect(hitsObjectPoint.geometry.type).toBe('BufferGeometry');
    expect(hitsObjectPoint.material).toBeInstanceOf(PointsMaterial);

    const hitsParamsBox = [
      {
        pos: [
          4846.200000000001, 2321.5798098701052, 18738.159131891938, 126.0,
          156.27835278734665, 34.06297770415404,
        ],
        type: 'Box',
      },
    ];
    const hitsObjectBox = PhoenixObjects.getHits(hitsParamsBox) as Mesh;

    expect(hitsObjectBox.name).toBe('BoxHit');
    expect(hitsObjectBox.children.length).toBe(0);
    expect(hitsObjectBox.geometry.type).toBe('BufferGeometry');
    expect(hitsObjectBox.material).toBeInstanceOf(MeshPhongMaterial);

    const unknownHitsParams = [
      {
        pos: [4846, 23, 18, 126, 1565, 35404],
        type: 'Unknown',
      },
    ];
    const unknownHitsObject = PhoenixObjects.getHits(unknownHitsParams);
    expect(unknownHitsObject).toBe(undefined);
  });

  it('should create a Cluster and get it as an object', () => {
    const clusterParams = {};
    const clusterObject = PhoenixObjects.getCluster(clusterParams) as Mesh;

    expect(clusterObject.type).toBe('Mesh');
    expect(clusterObject.children.length).toBe(0);
    expect(clusterObject.up).toBeInstanceOf(Vector3);

    expect(clusterObject.position).toBeInstanceOf(Vector3);
    expect(clusterObject.position.x).toBe(NaN);
    expect(clusterObject.position.y).toBe(NaN);
    expect(clusterObject.position.z).toBe(NaN);

    expect(clusterObject.rotation).toBeInstanceOf(Euler);
    expect(clusterObject.rotation.x).toBe(NaN);
    expect(clusterObject.rotation.y).toBe(NaN);
    expect(clusterObject.rotation.z).toBe(0);
    expect(clusterObject.rotation.order).toBe('XYZ');

    expect(clusterObject.quaternion).toBeInstanceOf(Quaternion);
    expect(clusterObject.quaternion.x).toBe(NaN);
    expect(clusterObject.quaternion.y).toBe(NaN);
    expect(clusterObject.quaternion.z).toBe(NaN);
    expect(clusterObject.quaternion.w).toBe(NaN);

    expect(clusterObject.scale).toBeInstanceOf(Vector3);
    expect(clusterObject.scale.x).toBe(1);
    expect(clusterObject.scale.y).toBe(1);
    expect(clusterObject.scale.z).toBe(1);

    expect(clusterObject.matrix).toBeInstanceOf(Matrix4);
    expect(clusterObject.matrixAutoUpdate).toBe(true);
    expect(clusterObject.layers).toBeInstanceOf(Layers);
    expect(clusterObject.visible).toBe(true);
    expect(clusterObject.castShadow).toBe(false);
    expect(clusterObject.receiveShadow).toBe(false);
    expect(clusterObject.frustumCulled).toBe(true);
    expect(clusterObject.renderOrder).toBe(0);
    expect(clusterObject.geometry).toBeInstanceOf(BoxGeometry);
    expect(clusterObject.material).toBeInstanceOf(MeshPhongMaterial);
  });

  it('should create a Calocell from the given parameters and get it as an object', () => {
    const caloCells = {
      energy: 1,
      phi: 1,
      eta: 1,
      theta: 1,
      uuid: 'test',
    };

    const caloCellObject = PhoenixObjects.getCaloCell(caloCells) as Mesh;

    expect(caloCellObject.name).toBe('Cluster');
    expect(caloCellObject.position).toBeInstanceOf(Vector3);

    expect(caloCellObject.rotation).toBeInstanceOf(Euler);
    expect(caloCellObject.rotation.x).toBe(0);
    expect(caloCellObject.rotation.y).toBe(0);
    expect(caloCellObject.rotation.z).toBe(0);
    expect(caloCellObject.rotation.order).toBe('XYZ');

    expect(caloCellObject.quaternion).toBeInstanceOf(Quaternion);
    expect(caloCellObject.quaternion.x).toBe(0);
    expect(caloCellObject.quaternion.y).toBe(0);
    expect(caloCellObject.quaternion.z).toBe(0);
    expect(caloCellObject.quaternion.w).toBe(1);

    expect(caloCellObject.scale).toBeInstanceOf(Vector3);
    expect(caloCellObject.scale.x).toBe(1);
    expect(caloCellObject.scale.y).toBe(1);
    expect(caloCellObject.scale.z).toBe(1);

    expect(caloCellObject.matrix).toBeInstanceOf(Matrix4);
    expect(caloCellObject.matrixAutoUpdate).toBe(true);
    expect(caloCellObject.layers).toBeInstanceOf(Layers);
    expect(caloCellObject.visible).toBe(true);
    expect(caloCellObject.castShadow).toBe(false);
    expect(caloCellObject.receiveShadow).toBe(false);
    expect(caloCellObject.frustumCulled).toBe(true);
    expect(caloCellObject.renderOrder).toBe(0);

    expect(caloCellObject.userData.energy).toBe(caloCells.energy);
    expect(caloCellObject.userData.phi).toBe(caloCells.phi);
    expect(caloCellObject.userData.eta).toBe(caloCells.eta);
    expect(caloCellObject.userData.theta).toBe(caloCells.theta);
    expect(caloCellObject.userData.uuid).not.toBe(caloCells.uuid);

    expect(caloCellObject.geometry.type).toBe('BoxGeometry');
  });

  it('should create a PlanarCaloCell from the given parameters and get it as an object', () => {
    const planarCaloCellParams = {
      pos: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      cellSize: 1,
      plane: [1, 0, 0],
      energy: 1,
      phi: 0,
      eta: 0,
      theta: 0,
      color: '#000000',
    };

    const planarCaloCellObject =
      PhoenixObjects.getPlanarCaloCell(planarCaloCellParams);

    expect(planarCaloCellObject.type).toBe('Object3D');
    expect(planarCaloCellObject.children.length).toBe(1);

    const caloCell = planarCaloCellObject.children[0];
    expect(caloCell).toBeInstanceOf(Mesh);
    expect(caloCell.up).toBeInstanceOf(Vector3);
    expect(caloCell.position).toBeInstanceOf(Vector3);
    expect(caloCell.rotation).toBeInstanceOf(Euler);
    expect(caloCell.quaternion).toBeInstanceOf(Quaternion);
    expect(caloCell.scale).toBeInstanceOf(Vector3);
    expect(caloCell.matrix).toBeInstanceOf(Matrix4);
    expect(caloCell.matrixAutoUpdate).toBe(true);
    expect(caloCell.layers).toBeInstanceOf(Layers);
    expect(caloCell.visible).toBe(true);
    expect(caloCell.castShadow).toBe(false);
    expect(caloCell.receiveShadow).toBe(false);
    expect(caloCell.frustumCulled).toBe(true);
    expect(caloCell.renderOrder).toBe(0);

    expect(planarCaloCellObject.up).toBeInstanceOf(Vector3);
    expect(planarCaloCellObject.up.x).toBe(0);
    expect(planarCaloCellObject.up.y).toBe(1);
    expect(planarCaloCellObject.up.z).toBe(0);

    expect(planarCaloCellObject.position).toBeInstanceOf(Vector3);
    expect(planarCaloCellObject.position.x).toBe(0);
    expect(planarCaloCellObject.position.y).toBe(0);
    expect(planarCaloCellObject.position.z).toBe(0);

    expect(planarCaloCellObject.rotation).toBeInstanceOf(Euler);

    expect(planarCaloCellObject.userData.energy).toBe(
      planarCaloCellParams.energy
    );
    expect(planarCaloCellObject.userData.phi).toBe(planarCaloCellParams.phi);
    expect(planarCaloCellObject.userData.eta).toBe(planarCaloCellParams.eta);
    expect(planarCaloCellObject.userData.theta).toBe(
      planarCaloCellParams.theta
    );
    expect(planarCaloCellObject.userData.cellSize).toBe(
      planarCaloCellParams.cellSize
    );
    expect(planarCaloCellObject.userData.plane).toBe(
      planarCaloCellParams.plane
    );
    expect(planarCaloCellObject.userData.color).toBe(
      planarCaloCellParams.color
    );
    expect(planarCaloCellObject.userData.pos).toBe(planarCaloCellParams.pos);
  });

  it('should create a Vertex from the given parameters and get it as an object', () => {
    const vertexParams = {
      x: 1,
      y: 0,
      z: 0,
      color: '#000000',
    };

    const vertexObject = PhoenixObjects.getVertex(vertexParams) as Mesh;

    expect(vertexObject.name).toBe('Vertex');
    expect(vertexObject.children.length).toBe(0);

    expect(vertexObject.up).toBeInstanceOf(Vector3);
    expect(vertexObject.up.x).toBe(0);
    expect(vertexObject.up.y).toBe(1);
    expect(vertexObject.up.z).toBe(0);

    expect(vertexObject.position).toBeInstanceOf(Vector3);
    expect(vertexObject.position.x).toBe(vertexParams.x);
    expect(vertexObject.position.y).toBe(vertexParams.y);
    expect(vertexObject.position.z).toBe(vertexParams.z);

    expect(vertexObject.rotation).toBeInstanceOf(Euler);
    expect(vertexObject.rotation.x).toBe(0);
    expect(vertexObject.rotation.y).toBe(0);
    expect(vertexObject.rotation.z).toBe(0);
    expect(vertexObject.rotation.order).toBe('XYZ');

    expect(vertexObject.quaternion).toBeInstanceOf(Quaternion);
    expect(vertexObject.matrix).toBeInstanceOf(Matrix4);
    expect(vertexObject.matrixAutoUpdate).toBe(true);
    expect(vertexObject.layers).toBeInstanceOf(Layers);

    expect(vertexObject.geometry).toBeInstanceOf(SphereGeometry);
    expect(vertexObject.material).toBeInstanceOf(MeshPhongMaterial);
  });

  it('should create a Vertex from the given parameters and get it as a MET object', () => {
    const metParams = {
      etx: 1,
      ety: 1,
      etz: 1,
      color: '#000000',
    };

    const metObject = PhoenixObjects.getMissingEnergy(metParams) as Line;

    expect(metObject.name).toBe('Missing Energy');
    expect(metObject.children.length).toBe(0);

    expect(metObject.up).toBeInstanceOf(Vector3);
    expect(metObject.up.x).toBe(0);
    expect(metObject.up.y).toBe(1);
    expect(metObject.up.z).toBe(0);

    expect(metObject.position).toBeInstanceOf(Vector3);
    expect(metObject.position.x).toBe(0);
    expect(metObject.position.y).toBe(0);
    expect(metObject.position.z).toBe(0);

    expect(metObject.rotation).toBeInstanceOf(Euler);
    expect(metObject.rotation.x).toBe(0);
    expect(metObject.rotation.y).toBe(0);
    expect(metObject.rotation.z).toBe(0);

    expect(metObject.geometry).toBeInstanceOf(BufferGeometry);
    expect(metObject.material).toBeInstanceOf(LineDashedMaterial);
    expect(metObject.userData.color).toBe(metParams.color);
    expect(metObject.userData.etx).toBe(metParams.etx);
    expect(metObject.userData.ety).toBe(metParams.ety);
    expect(metObject.userData.etz).toBe(metParams.etz);
  });
});
