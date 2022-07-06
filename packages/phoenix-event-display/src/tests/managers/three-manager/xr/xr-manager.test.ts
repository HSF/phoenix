/**
 * @jest-environment jsdom
 */
import { Camera, Group, Vector3, WebGLRenderer } from 'three';
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
