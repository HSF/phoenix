import { Component, OnInit, Input } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  selector: 'app-experiment-info',
  templateUrl: './experiment-info.component.html',
  styleUrls: ['./experiment-info.component.scss'],
})
export class ExperimentInfoComponent implements OnInit {
  experimentInfo: any[];
  @Input() url: string;
  @Input() logo: string;
  @Input() tagline: string;

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit(): void {
    this.eventDisplay.listenToDisplayedEventChange(() => {
      this.experimentInfo = this.eventDisplay.getEventMetadata();
    });
  }
}
