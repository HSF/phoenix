import { Component, OnInit } from '@angular/core';
import { Configuration } from '../../services/extras/configuration.model';
import { PresetView } from '../../services/extras/preset-view.model';
import { EventdisplayService } from '../../services/eventdisplay.service';
import { HttpClient } from '@angular/common/http';
import JSZip from 'jszip';
import { CMSLoader } from '../../services/loaders/cms-loader';

@Component({
  selector: 'app-cms',
  templateUrl: './cms.component.html',
  styleUrls: ['./cms.component.scss']
})
export class CMSComponent implements OnInit {

  allEvents: string[] = [];

  constructor(private eventdisplay: EventdisplayService, private http: HttpClient) { }

  ngOnInit(): void {

    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -12000], 'left-cube'),
      new PresetView('Center View', [-500, 12000, 0], 'top-cube'),
      new PresetView('Right View', [0, 0, 12000], 'right-cube')
    ];

    const cmsLoader = new CMSLoader(this.http);
    configuration.eventDataLoader = cmsLoader;

    this.eventdisplay.init(configuration);

    cmsLoader.loadEventDataFromIg('assets/files/cms/EventData.ig', 'Event_876295434', (eventData: any) => {
      cmsLoader.putEventData(eventData);
      this.eventdisplay.buildEventDataFromJSON(cmsLoader.getEventData());
    });

  }

}
