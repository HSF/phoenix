import { Camera, Group, WebGLRenderer } from 'three';

/**
 * AR manager for AR related operations.
 */
export class ARManager {
  /** Session type to use for AR. */
  static readonly SESSION_TYPE: string = 'immersive-ar';
  /** Whether the AR is currently active or not. */
  private arActive: boolean = false;
  /** Renderer to set the AR session for. */
  private renderer: WebGLRenderer;
  /** Currently active AR session. */
  private currentARSession: any = null;
  /** Callback to call when the AR session ends. */
  private onSessionEnded: () => void;
  /** Group containing the the camera for AR. */
  public cameraGroup: Group;
  /** The camera used by AR. */
  public arCamera: Camera;

  /**
   * Set and configure the AR session.
   * @param renderer Renderer to set the AR session for.
   * @param onSessionStarted Callback to call when the AR session starts.
   * @param onSessionEnded Callback to call when the AR session ends.
   */
  public setARSession(
    renderer: WebGLRenderer,
    onSessionStarted?: () => void,
    onSessionEnded?: () => void
  ) {
    this.renderer = renderer;
    this.onSessionEnded = onSessionEnded;
    const webXR = (navigator as any)?.xr;

    (webXR?.requestSession(ARManager.SESSION_TYPE) as Promise<any>)
      .then((session: any) => {
        this.onARSessionStarted(session);
        onSessionStarted?.();
      })
      .catch((error: any) => {
        console.error('AR Error:', error);
      });
  }

  /**
   * Callback for when the AR session is started.
   * @param session The AR session.
   */
  private onARSessionStarted = async (session: any) => {
    this.arActive = true;
    session.addEventListener('end', this.onARSessionEnded);
    this.renderer.xr.setReferenceSpaceType('local');
    await this.renderer.xr.setSession(session);
    this.currentARSession = session;
  };

  /**
   * Callback when the AR session ends.
   */
  private onARSessionEnded = () => {
    this.arActive = false;
    this.currentARSession.removeEventListener('end', this.onARSessionEnded);
    this.currentARSession = null;
    this.onSessionEnded?.();
  };

  /**
   * End the current AR session.
   */
  public endARSession() {
    this.currentARSession?.end();
  }

  /**
   * Get the group containing the camera for AR.
   * AR camera works by adding a Group with Camera to the scene.
   * @param camera Camera which is to be cloned for AR use.
   * @returns The camera group used in AR mode.
   */
  public getCameraGroup(camera?: Camera): Group {
    // Set up the camera position in the AR - Adding a group with camera does it
    if (!this.cameraGroup) {
      this.cameraGroup = new Group();
    }
    if (camera && this.arActive) {
      this.arCamera = this.renderer.xr
        .getCamera(new Camera())
        .copy(camera.clone() as Camera);
      this.arCamera.name = 'AR_CAMERA';

      this.cameraGroup.position.copy(this.arCamera.position);
      this.cameraGroup.add(this.arCamera);
    }

    return this.cameraGroup;
  }
}
