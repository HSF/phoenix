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
    expect(RKHelper.extrapolationLimit(pos)).toBeTruthy();
    pos.z = 3000;
    expect(RKHelper.extrapolationLimit(pos)).toBeTruthy();
    pos.z = -3000;
    expect(RKHelper.extrapolationLimit(pos)).toBeTruthy();

    pos.set(1000, 1000, 0);
    expect(RKHelper.extrapolationLimit(pos)).toBeFalsy();
    pos.set(0, 1000, 0);
    expect(RKHelper.extrapolationLimit(pos)).toBeTruthy();
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
