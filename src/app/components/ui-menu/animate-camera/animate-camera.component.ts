import { Component } from '@angular/core';
import { EventdisplayService } from '../../../services/eventdisplay.service';

@Component({
  selector: 'app-animate-camera',
  templateUrl: './animate-camera.component.html',
  styleUrls: ['./animate-camera.component.scss']
})
export class AnimateCameraComponent {

  isAnimating: boolean = false;

  constructor(private eventDisplay: EventdisplayService) { }

  toggleAnimateCamera() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.eventDisplay.animateThroughEvent(
        [11976, 7262, 11927],
        3000,
        () => {
          this.isAnimating = false;
        }
      );
    }
  }

}
