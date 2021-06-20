import { Camera, Group, WebGLRenderer, XRSessionInit } from 'three';

export enum XRSessionType {
  VR = 'vr',
  AR = 'ar',
}

/**
 * XR manager for XR related operations.
 */
export class XRManager {
  /** Whether the XR is currently active or not. */
  private xrActive: boolean = false;
  /** Renderer to set the XR session for. */
  private renderer: WebGLRenderer;
  /** Currently active XR session. */
  private currentXRSession: any = null;
  /** Callback to call when the XR session ends. */
  private onSessionEnded: () => void;
  /** Group containing the the camera for XR. */
  public cameraGroup: Group;
  /** The camera used by XR. */
  public xrCamera: Camera;

  /**
   * Set and configure the XR session.
   * @param sessionType Type of the session, either AR or VR.
   * @param sessionInit Other options for the session like optional features.
   * @param renderer Renderer to set the XR session for.
   * @param onSessionStarted Callback to call when the XR session starts.
   * @param onSessionEnded Callback to call when the XR session ends.
   */
  public setXRSession(
    sessionType: XRSessionType,
    sessionInit: XRSessionInit,
    renderer: WebGLRenderer,
    onSessionStarted?: () => void,
    onSessionEnded?: () => void
  ) {
    this.renderer = renderer;
    this.onSessionEnded = onSessionEnded;
    const webXR = (navigator as any)?.xr;
    const xrType = sessionType === XRSessionType.VR ? 'vr' : 'ar';

    (webXR?.requestSession(`immersive-${xrType}`, sessionInit) as Promise<any>)
      .then((session: any) => {
        onSessionStarted?.();
        this.onXRSessionStarted(session);
      })
      .catch((error: any) => {
        console.error(`${xrType.toUpperCase()} Error:`, error);
      });
  }

  /**
   * Callback for when the XR session is started.
   * @param session The XR session.
   */
  private onXRSessionStarted = async (session: any) => {
    this.xrActive = true;
    session.addEventListener('end', this.onXRSessionEnded);
    await this.renderer.xr.setSession(session);
    this.currentXRSession = session;
  };

  /**
   * Callback when the XR session ends.
   */
  private onXRSessionEnded = () => {
    this.xrActive = false;
    this.currentXRSession.removeEventListener('end', this.onXRSessionEnded);
    this.currentXRSession = null;
    this.onSessionEnded?.();
  };

  /**
   * End the current XR session.
   */
  public endXRSession() {
    this.currentXRSession?.end();
  }

  /**
   * Get the group containing the camera for XR.
   * XR camera works by adding a Group with Camera to the scene.
   * @param camera Camera which is to be cloned for XR use.
   * @returns The camera group used in XR mode.
   */
  public getCameraGroup(camera?: Camera): Group {
    // Set up the camera position in the XR - Adding a group with camera does it
    if (!this.cameraGroup) {
      this.cameraGroup = new Group();
    }
    if (camera && this.xrActive) {
      this.xrCamera = this.renderer.xr
        .getCamera(new Camera())
        .copy(camera.clone() as Camera);
      this.xrCamera.name = 'XR_CAMERA';

      this.cameraGroup.position.copy(this.xrCamera.position);
      this.cameraGroup.add(this.xrCamera);
    }

    return this.cameraGroup;
  }
}
