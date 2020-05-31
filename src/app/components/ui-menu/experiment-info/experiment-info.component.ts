import { Component, OnInit, Input } from '@angular/core';
import { EventdisplayService } from 'src/app/services/eventdisplay.service';

@Component({
  selector: 'app-experiment-info',
  templateUrl: './experiment-info.component.html',
  styleUrls: ['./experiment-info.component.scss']
})
export class ExperimentInfoComponent implements OnInit {

  experimentInfo: string[];
  @Input() experiment: string;
  private experimentsTagline: object = {
    'atlas': 'ATLAS Experiment at CERN',
    'lhcb': 'LHCb Experiment at CERN',
    'cms': 'CMS Experiment at the LHC, CERN'
  };

  constructor(private eventDisplay: EventdisplayService) { }

  ngOnInit(): void {
    this.eventDisplay.listenToDisplayedEventChange(() => {
      this.experimentInfo = [this.experimentsTagline[this.experiment]];
      for (const info of this.eventDisplay.getEventMetadata()) {
        this.experimentInfo.push(info);
      }
    });
  }


}
