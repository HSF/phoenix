/**
 * @jest-environment jsdom
 */
import { ThreeManager } from '../../../managers/three-manager';

/**
 * Render pausing must be REFERENCE COUNTED. Two overlapping natural-language
 * requests each pause and resume around their own inference; with a boolean
 * flag the first one to finish resumes the render loop while the second is
 * still running on the GPU, silently removing the protection that stops the
 * OS GPU watchdog from resetting the driver (the ~2 s blackout).
 */
describe('ThreeManager: render pause is reference counted', () => {
  function makeManager() {
    const loops: (null | (() => void))[] = [];
    const tm = Object.create(ThreeManager.prototype) as any;
    tm.rendererManager = {
      getMainRenderer: () => ({
        setAnimationLoop: (fn: any) => loops.push(fn),
      }),
    };
    tm.animationLoop = () => undefined;
    tm.renderPauseCount = 0;
    return { tm, loops };
  }

  it('stays paused until every overlapping pause has resumed', () => {
    const { tm, loops } = makeManager();
    tm.pauseRendering(); // request A starts
    tm.pauseRendering(); // request B starts while A is still running
    expect(loops).toEqual([null]); // paused once

    tm.resumeRendering(); // A finishes: B is STILL running, must stay paused
    expect(loops).toEqual([null]);

    tm.resumeRendering(); // B finishes: now it is safe to resume
    expect(loops.length).toBe(2);
    expect(typeof loops[1]).toBe('function');
  });

  it('an extra resume never leaves the counter negative', () => {
    const { tm, loops } = makeManager();
    tm.resumeRendering(); // stray resume with nothing paused
    expect(loops).toEqual([]);
    tm.pauseRendering();
    tm.resumeRendering();
    expect(loops.length).toBe(2);
  });
});
