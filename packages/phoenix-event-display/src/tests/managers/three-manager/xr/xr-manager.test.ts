/**
 * @jest-environment jsdom
 */
import { Camera, Group, Vector3, WebGLRenderer } from 'three';
import {
  XRManager,
  XRSessionType,
} from '../../../../../src/managers/three-manager/xr/xr-manager';

describe('XRManager', () => {
  const xrManager = new XRManager(XRSessionType.AR);
  let renderer: WebGLRenderer;

  it('should create an instance of XRManager', () => {
    expect(xrManager).toBeTruthy();
  });

  it('should set and configure the XR session', () => {
    const onSessionStarted = () => {};
    const onSessionEnded = () => {};
    xrManager.setXRSession(renderer, onSessionStarted, onSessionEnded);
  });

  it('should get the group containing the camera for XR', () => {
    if (xrManager.cameraGroup == undefined) {
      xrManager.cameraGroup = new Group();
    }
    expect(xrManager.getCameraGroup()).toEqual(xrManager.cameraGroup);

    const xrcamera = new Camera();
    xrManager.xrCamera = xrcamera;
    expect(xrManager.getXRCamera()).toEqual(xrcamera);

    const cameraPosition = XRSessionType.AR
      ? xrcamera.position
      : new Vector3(0, 0, 0.1);
    xrManager.cameraGroup.position.copy(cameraPosition);
    xrManager.cameraGroup.add(xrcamera);

    expect(xrManager.getCameraGroup()).toEqual(xrManager.cameraGroup);
    expect(xrManager.getCameraGroup().position).toEqual(cameraPosition);
    expect(xrManager.getCameraGroup().children[0]).toEqual(xrcamera);
  });

  it('should end the current XR session', () => {
    expect(xrManager.endXRSession()).toBeUndefined();
  });
});
