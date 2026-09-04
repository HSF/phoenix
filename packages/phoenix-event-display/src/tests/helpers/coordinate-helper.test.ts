import { CoordinateHelper } from '../../helpers/coordinate-helper';

describe('CoordinateHelper', () => {
  it('should accept angles within range: 0 < theta < PI and -PI < phi < PI', () => {
    // Arguments are (theta, phi) - theta is the polar angle.
    expect(CoordinateHelper.anglesAreSane(3.0, 1.0)).toBe(true);
    expect(CoordinateHelper.anglesAreSane(Math.PI / 2, 0.0)).toBe(true);
    expect(CoordinateHelper.anglesAreSane(0.1, -3.0)).toBe(true);
  });

  it('should reject a theta outside (0, PI)', () => {
    expect(CoordinateHelper.anglesAreSane(4.0, 1.0)).toBe(false);
    expect(CoordinateHelper.anglesAreSane(-0.1, 1.0)).toBe(false);
    // Boundaries are exclusive, since thetaToEta diverges at 0 and PI.
    expect(CoordinateHelper.anglesAreSane(0.0, 1.0)).toBe(false);
    expect(CoordinateHelper.anglesAreSane(Math.PI, 1.0)).toBe(false);
  });

  it('should reject a phi outside (-PI, PI)', () => {
    expect(CoordinateHelper.anglesAreSane(1.0, 4.0)).toBe(false);
    expect(CoordinateHelper.anglesAreSane(1.0, -4.0)).toBe(false);
    expect(CoordinateHelper.anglesAreSane(1.0, Math.PI)).toBe(false);
    expect(CoordinateHelper.anglesAreSane(1.0, -Math.PI)).toBe(false);
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
    expect(vector.x).toBe(0.6480542736638853);
    expect(vector.y).toBe(5.551115123125783e-17);
    expect(vector.z).toBe(0.7615941559557647);
  });

  it('should get cartesian from eta/phi parameters', () => {
    const radius = 1.0;
    const eta = 1.0;
    const phi = 0.0;
    const vector = CoordinateHelper.etaPhiToCartesian(radius, eta, phi);
    expect(vector.x).toBe(0.6480542736638853);
    expect(vector.y).toBe(5.551115123125783e-17);
    expect(vector.z).toBe(0.7615941559557647);
  });

  it('should return the Quaternion to rotate to ATLAS coordinates', () => {
    const quaternion = CoordinateHelper.atlasQuaternion();
    expect(quaternion.x).toBe(0.5);
    expect(quaternion.y).toBe(0.4999999999999999);
    expect(quaternion.z).toBe(0.4999999999999999);
    expect(quaternion.w).toBe(0.5);
  });
});
