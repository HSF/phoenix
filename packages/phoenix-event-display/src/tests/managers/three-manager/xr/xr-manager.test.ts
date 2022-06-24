import { Camera, Group, Scene, Vector3, WebGLRenderer } from 'three';
import {
  XRManager,
  XRSessionType,
} from '../../../../../src/managers/three-manager/xr/xr-manager';

describe('XRManager', () => {
  const xrManager = new XRManager(XRSessionType.AR);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('XRManager should be created', () => {
    expect(xrManager).toBeTruthy();
  });

  it('It should get the group containing the camera for XR', () => {
    xrManager.cameraGroup = new Group();
    expect(xrManager.getCameraGroup()).toBe(xrManager.cameraGroup);
    const xrcamera = new Camera();
    xrManager.xrCamera = xrcamera;
    expect(xrManager.getXRCamera()).toBe(xrcamera);
    const cameraPosition = new Vector3(0, 0, 0.1);
    xrManager.cameraGroup.position.copy(cameraPosition);
    expect(xrManager.getCameraGroup().position).toEqual(cameraPosition);
  });

  it('It should end the current XR session', () => {
    expect(xrManager.endXRSession).toBeDefined();
  });
});
