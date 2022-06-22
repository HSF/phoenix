import { CoordinateHelper } from '../../helpers/coordinate-helper';

describe('CoordinateHelper', () => {
  it('should check if angles are within range: -PI < phi < PI and 0 < theta < 2PI', () => {
    const phi = 1.0;
    const theta = 3.0;
    expect(CoordinateHelper.anglesAreSane(phi, theta)).toBe(true);
  });

  it('should convert pseudorapidity eta to spherical coordinate theta', () => {
    const eta = 1.0;
    const theta = CoordinateHelper.etaToTheta(eta);
    expect(theta).toBe(0.705026843555238);
  });

  it('should convert spherical theta to pseudorapidity eta', () => {
    const theta = 0.705026843555238;
    const eta = CoordinateHelper.thetaToEta(theta);
    expect(eta).toBe(1.0);
  });

  it('should get cartesian from spherical parameters', () => {
    const radius = 1.0;
    const theta = 0.705026843555238;
    const phi = 0.0;
    const vector = CoordinateHelper.sphericalToCartesian(radius, theta, phi);
    expect(vector.x).toBe(0.6480542736638852);
    expect(vector.y).toBe(-1.3183898417423734e-16);
    expect(vector.z).toBe(0.7615941559557646);
  });

  it('should get cartesian from eta/phi parameters', () => {
    const radius = 1.0;
    const eta = 1.0;
    const phi = 0.0;
    const vector = CoordinateHelper.etaPhiToCartesian(radius, eta, phi);
    expect(vector.x).toBe(0.6480542736638852);
    expect(vector.y).toBe(-1.3183898417423734e-16);
    expect(vector.z).toBe(0.7615941559557646);
  });

  it('should return the Quaternion to rotate to ATLAS coordinates', () => {
    const quaternion = CoordinateHelper.atlasQuaternion();
    expect(quaternion.x).toBe(0.5);
    expect(quaternion.y).toBe(0.4999999999999999);
    expect(quaternion.z).toBe(0.4999999999999999);
    expect(quaternion.w).toBe(0.5);
  });
});
