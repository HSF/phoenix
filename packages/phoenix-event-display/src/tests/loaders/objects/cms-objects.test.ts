import { CMSObjects } from '../../../loaders/objects/cms-objects';

describe('CMSObjects', () => {
  let cmsObjects: CMSObjects;

  beforeEach(() => {
    cmsObjects = new CMSObjects();
  });

  afterEach(() => {
    cmsObjects = undefined;
  });

  it('should create an instance', () => {
    expect(cmsObjects).toBeTruthy();
  });

  it('should process the Muon Chamber from the given parameters', () => {
    const muonChamberParams = {
      front_1: [0, 0, 0],
      front_2: [1, 0, 0],
      front_3: [1, 1, 0],
      front_4: [0, 1, 0],
      back_1: [0, 0, 1],
      back_2: [1, 0, 1],
      back_3: [1, 1, 1],
      back_4: [0, 1, 1],
    };

    const muonChamber = CMSObjects.getMuonChamber(muonChamberParams);

    expect(muonChamber.children.length).toBe(2);
    expect(muonChamber.children[0].name).toBe('MuonChamber');
    expect(muonChamber.children[0].type).toBe('Mesh');
    expect(muonChamber.children[1].type).toBe('LineSegments');

    expect(muonChamberParams).toMatchObject(muonChamber.userData);
  });
});
