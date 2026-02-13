import { Component, type OnInit, type OnDestroy } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  standalone: false,
  selector: 'app-event-selector',
  templateUrl: './event-selector.component.html',
  styleUrls: ['./event-selector.component.scss'],
})
export class EventSelectorComponent implements OnInit, OnDestroy {
  // Array containing the keys of the multiple loaded events
  events: string[];
  private unsubscribe: () => void;

  /** Prevents callbacks on destroyed component */
  private isDestroyed = false;

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit() {
    this.unsubscribe = this.eventDisplay.listenToLoadedEventsChange(
      (events) => {
        if (!this.isDestroyed) {
          this.events = events;
        }
      },
    );
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.unsubscribe?.();
  }

  changeEvent(selected: any) {
    const value = selected.target.value;
    this.eventDisplay.loadEvent(value);
  }
}
