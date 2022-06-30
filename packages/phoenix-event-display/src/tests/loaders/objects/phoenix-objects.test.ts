import { PhoenixObjects } from '../../../loaders/objects/phoenix-objects';

describe('PhoenixObjects', () => {
  let phoenixObjects: PhoenixObjects;

  beforeEach(() => {
    phoenixObjects = new PhoenixObjects();
  });

  it('should create an instance', () => {
    expect(phoenixObjects).toBeTruthy();
  });

  it('should process the Track from the given parameters (and positions)', () => {
    const trackParams = {
      pos: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      dparams: [[1, 0, 0, 3]],
      indices: [0, 1, 2],
    };

    const track = PhoenixObjects.getTrack(trackParams);
    expect(track).toBeTruthy();
  });

  it('should process the Jet from the given parameters and get it as a geometry', () => {
    const jetParams = {
      eta: 1,
      phi: 1,
      theta: 1,
      energy: 1,
      et: 1,
      coneR: 1,
      color: '#000000',
    };

    const jet = PhoenixObjects.getJet(jetParams);
    expect(jet).toBeTruthy();
  });

  it('should process the Hits from the given parameters and get them as a geometry', () => {
    const hitParams = {
      pos: [0, 0, 0],
      dparams: [1, 0, 0],
      indices: [0, 1, 2],
    };

    const hit = PhoenixObjects.getHits(hitParams);
    expect(hit).toBeTruthy();
  });

  it('should process the Cluster from the given parameters and get it as a geometry', () => {
    const clusterParams = {};
    const cluster = PhoenixObjects.getCluster(clusterParams);
    expect(cluster).toBeTruthy();
  });

  it('should process the CaloCell from the given parameters and get it as a geometry', () => {
    const caloCells = {
      energy: 1,
      phi: 1,
      eta: 1,
      theta: 1,
      uuid: 'test',
    };

    const caloCell = PhoenixObjects.getCaloCell(caloCells);
    expect(caloCell).toBeTruthy();
  });

  it('should process the PlanarCaloCell from the given parameters and get it as a geometry', () => {
    const planarCaloCellParams = {
      pos: [0, 0, 0],
      cellSize: 1,
      plane: [1, 0, 0],
      energy: 1,
      phi: 0,
      eta: 0,
      theta: 0,
      color: '#000000',
    };

    const planarCaloCell =
      PhoenixObjects.getPlanarCaloCell(planarCaloCellParams);
    expect(planarCaloCell).toBeTruthy();
  });

  it('should process the Vertex from the given parameters and get it as a geometry', () => {
    const vertexParams = {
      x: 0,
      y: 0,
      z: 0,
      color: '#000000',
    };

    const vertex = PhoenixObjects.getVertex(vertexParams);
    expect(vertex).toBeTruthy();
  });

  it('should process the Vertex from the given parameters and get it as a geometry  with a uuid', () => {
    const metParams = {
      etx: 0,
      ety: 0,
      etz: 0,
      color: '#000000',
    };

    const met = PhoenixObjects.getMissingEnergy(metParams);
    expect(met).toBeTruthy();
  });
});
