import { Component, Input, type OnInit } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';
import { FileLoaderService } from '../../../services/file-loader.service';

@Component({
  selector: 'app-cycle-events',
  templateUrl: './cycle-events.component.html',
  styleUrls: ['./cycle-events.component.scss'],
})
export class CycleEventsComponent implements OnInit {
  @Input() interval: number;
  @Input() tooltip: string;
  @Input() icon: string;

  // There are actually 3 states we go through when clicking this component :
  //  - not active : so we are not cycling throught events
  //  - active and not reloading : cycling over the events stored in events
  //  - active and reloading : cycling and reloading the events when reaching the end
  // Last state is useful e.g. for live feed of events
  active: boolean = false;
  reloading: boolean = false;

  private intervalId: NodeJS.Timeout;

  private events: string[];

  constructor(
    private eventDisplay: EventDisplayService,
    private fileLoader: FileLoaderService,
  ) {}

  ngOnInit() {
    this.eventDisplay.listenToLoadedEventsChange((events) => {
      this.events = events;
      if (this.active) {
        // restart cycling from first event
        clearInterval(this.intervalId);
        this.startCycleInterval();
      }
    });
  }

  toggleCycle() {
    this.reloading = this.active && !this.reloading;
    this.active = !this.active || this.reloading;
    console.log(this.active, this.reloading);
    clearInterval(this.intervalId);
    if (this.active) {
      this.startCycleInterval();
    }
  }

  private startCycleInterval(startIndex: number = 0) {
    // load immediately first event
    let index = startIndex;
    this.eventDisplay.loadEvent(this.events[index]);
    index = index + 1 >= this.events.length ? -1 : index + 1;
    // launch automatic cycling
    this.intervalId = setInterval(() => {
      // special value -1 is used to denote wrapping of the current set of events
      if (index == -1) {
        if (this.reloading) {
          // reload the current events, ignoring caches
          this.fileLoader.reloadLastEvents(this.eventDisplay);
        }
        // put back index to 0 to start with first event anyway
        index = 0;
      }
      this.eventDisplay.loadEvent(this.events[index]);
      index = index + 1 >= this.events.length ? -1 : index + 1;
    }, this.interval);
  }
}
