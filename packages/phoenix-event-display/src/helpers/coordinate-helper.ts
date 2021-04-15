import { Vector3, Quaternion } from 'three';

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
   * Applies the necessary rotations to move from threejs to experimental.
   * @param radius The radius.
   * @param theta Theta angle.
   * @param phi Phi angle.
   */
  public static sphericalToCartesian(
    radius: number,
    theta: number,
    phi: number
  ): Vector3 {
    // Threejs uses theta as azimuthal, so need to reverse.
    let vector = new Vector3();
    vector.setFromSphericalCoords(radius, theta, phi);
    vector.applyQuaternion(CoordinateHelper.atlasQuaternion());
    return vector;
  }

  public static etaPhiToCartesian(
    radius: number,
    eta: number,
    phi: number
  ): Vector3 {
    let vector = new Vector3();
    // Threejs uses theta as azimuthal, so need to reverse.
    vector.setFromSphericalCoords(radius, this.etaToTheta(eta), phi);
    vector.applyQuaternion(CoordinateHelper.atlasQuaternion());
    return vector;
  }

  public static atlasQuaternion(): Quaternion {
    // With nothing, we have eta=0 on x, and phi=0 on z
    // Should be eta=0 on y, and phi=0 on x
    const v1 = new Vector3(0, 1, 0);
    const v2 = new Vector3(0, 0, 1);
    const quaternion = new Quaternion();
    quaternion.setFromUnitVectors(v1, v2); // This puts eta~infinite on z-axis, eta=0 on  but y-positive is phi=PI (and eta=0 on x)
    const quaternion2 = new Quaternion();
    quaternion2.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2.0); // Now have eta = 3.0 on -x, eta =0 on +y, and phi = 0 on +z
    quaternion.multiply(quaternion2);
    return quaternion;
  }
}
