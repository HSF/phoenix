import { Component } from '@angular/core';
import { ThreeService } from '../../../services/three.service';
import { WebGLRenderer } from 'three';

@Component({
  selector: 'app-vr-toggle',
  templateUrl: './vr-toggle.component.html',
  styleUrls: ['./vr-toggle.component.scss']
})
export class VrToggleComponent {

  vrSupported: boolean = false;
  vrActive: boolean = false;

  private currentVRSession: any;

  constructor(private three: ThreeService) {
    // NOTE: WebXR needs secure HTTPS context
    if ('xr' in navigator) {
      (navigator as any)?.xr.isSessionSupported('immersive-vr')
        .then((supported: boolean) => {
          if (supported) {
            this.vrSupported = true;
          }
        });
    } // else VR not supported
  }

  toggleVr() {
    // If toggling VR on
    if (!this.vrActive && !this.currentVRSession) {
      const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor'] };
      (navigator as any)?.xr.requestSession('immersive-vr', sessionInit)
        .then(this.onSessionStarted);
    }

    this.vrActive = !this.vrActive;
  }

  private onSessionStarted = (session: any) => {
    session.addEventListener('end', this.onSessionEnded);
    this.three.getActiveRenderer().xr.setSession(session);
    this.currentVRSession = session;
  }

  private onSessionEnded = () => {
    this.currentVRSession.removeEventListener('end', this.onSessionEnded);
    this.currentVRSession = null;
    this.vrActive = false;
  }
}
