import { Line, LineSegments, Mesh, Object3D, Points } from 'three';
import { PhoenixObjects } from '../../../loaders/objects/phoenix-objects';

describe('PhoenixObjects', () => {
  let phoenixObjects: PhoenixObjects;

  beforeEach(() => {
    phoenixObjects = new PhoenixObjects();
  });

  afterEach(() => {
    phoenixObjects = undefined;
  });

  it('should create an instance', () => {
    expect(phoenixObjects).toBeTruthy();
  });

  it('should get tracks as a three.js object', () => {
    const trackParams = [
      {
        chi2: 0.0,
        dof: 0.0,
        dparams: [0.0, 0.0, 0.0, 1.5707963705062866, 0.0],
        label: '0.000000/0.000000',
        pos: [
          [0.0, 0.0, -0.0],
          [999.999999999999, 0.0, -4.371139000186444e-5],
          [1999.999999999998, 0.0, -8.742278000372887e-5],
          [2999.999999999997, 0.0, -0.00013113417000559332],
        ],
      },
      {
        chi2: 0.0,
        dof: 0.0,
        dparams: [0.0, 0.0, 0.0, 2.43656587600708, 0.0],
        label: '1.000000/0.000000',
        pos: [
          [0.0, 0.0, -0.0],
          [648.0542234195947, 0.0, -761.5941987095399],
          [1296.1084468391894, 0.0, -1523.1883974190798],
          [1944.162670258784, 0.0, -2284.78259612862],
        ],
      },
    ];

    const tracksObj = PhoenixObjects.getTracks(trackParams);

    expect(tracksObj.name).toBe('Track');
    expect(tracksObj.type).toBe('Mesh');
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

    expect(trackParams).toMatchObject(trackObject.userData);
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

    expect(jetParams).toMatchObject(jetObject.userData);
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

    expect(hitsParamsLine).toMatchObject(hitsObjectLine.userData);
  });

  it('should create Hits of Point type from the given parameters and get it as an object', () => {
    const hitsParamsPoint = [
      {
        pos: [
          -2545.135009765625, -2425.1064453125, 7826.09912109375,
          -2545.135009765625, -1.1222461462020874, 7826.09912109375,
        ],
        type: 'Point',
      },
    ];
    const hitsObjectPoint = PhoenixObjects.getHits(hitsParamsPoint) as Points;

    expect(hitsObjectPoint.type).toBe('Points');
    expect(hitsObjectPoint.name).toBe('Hit');

    expect(hitsParamsPoint).toMatchObject(hitsObjectPoint.userData);
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

    expect(hitsParamsBox).toMatchObject(hitsObjectBox.userData);
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
    const clusterParams = {
      energy: 23.54,
      phi: 1.26548,
      eta: -0.21854,
      theta: 1.78762,
    };
    const clusterObject = PhoenixObjects.getCluster(clusterParams) as Mesh;

    expect(clusterObject.name).toBe('Cluster');
    expect(clusterObject.type).toBe('Mesh');

    expect(clusterParams).toMatchObject(clusterObject.userData);
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

    const caloCell = (({ uuid, ...o }) => o)(caloCells);

    expect(caloCellObject.userData).toMatchObject(caloCell);
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

    expect(planarCaloCellParams).toMatchObject(planarCaloCellObject.userData);
  });

  it('should create a Vertex from the given parameters and get it as an object', () => {
    const vertexParams = {
      pos: [1, 0, 0],
      color: '#000000',
    };

    const vertexObject = PhoenixObjects.getVertex(vertexParams) as Mesh;

    expect(vertexObject.name).toBe('Vertex');
    expect(vertexObject.type).toBe('Mesh');

    expect(vertexParams).toMatchObject(vertexObject.userData);
  });

  it('should get the planar calo cells from parameters and get it as an object', () => {
    const caloCellsObj = [
      {
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
      },
    ];

    const obj = PhoenixObjects.getPlanarCaloCells(caloCellsObj);

    expect(obj).toBeInstanceOf(Object3D);
    expect(obj.name).toBe('PlanarCaloCell');
    expect(obj.type).toBe('Mesh');
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

    expect(metParams).toMatchObject(metObject.userData);
  });
});
