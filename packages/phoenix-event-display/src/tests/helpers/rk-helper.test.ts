import { Vector3 } from 'three';
import { RKHelper } from '../../helpers/rk-helper';

describe('RKHelper', () => {
  let rkHelper: RKHelper;

  beforeEach(() => {
    rkHelper = new RKHelper();
  });

  afterEach(() => {
    rkHelper = undefined;
  });

  it('should create an instance', () => {
    expect(rkHelper).toBeTruthy();
  });

  it('should check if the extrapolation should continue', () => {
    const pos = new Vector3(0, 0, 0);
    expect(RKHelper.extrapolationLimit(pos)).toBe(true);
    pos.z = 3000;
    expect(RKHelper.extrapolationLimit(pos)).toBe(true);
    pos.z = -3000;
    expect(RKHelper.extrapolationLimit(pos)).toBe(true);

    pos.set(1000, 1000, 5000);
    expect(RKHelper.extrapolationLimit(pos)).toBe(false);
    pos.set(2000, 2000, 0);
    expect(RKHelper.extrapolationLimit(pos)).toBe(false);
  });

  it('should get extrapolated tracks using Runge-Kutta', () => {
    const trackParams = {
      TestTracks: [
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
      ],
    };

    expect(RKHelper.getTracksWithRungeKutta(trackParams)).toEqual({});
  });

  it('should extrapolate tracks using RungeKutta propagator', () => {
    const track = {
      dparams: [0, 0, 0, 0, 0],
      pos: [0, 1, 0],
    };

    const inbounds = (pos: Vector3) => {
      if (pos.z > 3000) return false;
      if (Math.sqrt(pos.x * pos.x + pos.y * pos.y) > 1100) return false;
      return true;
    };

    const pos = RKHelper.extrapolateTrackPositions(track, inbounds);

    expect(pos).toEqual([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]);
  });
});
