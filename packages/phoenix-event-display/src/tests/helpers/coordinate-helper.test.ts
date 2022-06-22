import { Vector3, Quaternion } from 'three';
import { CoordinateHelper } from '../../helpers/coordinate-helper';
jest.mock('../../helpers/coordinate-helper');

describe('CoordinateHelper', () => {
  let coordinateHelper: CoordinateHelper;
  const mockAnglesAreSane = jest.fn();
  const mockEtaToTheta = jest.fn();
  const mockThetaToEta = jest.fn();
  const mockSphericalToCartesian = jest.fn();
  const mockEtaPhiToCartesian = jest.fn();
  const mockAtlasQuaternion = jest.fn();

  beforeEach(() => {
    coordinateHelper = new CoordinateHelper();
    CoordinateHelper.anglesAreSane = mockAnglesAreSane;
    CoordinateHelper.etaToTheta = mockEtaToTheta;
    CoordinateHelper.thetaToEta = mockThetaToEta;
    CoordinateHelper.sphericalToCartesian = mockSphericalToCartesian;
    CoordinateHelper.etaPhiToCartesian = mockEtaPhiToCartesian;
    CoordinateHelper.atlasQuaternion = mockAtlasQuaternion;
  });

  it('should create an instance', () => {
    expect(coordinateHelper).toBeTruthy();
  });

  it('check if angles are within range', () => {
    const expected: boolean = true;
    mockAnglesAreSane.mockReturnValue(expected);
    const result = CoordinateHelper.anglesAreSane(-Math.PI, 0);
    expect(result).toEqual(expected);
    expect(mockAnglesAreSane).toHaveBeenCalled();
    const result2 = CoordinateHelper.anglesAreSane(0, Math.PI);
    expect(result2).toEqual(expected);
    expect(mockAnglesAreSane).toHaveBeenCalled();
    expect(mockAnglesAreSane).toHaveBeenCalledTimes(2);
  });

  it('convert pseudorapidity eta to spherical coordinate theta', () => {
    const expected = 0;
    mockEtaToTheta.mockReturnValue(expected);
    const result = CoordinateHelper.etaToTheta(0);
    expect(result).toEqual(expected);
    expect(mockEtaToTheta).toHaveBeenCalled();
  });

  it('convert spherical theta to pseudorapidity eta', () => {
    const expected = 0;
    mockThetaToEta.mockReturnValue(expected);
    const result = CoordinateHelper.thetaToEta(0);
    expect(result).toEqual(expected);
    expect(mockThetaToEta).toHaveBeenCalled();
  });
  it('get cartesian from spherical parameters', () => {
    const expected = new Vector3();
    mockSphericalToCartesian.mockReturnValue(expected);
    const result = CoordinateHelper.sphericalToCartesian(0, 0, 0);
    expect(result).toEqual(expected);
    expect(mockSphericalToCartesian).toHaveBeenCalled();
  });

  it('get cartesian from eta/phi parameters', () => {
    const expected = new Vector3();
    mockEtaPhiToCartesian.mockReturnValue(expected);
    const result = CoordinateHelper.etaPhiToCartesian(0, 0, 0);
    expect(result).toEqual(expected);
    expect(mockEtaPhiToCartesian).toHaveBeenCalled();
  });

  it('get atlas quaternion', () => {
    const expected = new Quaternion();
    mockAtlasQuaternion.mockReturnValue(expected);
    const result = CoordinateHelper.atlasQuaternion();
    expect(result).toEqual(expected);
    expect(mockAtlasQuaternion).toHaveBeenCalled();
  });
});
