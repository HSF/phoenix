import { XRManager, XRSessionType } from './xr-manager';

/**
 * AR manager for AR related operations.
 */
export class ARManager extends XRManager {
  /** Session type to use for AR. */
  static readonly SESSION_TYPE: string = 'immersive-ar';

  /**
   * Create the AR manager.
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
