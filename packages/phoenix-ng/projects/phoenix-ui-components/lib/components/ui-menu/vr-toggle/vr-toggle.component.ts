import { Component } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';
import { VRManager, XRSessionType } from 'phoenix-event-display';

@Component({
  selector: 'app-vr-toggle',
  templateUrl: './vr-toggle.component.html',
  styleUrls: ['./vr-toggle.component.scss'],
})
export class VrToggleComponent {
  vrSupported: boolean = false;
  vrActive: boolean = false;

  constructor(private eventDisplay: EventDisplayService) {
    // NOTE: WebXR needs secure HTTPS context
    // Query for permissions of XR before using it (not supported by browsers yet). See https://developer.mozilla.org/en-US/docs/Web/API/Permissions/query
    (navigator as any)?.xr
      ?.isSessionSupported?.(VRManager.SESSION_TYPE)
      .then((supported: boolean) => {
        if (supported) {
          this.vrSupported = true;
        }
      })
      .catch((err: any) => console.warn('Error in VR', err));
  }

  toggleVr() {
    // If toggling VR on
    if (!this.vrActive) {
      this.eventDisplay.initXR(XRSessionType.VR, () => {
        this.vrActive = false;
        // Disable renderer XR and remove animation loop
        this.eventDisplay.endXR(XRSessionType.VR);
      });
      this.vrActive = true;
    } else {
      this.eventDisplay.endXR(XRSessionType.VR);
      this.vrActive = false;
    }
  }
}
