import { WebGLRenderer, Group, Camera, Vector3, Matrix4 } from "three";

/**
 * VR manager for VR related operations.
 */
export class VRManager {
  /** Session type to use for VR. */
  static readonly SESSION_TYPE: string = 'immersive-vr';
  /** Renderer to set the VR session for. */
  private renderer: WebGLRenderer;
  /** Currently active VR session. */
  private currentVRSession: any = null;
  /** Callback to call when the VR session ends. */
  private onSessionEnded: () => void;
  /** Group containing the the camera for VR. */
  public cameraGroup: Group;

  /**
   * Set and configure the VR session.
   * @param renderer Renderer to set the VR session for.
   * @param onSessionEnded Callback to call when the VR session ends.
   */
  public setVRSession(renderer: WebGLRenderer, onSessionEnded?: () => void) {
    this.renderer = renderer;
    this.onSessionEnded = onSessionEnded;
    const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] };
    (navigator as any)?.xr.requestSession(VRManager.SESSION_TYPE, sessionInit)
      .then(this.onVRSessionStarted);
  }

  /**
   * Callback for when the VR session is started.
   * @param session The VR session.
   */
  private onVRSessionStarted = (session: any) => {
    session.addEventListener('end', this.onVRSessionEnded);
    this.renderer.xr.setSession(session);
    this.currentVRSession = session;
  }

  /**
   * Callback when the VR session ends.
   */
  private onVRSessionEnded = () => {
    this.currentVRSession.removeEventListener('end', this.onVRSessionEnded);
    this.currentVRSession = null;
    this.onSessionEnded?.();
  }

  /**
   * End the current VR session.
   */
  public endVRSession() {
    this.currentVRSession?.end();
  }

  /**
   * Get the group containing the camera for VR.
   * @param camera Camera to be added in the group.
   */
  public getCameraGroup(camera?: Camera) {
    // Set up the camera position in the VR - Adding a group with camera does it
    if (!this.cameraGroup) {
      this.cameraGroup = new Group();
    }
    if (camera) {
      this.cameraGroup.position.copy(camera.position);
      this.cameraGroup.add(camera);
    }
    return this.cameraGroup;
  }
}
