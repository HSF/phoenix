import { Line, LineSegments, Mesh, Object3D, Points } from 'three';
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
    expect(trackObject.children[0].name).toBe('Track');
    expect(trackObject.children[1].type).toBe('Line');
    expect(trackObject.children[1].name).toBe('Track');

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
    expect(jetObject.type).toBe('Mesh');

    expect(jetObject.userData.eta).toBe(jetParams.eta);
    expect(jetObject.userData.phi).toBe(jetParams.phi);
    expect(jetObject.userData.theta).toBe(jetParams.theta);
    expect(jetObject.userData.energy).toBe(jetParams.energy);
    expect(jetObject.userData.et).toBe(jetParams.et);
    expect(jetObject.userData.coneR).toBe(jetParams.coneR);
    expect(jetObject.userData.color).toBe(jetParams.color);
  });

  it('should create Hits of Line type from the given parameters and get it as an object', () => {
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
  });

  it('should create Hits of Point type from the given parameters and get it as an object', () => {
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
  });

  it('should create Hits of Box type from the given parameters and get it as an object', () => {
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

    expect(hitsObjectBox.type).toBe('Mesh');
    expect(hitsObjectBox.name).toBe('BoxHit');
  });

  it('should create Hits of Unknown type from the given parameters and get it as an object', () => {
    const unknownHitsParams = [
      {
        pos: [4846, 23, 18, 126, 1565, 35404],
        type: 'Unknown',
      },
    ];
    const unknownHitsObject = PhoenixObjects.getHits(unknownHitsParams);
    expect(unknownHitsObject).toBeUndefined();
  });

  it('should create a Cluster and get it as an object', () => {
    const clusterParams = {};
    const clusterObject = PhoenixObjects.getCluster(clusterParams) as Mesh;

    expect(clusterObject.name).toBe('Cluster');
    expect(clusterObject.type).toBe('Mesh');
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
    expect(caloCellObject.type).toBe('Mesh');

    expect(caloCellObject.userData.energy).toBe(caloCells.energy);
    expect(caloCellObject.userData.phi).toBe(caloCells.phi);
    expect(caloCellObject.userData.eta).toBe(caloCells.eta);
    expect(caloCellObject.userData.theta).toBe(caloCells.theta);
    expect(caloCellObject.userData.uuid).not.toBe(caloCells.uuid);
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

    expect(planarCaloCellObject).toBeInstanceOf(Object3D);
    expect(planarCaloCellObject.name).toBe('PlanarCaloCell');
    expect(planarCaloCellObject.type).toBe('Object3D');

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
    expect(vertexObject.type).toBe('Mesh');
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
    expect(metObject.type).toBe('Line');

    expect(metObject.userData.color).toBe(metParams.color);
    expect(metObject.userData.etx).toBe(metParams.etx);
    expect(metObject.userData.ety).toBe(metParams.ety);
    expect(metObject.userData.etz).toBe(metParams.etz);
  });
});
