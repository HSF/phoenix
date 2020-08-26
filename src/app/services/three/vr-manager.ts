import { WebGLRenderer } from "three";

/**
 * VR manager for VR related operations.
 */
export class VRManager {
  /** Renderer to set the VR session for. */
  private renderer: WebGLRenderer;
  /** Currently active VR session. */
  private currentVRSession: any;
  /** Callback to call when the VR session ends. */
  private onSessionEnded: () => void;

  /**
   * Set and configure the VR session.
   * @param renderer Renderer to set the VR session for.
   * @param onSessionEnded Callback to call when the VR session ends.
   */
  public setVRSession(renderer: WebGLRenderer, onSessionEnded?: () => void) {
    this.renderer = renderer;
    this.onSessionEnded = onSessionEnded;
    const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] };
    (navigator as any)?.xr.requestSession('immersive-vr', sessionInit)
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
   * Get the current VR session if any.
   * @returns The active VR session.
   */
  public getVRSession(): any {
    return this.currentVRSession;
  }
}
