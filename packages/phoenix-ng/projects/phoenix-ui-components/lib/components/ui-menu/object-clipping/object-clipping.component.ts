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
  clippingAngle: number;
  startClippingValue: number;

  constructor(private eventDisplay: EventDisplayService) {
    const stateManager = this.eventDisplay.getStateManager();
    stateManager.clippingEnabled.onUpdate(
      (clippingValue) => (this.clippingEnabled = clippingValue)
    );
    stateManager.clippingEnabled.onUpdate(
      (startClippingValue) => (this.clippingEnabled = startClippingValue)
    );
    stateManager.clippingAngle.onUpdate(
      (value) => (this.clippingAngle = value)
    );
  }

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
