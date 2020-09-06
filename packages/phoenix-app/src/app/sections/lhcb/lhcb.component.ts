import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from '../../services/eventdisplay.service';
import { HttpClient } from '@angular/common/http';
import { PhoenixMenuNode, LHCbLoader, Configuration, PresetView } from '@phoenix/event-display';


@Component({
  selector: 'app-lhcb',
  templateUrl: './lhcb.component.html',
  styleUrls: ['./lhcb.component.scss']
})
export class LHCbComponent implements OnInit {
  events: any;
  loader: LHCbLoader;
  phoenixMenuRoot: PhoenixMenuNode = new PhoenixMenuNode('Phoenix Menu', 'phoenix-menu');

  constructor(private eventDisplay: EventdisplayService, private http: HttpClient) {
  }

  ngOnInit() {
    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Right View', [0, 0, 6000], 'right-cube'),
      new PresetView('Center View', [-500, 1000, 0], 'top-cube'),
      new PresetView('Left View', [0, 0, -6000], 'left-cube')
    ];
    configuration.setPhoenixMenuRoot(this.phoenixMenuRoot);

    this.eventDisplay.instance.init(configuration);
    this.eventDisplay.instance.loadGLTFGeometry('assets/geometry/LHCb/lhcb.gltf', 'LHCb detector');
    this.loader = new LHCbLoader();
    configuration.eventDataLoader = this.loader;
    this.loadEventData(configuration);

  }

  private loadEventData(config: Configuration) {
    this.http.get('assets/files/lhcb/00191749_0005296728.json').subscribe((data: any) => {
      this.loader.process(data);
      const eventData = this.loader.getEventData();
      this.eventDisplay.instance.buildEventDataFromJSON(eventData);
    });
  }
}
