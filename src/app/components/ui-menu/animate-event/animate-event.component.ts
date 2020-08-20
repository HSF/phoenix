import { Component } from '@angular/core';
import { EventdisplayService } from '../../../services/eventdisplay.service';

@Component({
  selector: 'app-animate-event',
  templateUrl: './animate-event.component.html',
  styleUrls: ['./animate-event.component.scss']
})
export class AnimateEventComponent {

  isAnimating: boolean = false;

  constructor(private eventDisplay: EventdisplayService) { }

  toggleAnimateEvent() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.eventDisplay.animateEventWithCollision(2000, () => {
        this.isAnimating = false;
      });
    }
  }

}
