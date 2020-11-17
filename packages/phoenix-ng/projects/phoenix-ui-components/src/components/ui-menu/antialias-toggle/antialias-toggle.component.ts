import { Component } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  selector: 'app-antialias-toggle',
  templateUrl: './antialias-toggle.component.html',
  styleUrls: ['./antialias-toggle.component.scss']
})
export class AntialiasToggleComponent {
  antialiasing: boolean = false;

  constructor(private eventDisplay: EventDisplayService) { }

  toggleAntialiasing() {
    this.antialiasing = !this.antialiasing;
    this.eventDisplay.getThreeManager().setAntialiasing(this.antialiasing);
  }
}
