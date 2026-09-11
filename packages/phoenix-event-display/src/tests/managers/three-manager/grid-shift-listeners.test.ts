/**
 * @jest-environment jsdom
 */
import { ThreeManager } from '../../../managers/three-manager/index';

/**
 * These exercise the window-listener bookkeeping of `shiftCartesianGrid`
 * directly, so they do not need a WebGL context.
 */
describe('ThreeManager grid shifting listeners', () => {
  let three: any;
  let listeners: { type: string; callback: any }[];
  let origAdd: any;
  let origRemove: any;

  /** Number of listeners currently registered for a given event type. */
  const countFor = (type: string) =>
    listeners.filter((l) => l.type === type).length;

  beforeEach(() => {
    listeners = [];
    origAdd = window.addEventListener;
    origRemove = window.removeEventListener;
    window.addEventListener = jest.fn((type: string, callback: any) => {
      listeners.push({ type, callback });
    }) as any;
    window.removeEventListener = jest.fn((type: string, callback: any) => {
      const index = listeners.findIndex(
        (l) => l.type === type && l.callback === callback,
      );
      if (index >= 0) listeners.splice(index, 1);
    }) as any;

    three = Object.create(ThreeManager.prototype);
    three.shiftCartesianGridCallback = null;
    three.show3DPointsCallback = null;
    three.show3DDistanceCallback = null;
    three.mousemoveCallback = null;
    three.keydownHandler = null;
    three.shiftGrid = false;
    three.stopShifting = { emit: jest.fn() };
    three.filterRayIntersect = jest.fn();
  });

  afterEach(() => {
    window.addEventListener = origAdd;
    window.removeEventListener = origRemove;
  });

  it('should not stack up listeners over repeated shifts', () => {
    three.shiftCartesianGrid();
    three.shiftCartesianGrid();
    three.shiftCartesianGrid();

    expect(countFor('contextmenu')).toBe(1);
    expect(countFor('click')).toBe(1);
  });

  it('should remove both listeners when shifting is stopped by right click', () => {
    three.shiftCartesianGrid();
    const stopShifting = listeners.find((l) => l.type === 'contextmenu');
    stopShifting?.callback(new MouseEvent('contextmenu'));

    expect(three.stopShifting.emit).toHaveBeenCalledWith(true);
    expect(three.shiftGrid).toBe(false);
    expect(countFor('contextmenu')).toBe(0);
    expect(countFor('click')).toBe(0);
  });

  it('should remove the listeners it added on cleanup', () => {
    three.shiftCartesianGrid();
    ThreeManager.prototype.cleanup.call(three);

    expect(countFor('contextmenu')).toBe(0);
    expect(countFor('click')).toBe(0);
  });
});
