import { Component, type OnInit, type OnDestroy } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  standalone: false,
  selector: 'app-object-clipping',
  templateUrl: './object-clipping.component.html',
  styleUrls: ['./object-clipping.component.scss'],
})
export class ObjectClippingComponent implements OnInit, OnDestroy {
  clippingEnabled: boolean;
  startClippingAngle: number;
  openingClippingAngle: number;
  private unsubscribes: (() => void)[] = [];

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit() {
    const stateManager = this.eventDisplay.getStateManager();
    this.unsubscribes.push(
      stateManager.clippingEnabled.onUpdate(
        (clippingValue) => (this.clippingEnabled = clippingValue),
      ),
    );
    this.unsubscribes.push(
      stateManager.startClippingAngle.onUpdate(
        (value) => (this.startClippingAngle = value),
      ),
    );
    this.unsubscribes.push(
      stateManager.openingClippingAngle.onUpdate(
        (value) => (this.openingClippingAngle = value),
      ),
    );
  }

  ngOnDestroy() {
    this.unsubscribes.forEach((unsubscribe) => unsubscribe?.());
  }

  changeStartClippingAngle(startingAngle: number) {
    this.eventDisplay.getUIManager().rotateStartAngleClipping(startingAngle);
  }

  changeOpeningClippingAngle(openingAngle: number) {
    this.eventDisplay.getUIManager().rotateOpeningAngleClipping(openingAngle);
  }

  toggleClipping(change: MatCheckboxChange) {
    const value = change.checked;
    this.eventDisplay.getUIManager().setClipping(value);
    this.clippingEnabled = value;
  }
}
