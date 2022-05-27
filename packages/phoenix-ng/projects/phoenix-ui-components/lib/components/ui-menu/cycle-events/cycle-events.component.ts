import { Component, Input, OnInit } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  selector: 'app-cycle-events',
  templateUrl: './cycle-events.component.html',
})
export class CycleEventsComponent implements OnInit {
  @Input()
  interval: number;

  active: boolean = false;

  private intervalId: NodeJS.Timer;

  private events: string[];

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit() {
    this.eventDisplay.listenToLoadedEventsChange(
      (events) => (this.events = events)
    );
  }

  toggleCycle() {
    this.active = !this.active;
    clearInterval(this.intervalId);

    if (this.active) {
      this.startCycleInterval();
    }
  }

  private startCycleInterval(startIndex: number = 0) {
    let index = startIndex;

    this.intervalId = setInterval(() => {
      index = index >= this.events.length ? 0 : index + 1;
      this.eventDisplay.loadEvent(this.events[index]);
    }, this.interval);
  }
}
