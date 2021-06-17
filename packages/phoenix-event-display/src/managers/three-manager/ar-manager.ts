import { WebGLRenderer } from 'three';

/**
 * AR manager for AR related operations.
 */
export class ARManager {
  /** Session type to use for AR. */
  static readonly SESSION_TYPE: string = 'immersive-ar';
  /** Renderer to set the AR session for. */
  private renderer: WebGLRenderer;
  /** Currently active AR session. */
  private currentARSession: any = null;
  /** Callback to call when the AR session ends. */
  private onSessionEnded: () => void;

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

    if (webXR) {
      webXR
        .requestSession(ARManager.SESSION_TYPE)
        .then((session: any) => {
          this.onARSessionStarted(session);
          onSessionStarted?.();
        })
        .catch((error: any) => {
          console.log('AR Error:', error);
        });
    }
  }

  /**
   * Callback for when the AR session is started.
   * @param session The AR session.
   */
  private onARSessionStarted = async (session: any) => {
    session.addEventListener('end', this.onARSessionEnded);
    await this.renderer.xr.setSession(session);
    this.currentARSession = session;
  };

  /**
   * Callback when the AR session ends.
   */
  private onARSessionEnded = () => {
    this.currentARSession.removeEventListener('end', this.onARSessionEnded);
    this.currentARSession = null;
    this.onSessionEnded?.();
  };
}
