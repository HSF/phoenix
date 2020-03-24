import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from 'src/app/services/eventdisplay.service';
import { Configuration } from 'src/app/services/extras/configuration.model';

@Component({
  selector: 'app-cms',
  templateUrl: './cms.component.html',
  styleUrls: ['./cms.component.scss']
})
export class CmsComponent implements OnInit {

  constructor(protected eventDisplay: EventdisplayService) {
  }

  ngOnInit() {
    const configuration = new Configuration();
    this.eventDisplay.init(configuration);
  }

}
