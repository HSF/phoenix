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

  CycleEntry: string = 'Cycle through';
  timeoutID: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.eventDisplay.listenToLoadedEventsChange((events) => {
      this.events = events;
      this.events.push(this.CycleEntry);
    });
  }

  cycleEvents(index: number) {
    // Cycle back to begining in case we've reached the end of the event list
    if (index >= this.events.length) index = 0;
    // prepare next cycle
    this.timeoutID = setTimeout(() => {
      this.cycleEvents(index + 1);
    }, 5000);
    // display new event
    this.eventDisplay.loadEvent(this.events[index]);
  }

  changeEvent(selected: any) {
    // stop cycling in case
    if (this.timeoutID) {
      clearTimeout(this.timeoutID);
      this.timeoutID = undefined;
    }
    const value = selected.target.value;
    if (value == this.CycleEntry) {
      this.cycleEvents(0);
    } else {
      this.eventDisplay.loadEvent(value);
    }
  }
}
