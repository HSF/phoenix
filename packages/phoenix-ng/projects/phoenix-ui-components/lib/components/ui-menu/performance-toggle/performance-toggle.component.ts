import { Component } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  selector: 'app-performance-toggle',
  templateUrl: './performance-toggle.component.html',
  styleUrls: ['./performance-toggle.component.scss'],
})
export class PerformanceToggleComponent {
  performanceMode: boolean = false;

  constructor(private eventDisplay: EventDisplayService) {}

  togglePerformance() {
    this.performanceMode = !this.performanceMode;
    this.eventDisplay.getThreeManager().setAntialiasing(!this.performanceMode);
  }
}
