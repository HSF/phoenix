/**
 * @jest-environment jsdom
 */
import THREE, { Camera, WebGLRenderer } from 'three';
import {
  XRManager,
  XRSessionType,
} from '../../../../../src/managers/three-manager/xr/xr-manager';

jest.mock('three', () => {
  const THREE = jest.requireActual('three');
  return {
    ...THREE,
    WebGLRenderer: jest.fn().mockReturnValue({
      domElement: document.createElement('div'), // create a fake div
      setSize: jest.fn(),
      render: jest.fn(),
    }),
  };
});

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
      onSessionEnded
    );
    expect(requestSessionSpy).toHaveBeenCalled();
  });

  it('should get the group containing the camera for XR', () => {
    xrManager.xrCamera = new Camera();
    const cameraGroup = xrManager.getCameraGroup(xrManager.xrCamera);
    expect(cameraGroup.type).toBe('Group');
  });

  it('should get the camera used by XR', () => {
    const camera = new Camera();
    xrManager.xrCamera = camera;
    expect(xrManager.getXRCamera()).toBe(camera);
  });
});
