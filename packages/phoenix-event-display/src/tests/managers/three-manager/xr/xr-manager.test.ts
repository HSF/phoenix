/**
 * @jest-environment jsdom
 */
import { Camera, WebGLRenderer } from 'three';
import createRenderer from '../../../helpers/create-renderer';
import {
  XRManager,
  XRSessionType,
} from '../../../../../src/managers/three-manager/xr/xr-manager';

describe('XRManager', () => {
  let xrManager: XRManager;
  let renderer: WebGLRenderer;

  beforeEach(() => {
    xrManager = new XRManager(XRSessionType.AR);
    renderer = createRenderer();
  });

  afterEach(() => {
    xrManager.endXRSession();
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

    xrManager.setXRSession(renderer, onSessionStarted, onSessionEnded);
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
