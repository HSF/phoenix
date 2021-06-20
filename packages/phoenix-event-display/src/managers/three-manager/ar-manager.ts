import { XRManager, XRSessionType } from './xr-manager';

// NOTE: This was created on 28/06/2021
// It might get outdated given how WebXR is still a work in progress

// LAST UPDATED ON 29/06/2021

/**
 * AR manager for AR related operations.
 */
export class ARManager extends XRManager {
  /** Session type to use for AR. */
  static readonly SESSION_TYPE: string = 'immersive-ar';

  /**
   * Create the AR manager.
   * @override
   */
  constructor() {
    super(XRSessionType.AR);
  }

  /**
   * Callback for when the AR session is started.
   * @override
   * @param session The AR session.
   */
  protected async onXRSessionStarted(session: any) {
    this.renderer.xr.setReferenceSpaceType('local');
    await super.onXRSessionStarted(session);
  }
}
