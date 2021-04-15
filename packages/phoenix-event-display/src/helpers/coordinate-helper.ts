import { Vector3 } from 'three';

/**
 * Helper methods for coordinate conversions.
 */
export class CoordinateHelper {
  /**
   * Convert pseudorapidity eta to spherical coordinate theta.
   * See definition here: https://en.wikipedia.org/wiki/Pseudorapidity
   * @param eta Pseudorapidity eta to convert to theta.
   * @returns theta in radians
   */
  public static etaToTheta(eta: number): number {
    return 2 * Math.atan(Math.pow(Math.E, -eta));
  }

  /**
   * Convert spherical theta to pseudorapidity eta.
   * See definition here: https://en.wikipedia.org/wiki/Pseudorapidity
   * @param theta Angle in radians to convert to pseudorapidity eta.
   * @returns pseudorapidity eta
   */
  public static thetaToEta(theta: number): number {
    return -Math.log(Math.tan(theta / 2.0));
  }

  /**
   * Get cartesian from spherical parameters.
   * This should NOT be necessary - should use native threejs methods such as Vector3.setFromSpherical
   * @param radius The radius.
   * @param theta Theta angle.
   * @param phi Phi angle.
   */
  public static sphericalToCartesian(
    radius: number,
    theta: number,
    phi: number
  ): Vector3 {
    return new Vector3(
      radius * Math.cos(phi) * Math.sin(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(theta)
    );
  }
}
