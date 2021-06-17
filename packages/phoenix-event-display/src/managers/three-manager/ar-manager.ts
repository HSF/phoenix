import { WebGLRenderer, XRSessionInit } from 'three';

/**
 * AR manager for AR related operations.
 */
export class ARManager {
  /** Session type to use for AR. */
  static readonly SESSION_TYPE: string = 'immersive-ar';

  private currentARSession: any = null;

  private renderer: WebGLRenderer;

  private onSessionEnded: () => void;

  public setARSession(renderer: WebGLRenderer, onSessionEnded: () => void) {
    this.renderer = renderer;
    this.onSessionEnded = onSessionEnded;
    const webXR = (navigator as any)?.xr;

    if (webXR) {
      webXR
        .requestSession(ARManager.SESSION_TYPE)
        .then(this.onARSessionStarted);
    }
  }

  private onARSessionStarted = async (session: any) => {
    session.addEventListener('end', this.onARSessionEnded);
    await this.renderer.xr.setSession(session);
    this.currentARSession = session;
  };

  private onARSessionEnded = () => {
    this.currentARSession.removeEventListener('end', this.onARSessionEnded);
    this.currentARSession = null;
    this.onSessionEnded?.();
  };
}
