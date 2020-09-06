import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from 'src/app/services/eventdisplay.service';

@Component({
  selector: 'app-event-selector',
  templateUrl: './event-selector.component.html',
  styleUrls: ['./event-selector.component.scss']
})
export class EventSelectorComponent implements OnInit {

  // Array containing the keys of the multiple loaded events
  events: string[];

  constructor(private eventDisplay: EventdisplayService) { }

  ngOnInit() {
    this.eventDisplay.instance.listenToLoadedEventsChange((events) => this.events = events);
  }

  changeEvent(selected: any) {
    const value = selected.target.value;
    this.eventDisplay.instance.loadEvent(value);
  }
}
