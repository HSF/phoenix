import { Component } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  selector: 'app-auto-rotate',
  templateUrl: './auto-rotate.component.html',
  styleUrls: ['./auto-rotate.component.scss'],
})
export class AutoRotateComponent {
  autoRotate = false;

  constructor(private eventDisplay: EventDisplayService) {}

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    this.eventDisplay.getUIManager().setAutoRotate(this.autoRotate);
  }
}
