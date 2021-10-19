import { Component } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';
import { ARManager, XRSessionType } from 'phoenix-event-display';

@Component({
  selector: 'app-ar-toggle',
  templateUrl: './ar-toggle.component.html',
  styleUrls: ['./ar-toggle.component.scss'],
})
export class ArToggleComponent {
  arSupported: boolean = false;
  arActive: boolean = false;

  constructor(private eventDisplay: EventDisplayService) {
    // NOTE: WebXR needs secure HTTPS context
    // Query for permissions of XR before using it (not supported by browsers yet). See https://developer.mozilla.org/en-US/docs/Web/API/Permissions/query
    (navigator as any).xr
      ?.isSessionSupported?.(ARManager.SESSION_TYPE)
      .then((supported: boolean) => {
        if (supported) {
          this.arSupported = true;
        }
      })
      .catch((err: any) => console.warn('Error in AR', err));
  }

  toggleAr(enableDomOverlay: boolean = true) {
    ARManager.enableDomOverlay = enableDomOverlay;

    // If toggling AR on
    if (!this.arActive) {
      this.eventDisplay.initXR(XRSessionType.AR, () => {
        this.arActive = false;
        // Disable renderer XR and remove animation loop
        this.eventDisplay.endXR(XRSessionType.AR);
      });
      this.arActive = true;
    } else {
      this.eventDisplay.endXR(XRSessionType.AR);
      this.arActive = false;
    }
  }
}
