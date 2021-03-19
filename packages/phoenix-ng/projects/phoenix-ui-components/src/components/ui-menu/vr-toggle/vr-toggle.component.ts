import { Component } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';
import { VRManager } from 'phoenix-event-display';

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
    if ('xr' in navigator) {
      (navigator as any)?.xr
        ?.isSessionSupported?.(VRManager.SESSION_TYPE)
        .then((supported: boolean) => {
          if (supported) {
            this.vrSupported = true;
          }
        });
    } // else VR not supported
  }

  toggleVr() {
    // If toggling VR on
    if (!this.vrActive) {
      this.eventDisplay.initVR(() => {
        this.vrActive = false;
        // Disable renderer XR and remove animation loop
        this.eventDisplay.endVR();
      });
      this.vrActive = true;
    } else {
      this.eventDisplay.endVR();
      this.vrActive = false;
    }
  }
}
