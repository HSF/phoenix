import { Vector3 } from 'three';
import { RungeKutta, State } from '../../helpers/runge-kutta';

describe('RungeKutta', () => {
  let rungekutta: RungeKutta;

  beforeEach(() => {
    rungekutta = new RungeKutta();
  });

  it('should create an instance', () => {
    expect(rungekutta).toBeTruthy();
  });

  it('should perform a Runge-Kutta step for the given state', () => {
    const state = {
      pos: new Vector3(0, 0, 0),
      dir: new Vector3(1, 0, 0),
      q: 1,
      p: 1,
      unitC: 1,
      stepSize: 1,
      maxStepSize: 1,
      pathLength: 0,
    } as State;

    const stepSize = RungeKutta.step(state);

    expect(stepSize).toBe(0.03125);
  });

  it('should propagate using the given properties by performing the Runge-Kutta steps', () => {
    const startPos = new Vector3(0, 0, 0);
    const startDir = new Vector3(1, 0, 0);
    const p = 1;
    const q = 1;
    const mss = -1;
    const plength = 1000;
    const inbounds = () => true;

    const result = RungeKutta.propagate(
      startPos,
      startDir,
      p,
      q,
      mss,
      plength,
      inbounds
    );

    expect(result.length).toBe(8192);

    expect(result[0].pos.x).toBeCloseTo(0.12196117095296723);
    expect(result[0].pos.y).toBeCloseTo(-0.00446839460068735);
    expect(result[0].pos.z).toBeCloseTo(0);

    expect(result[0].dir.x).toBeCloseTo(0.9973189374974512);
    expect(result[0].dir.y).toBeCloseTo(-0.07317743442452403);
    expect(result[0].dir.z).toBeCloseTo(0);
  });
});
