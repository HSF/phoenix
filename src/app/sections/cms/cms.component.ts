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

  constructor(private eventDisplay: EventdisplayService, private http: HttpClient) { }

  ngOnInit(): void {

    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -12000], 'left-cube'),
      new PresetView('Center View', [-500, 12000, 0], 'top-cube'),
      new PresetView('Right View', [0, 0, 12000], 'right-cube')
    ];

    const cmsLoader = new CMSLoader(this.http);
    configuration.eventDataLoader = cmsLoader;

    this.eventDisplay.init(configuration);

    this.eventDisplay.loadGLTFGeometry('assets/geometry/CMS/cms.gltf', 'CMS detector', 400);

    cmsLoader.loadEventDataFromIg('assets/files/cms/EventData.ig', 'Event', (eventData: any) => {
      cmsLoader.putEventData(eventData);
      this.eventDisplay.buildEventDataFromJSON(cmsLoader.getEventData());
    });

  }

}
