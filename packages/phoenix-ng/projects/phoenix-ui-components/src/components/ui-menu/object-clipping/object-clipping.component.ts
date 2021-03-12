import { Component } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  selector: 'app-object-clipping',
  templateUrl: './object-clipping.component.html',
  styleUrls: ['./object-clipping.component.scss'],
})
export class ObjectClippingComponent {
  clippingEnabled: boolean;

  constructor(private eventDisplay: EventDisplayService) {}

  changeClippingAngle(change: MatSliderChange) {
    const angle = change.value;
    this.eventDisplay.getUIManager().rotateClipping(angle);
  }

  toggleClipping(change: MatCheckboxChange) {
    const value = change.checked;
    this.eventDisplay.getUIManager().setClipping(value);
    this.clippingEnabled = value;
  }
}
