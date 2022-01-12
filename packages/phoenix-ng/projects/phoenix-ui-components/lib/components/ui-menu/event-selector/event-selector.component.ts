import { Component, OnInit } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  selector: 'app-event-selector',
  templateUrl: './event-selector.component.html',
  styleUrls: ['./event-selector.component.scss'],
})
export class EventSelectorComponent implements OnInit {
  // Array containing the keys of the multiple loaded events
  events: string[];

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit() {
    this.eventDisplay.listenToLoadedEventsChange(
      (events) => (this.events = events)
    );
  }

  changeEvent(selected: any) {
    const value = selected.target.value;
    this.eventDisplay.loadEvent(value);
  }
}
