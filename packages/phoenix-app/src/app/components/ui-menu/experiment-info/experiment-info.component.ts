import { Component, OnInit, Input } from '@angular/core';
import { EventdisplayService } from 'src/app/services/eventdisplay.service';

@Component({
  selector: 'app-experiment-info',
  templateUrl: './experiment-info.component.html',
  styleUrls: ['./experiment-info.component.scss']
})
export class ExperimentInfoComponent implements OnInit {

  experimentInfo: any[];
  @Input() experiment: string;
  @Input() experimentTagline: string;

  constructor(private eventDisplay: EventdisplayService) { }

  ngOnInit(): void {
    this.eventDisplay.instance.listenToDisplayedEventChange(() => {
      this.experimentInfo = this.eventDisplay.instance.getEventMetadata();
    });
  }

}
