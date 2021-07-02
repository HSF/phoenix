import { RungeKutta } from './runge-kutta';
import { Vector3 } from 'three';
import { CoordinateHelper } from './coordinate-helper';

/**
 * Helper methods for RungeKutta functions.
 */
export class RKHelper {
  /**
   * Function used by the extrapolator to check if the extrapolation should continue.
   * @param pos Location to be tested
   * @returns A boolean: true, if the position is in-bounds, false otherwise.
   */
  public static extrapolationLimit(pos: Vector3) {
    if (pos.z > 3000) return false;
    if (Math.sqrt(pos.x * pos.x + pos.y * pos.y) > 1100) return false;
    return true;
  }

  /**
   * Get extrapolated tracks using RungeKutta.
   * @param tracksCollectionsEvent Event containing tracks collections.
   */
  public static getTracksWithRungeKutta(tracksCollectionsEvent: any) {
    const tracksCollections = Object.assign({}, tracksCollectionsEvent);
    const Tracks = {};
    for (const tracksCollection of Object.keys(tracksCollections)) {
      for (const track of tracksCollections[tracksCollection]) {
        track.pos = RKHelper.extrapolateTrackPositions(track);
      }
    }

    return Tracks;
  }

  /**
   * Extrapolate tracks using RungeKutta propagator.
   * @param track Track which is to be extrapolated.
   * @param inbounds Function which returns true until the passed position
   * is out of bounds, when it returns false. Default is RKHelper.extrapolationLimit
   * @returns An array of track positions.

   */
  public static extrapolateTrackPositions(
    track: { dparams: any },
    inbounds: (pos: Vector3) => boolean = RKHelper.extrapolationLimit
  ): any {
    const dparams = track.dparams;
    // ATLAS uses mm, MeV
    const d0 = dparams[0];
    const z0 = dparams[1];
    const phi = dparams[2];
    let theta = dparams[3];
    const qop = dparams[4];

    if (theta < 0) {
      theta += Math.PI;
      // TODO - check if we need to flip phi here?
    }
    let p: number;
    if (qop !== 0) {
      p = Math.abs(1 / qop);
    } else {
      p = Number.MAX_VALUE;
    }
    const q = Math.round(p * qop);

    const globalMomentum = CoordinateHelper.sphericalToCartesian(p, theta, phi);

    const startPos = CoordinateHelper.sphericalToCartesian(d0, theta, phi);

    // Wipe existing positions
    const positions: number[][] = [];
    positions.push([startPos.x, startPos.y, startPos.z]);

    const startDir = globalMomentum.clone();
    startDir.normalize();

    const traj = RungeKutta.propagate(
      startPos,
      startDir,
      p,
      q,
      5,
      1500,
      inbounds
    );

    const extrapolatedPos = traj.map((val) => [
      val.pos.x,
      val.pos.y,
      val.pos.z,
    ]);

    return positions.concat(extrapolatedPos);
  }
}
