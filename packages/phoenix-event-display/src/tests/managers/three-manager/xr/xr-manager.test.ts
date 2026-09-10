/**
 * @jest-environment jsdom
 */
import { PerspectiveCamera } from 'three';
import {
  XRManager,
  XRSessionType,
} from '../../../../../src/managers/three-manager/xr/xr-manager';
import THREE from '../../../helpers/webgl-mock';

describe('XRManager', () => {
  let xrManager: XRManager;

  beforeEach(() => {
    xrManager = new XRManager(XRSessionType.AR);
  });

  afterEach(() => {
    xrManager.endXRSession();
    xrManager = undefined;
  });

  it('should create an instance of XRManager', () => {
    expect(xrManager).toBeTruthy();
  });

  it('should set and configure the XR session', () => {
    jest
      .spyOn(xrManager as any, 'onXRSessionStarted')
      .mockImplementation(jest.fn());
    const onSessionStarted = jest.fn();
    const onSessionEnded = jest.fn();
    const requestSessionSpy = jest.fn().mockResolvedValue(Promise.resolve({}));

    Object.defineProperty(window.navigator, 'xr', {
      value: {
        requestSession: requestSessionSpy,
      },
    });

    xrManager.setXRSession(
      new THREE.WebGLRenderer(),
      onSessionStarted,
      onSessionEnded,
    );
    expect(requestSessionSpy).toHaveBeenCalled();
  });

  it('should get the group containing the camera for XR', () => {
    xrManager.xrCamera = new PerspectiveCamera();
    const cameraGroup = xrManager.getCameraGroup(xrManager.xrCamera);
    expect(cameraGroup.type).toBe('Group');
  });

  it('should get the camera used by XR', () => {
    const camera = new PerspectiveCamera();
    xrManager.xrCamera = camera;
    expect(xrManager.getXRCamera()).toBe(camera);
  });

  describe('when the session ends', () => {
    /** Minimal stand-in for an XRSession, which jsdom does not provide. */
    class FakeSession {
      listeners: { [type: string]: (() => void)[] } = {};
      addEventListener(type: string, callback: () => void) {
        (this.listeners[type] ||= []).push(callback);
      }
      removeEventListener(type: string, callback: () => void) {
        const forType = this.listeners[type] ?? [];
        const index = forType.indexOf(callback);
        if (index >= 0) forType.splice(index, 1);
      }
      /** End the session the way the headset or `endXRSession` does. */
      end() {
        (this.listeners['end'] ?? []).slice().forEach((callback) => callback());
      }
    }

    let session: FakeSession;

    beforeEach(async () => {
      session = new FakeSession();
      (xrManager as any).renderer = { xr: { setSession: jest.fn() } };
      await (xrManager as any).onXRSessionStarted(session);
    });

    it('should remove the end listener it added', () => {
      session.end();
      expect(session.listeners['end']).toHaveLength(0);
    });

    it('should notify the caller that the session ended', () => {
      const onSessionEnded = jest.fn();
      (xrManager as any).onSessionEnded = onSessionEnded;
      session.end();
      expect(onSessionEnded).toHaveBeenCalledTimes(1);
    });

    it('should not throw or notify twice when ended again', () => {
      const onSessionEnded = jest.fn();
      (xrManager as any).onSessionEnded = onSessionEnded;
      session.end();
      expect(() => session.end()).not.toThrow();
      expect(onSessionEnded).toHaveBeenCalledTimes(1);
    });
  });
});
