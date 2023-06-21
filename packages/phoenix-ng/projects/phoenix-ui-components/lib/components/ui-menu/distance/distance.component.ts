import { Component } from '@angular/core';
import { EventDisplayService } from 'phoenix-ui-components';

@Component({
  selector: 'app-distance',
  templateUrl: './distance.component.html',
  styleUrls: ['./distance.component.scss'],
})
export class DistanceComponent {
  active: boolean = false;

  constructor(private eventDisplay: EventDisplayService) {}

  toggleShowDistance() {
    this.active = !this.active;
    this.eventDisplay.getUIManager().show3DDistance(this.active);
  }
}
