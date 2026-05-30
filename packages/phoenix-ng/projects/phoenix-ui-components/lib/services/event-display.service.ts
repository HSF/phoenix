import { Injectable, NgZone } from '@angular/core';
import { EventDisplay } from 'phoenix-event-display';
import type { Configuration } from 'phoenix-event-display';

/**
 * Service for all event display related functions.
 */
@Injectable({
  providedIn: 'root',
})
export class EventDisplayService extends EventDisplay {
  /**
   * Instantiate the event display by calling the parent constructor.
   */
  constructor(private ngZone: NgZone) {
    super();
  }

  /**
   * Initialize the event display, then move only the renderer's
   * animation loop outside Angular's zone.
   *
   * `super.init()` runs inside the zone so that URL-option loading,
   * event-change callbacks and other promise/fetch work still trigger
   * Angular change detection as expected.
   *
   * Only the `requestAnimationFrame` loop (Three.js render + stats)
   * is re-registered outside the zone, preventing ~60 unnecessary
   * change-detection cycles per second.
   *
   * @param configuration Configuration used to customize different aspects.
   */
  public override init(configuration: Configuration) {
    super.init(configuration);

    // Re-register the animation loop outside Angular's zone so that
    // requestAnimationFrame no longer triggers change detection.
    this.ngZone.runOutsideAngular(() => {
      const uiLoop = () => {
        this.getUIManager().updateUI();
      };
      this.getThreeManager().setAnimationLoop(uiLoop);
    });
  }
}
