import { RungeKutta } from './runge-kutta';
import { Vector3 } from 'three';
import { CoordinateHelper } from './coordinate-helper';

/**
 * Helper methods for RungeKutta functions.
 */
export class RKHelper {
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
   * is out of bounds, when it returns false. Default just always returns true.
   * @returns An array of track positions.

   */
  public static extrapolateTrackPositions(
    track: { dparams: any },
    inbounds: (pos: Vector3) => boolean = () => true
  ): any {
    const dparams = track.dparams;
    // ATLAS uses mm, MeV
    let d0 = dparams[0],
      z0 = dparams[1],
      phi = dparams[2],
      theta = dparams[3],
      qop = dparams[4];

    let p: number;
    if (qop !== 0) {
      p = Math.abs(1 / qop);
    } else {
      p = 0;
    }
    const q = Math.round(p * qop);

    let globalMomentum = CoordinateHelper.sphericalToCartesian(p, theta, phi);

    let startPos = CoordinateHelper.sphericalToCartesian(d0, theta, phi);

    // Wipe existing positions
    let positions: number[][] = [];
    positions.push([startPos.x, startPos.y, startPos.z]);

    const startDir = globalMomentum.clone();
    startDir.normalize();

    // if (p < 0.5 ){
    //   console.log("Track with very low momentum - not going to try to extrapolate.")
    //   return positions;
    // }

    const traj = RungeKutta.propagate(
      startPos,
      startDir,
      p,
      q,
      10,
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
