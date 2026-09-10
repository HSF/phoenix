/**
 * @jest-environment jsdom
 */
import { VRManager } from '../../../../managers/three-manager/xr/vr-manager';

describe('VRManager', () => {
  it('should stop the movement interval when the session ends mid-press', () => {
    jest.useFakeTimers();

    const vrManager: any = Object.create(VRManager.prototype);

    const controller = {
      position: { toArray: () => [0, 0, 0] },
      add: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    vrManager.renderer = {
      xr: {
        getController: () => controller,
        getControllerGrip: () => ({ add: jest.fn() }),
      },
    };
    vrManager.getCameraGroup = () => ({ add: jest.fn() });
    vrManager.cameraGroup = { position: { toArray: () => [0, 0, 0] } };
    vrManager.moveInDirection = jest.fn();
    vrManager.currentXRSession = { removeEventListener: jest.fn() };

    vrManager.setupVRControls();

    // The trigger is pressed, which starts the movement interval.
    vrManager.onControllerSelectStart();
    jest.advanceTimersByTime(100);
    expect(vrManager.moveInDirection).toHaveBeenCalled();

    // The session ends while the trigger is still held, so "selectend" never fires.
    vrManager.onXRSessionEnded();

    vrManager.moveInDirection.mockClear();
    jest.advanceTimersByTime(1000);

    expect(vrManager.moveInDirection).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
