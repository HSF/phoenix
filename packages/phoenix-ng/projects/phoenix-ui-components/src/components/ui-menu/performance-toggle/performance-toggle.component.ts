import { Component } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  selector: 'app-performance-toggle',
  templateUrl: './performance-toggle.component.html',
  styleUrls: ['./performance-toggle.component.scss']
})
export class PerformanceToggleComponent {
  antialiasing: boolean = false;

  constructor(private eventDisplay: EventDisplayService) { }

  toggleAntialiasing() {
    this.antialiasing = !this.antialiasing;
    this.eventDisplay.getThreeManager().setAntialiasing(this.antialiasing);
  }
}
