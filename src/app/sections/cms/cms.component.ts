import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from 'src/app/services/eventdisplay.service';
import { Configuration } from 'src/app/services/extras/configuration.model';
import { CMSLoader } from 'src/app/services/loaders/cms/cms-loader';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-cms',
  templateUrl: './cms.component.html',
  styleUrls: ['./cms.component.scss']
})
export class CmsComponent implements OnInit {

  constructor(protected eventDisplay: EventdisplayService, private http: HttpClient) {
  }

  ngOnInit() {
    const configuration = new Configuration();
    configuration.eventDataLoader = new CMSLoader();
    this.eventDisplay.init(configuration);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/CMS/cms.gltf', 'CMS detector');
    this.http.get('assets/files/event_data/Event_876295434', { responseType: 'text' })
      .subscribe((res: string) => this.loadCMSEvent(res));
  }

  private loadCMSEvent(content: string) {
    const eventData = this.cleanUpEventData(content);
    const eventsData = { Event_V2: eventData };
    this.eventDisplay.parsePhoenixEvents(eventsData);
  }

  private cleanUpEventData(eventData: string): any {
    // rm non-standard json bits
    // newer files will not have this problem
    eventData = eventData.replace(/\(/g, '[')
      .replace(/\)/g, ']')
      .replace(/\'/g, '"')
      .replace(/nan/g, '0');

    const json = JSON.parse(eventData);
    return json;
  }

}
