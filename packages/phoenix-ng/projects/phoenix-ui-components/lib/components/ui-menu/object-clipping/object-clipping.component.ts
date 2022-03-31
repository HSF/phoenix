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
  startClippingAngle: number;
  openingClippingAngle: number;

  constructor(private eventDisplay: EventDisplayService) {
    const stateManager = this.eventDisplay.getStateManager();
    stateManager.clippingEnabled.onUpdate(
      (clippingValue) => (this.clippingEnabled = clippingValue)
    );
    stateManager.startClippingAngle.onUpdate(
      (value) => (this.startClippingAngle = value)
    );
    stateManager.openingClippingAngle.onUpdate(
      (value) => (this.openingClippingAngle = value)
    );
  }

  changeStartClippingAngle(change: MatSliderChange) {
    const startingAngle = change.value;
    this.eventDisplay.getUIManager().rotateStartAngleClipping(startingAngle);
  }

  changeOpeningClippingAngle(change: MatSliderChange) {
    const openingAngle = change.value;
    this.eventDisplay.getUIManager().rotateOpeningAngleClipping(openingAngle);
  }

  toggleClipping(change: MatCheckboxChange) {
    const value = change.checked;
    this.eventDisplay.getUIManager().setClipping(value);
    this.clippingEnabled = value;
  }
}
