import {Component, OnInit} from '@angular/core';
import {EventdisplayService} from '../../services/eventdisplay.service';
import {Configuration} from '../../services/extras/configuration.model';
import {PresetView} from '../../services/extras/preset-view.model';
import {HttpClient} from '@angular/common/http';
//import {CMSLoader} from '../../services/loaders/cms-loader';


@Component({
  selector: 'app-cms',
  templateUrl: './cms.component.html',
  styleUrls: ['./cms.component.scss']
})
export class CMSComponent implements OnInit {
  events: any;
  //loader: CMSLoader;
  selectedObject: any;

  constructor(private eventDisplay: EventdisplayService, private http: HttpClient) {
  }

  ngOnInit() {
    this.selectedObject = {name: 'CMS Detector', attributes: []};

    const configuration = new Configuration();
    configuration.darkBackground = false;
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -50], 'left'),
      new PresetView('Center View', [-20, 50, 0], 'circle'),
      new PresetView('Right View', [0, 0, 50], 'right')
    ];
    this.eventDisplay.init(configuration);
    this.eventDisplay.loadGLTFDetector('assets/geometry/CMS/cms.gltf');
    //this.loader = new CMSLoader();
    //configuration.eventDataLoader = this.loader;
    //this.loadEventData(configuration);

  }

  // Load CMS event data
  // private loadEventData(config: Configuration) {
  //   this.http.get('assets/files/lhcb/00191749_0005296728.json').subscribe((data: any) => {
  //     this.loader.process(data);
  //     const eventData = this.loader.getEventData();
  //     this.eventDisplay.buildEventDataFromJSON(eventData);
  //   });
  // }
}
