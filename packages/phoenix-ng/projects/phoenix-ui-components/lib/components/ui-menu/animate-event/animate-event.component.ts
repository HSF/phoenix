import { Component } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  selector: 'app-animate-event',
  templateUrl: './animate-event.component.html',
  styleUrls: ['./animate-event.component.scss'],
})
export class AnimateEventComponent {
  isAnimating: boolean = false;

  constructor(private eventDisplay: EventDisplayService) {}

  toggleAnimateEvent() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.eventDisplay.animateEventWithCollision(10000, () => {
        this.isAnimating = false;
      });
    }
  }
}
