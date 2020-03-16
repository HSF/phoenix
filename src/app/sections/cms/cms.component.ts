import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from '../../services/eventdisplay.service';
import { Configuration } from '../../services/extras/configuration.model';
import { PresetView } from '../../services/extras/preset-view.model';
import { HttpClient } from '@angular/common/http';
import { Scene } from 'three';
import { CMSLoader } from '../../services/loaders/cms-loader';


@Component({
  selector: 'app-cms',
  templateUrl: './cms.component.html',
  styleUrls: ['./cms.component.scss']
})
export class CMSComponent implements OnInit {
  events: any;
  loader: CMSLoader;
  selectedObject: any;
  scene: Scene;

  constructor(private eventDisplay: EventdisplayService, private http: HttpClient) {
  }

  ngOnInit() {
    this.selectedObject = { name: 'CMS Detector', attributes: [] };

    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -30], 'left'),
      new PresetView('Center View', [-10, 30, 0], 'circle'),
      new PresetView('Right View', [0, 0, 30], 'right')
    ];
    this.eventDisplay.init(configuration);

    // Loading CMS detector from gltf
    this.eventDisplay.loadGLTFDetector('assets/geometry/CMS/cms.gltf');
    
    this.loadEventData();
    this.loader = new CMSLoader();
    configuration.eventDataLoader = this.loader;

  }

  // Load CMS event data
  private loadEventData() {
    this.http.get('assets/files/event_data/EventCMS.json', { responseType: 'text' }).subscribe((data: any) => {
      // The data has some inconsistencies which need to be removed to properly parse JSON
      data = data.replace(/'/g, '"').replace(/\(/g, '[').replace(/\)/g, ']').replace(/nan/g, '0');
      const dataJSON = JSON.parse(data);
      console.log(dataJSON);

      // Setting up the loader to load event data
      this.loader.putData(dataJSON);
      const eventData = this.loader.getEventData();
      this.eventDisplay.buildEventDataFromJSON(eventData);
    });
  }
}
