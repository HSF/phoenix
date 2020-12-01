import { Component, OnInit } from '@angular/core';
import { EventDisplayService } from 'phoenix-ui-components';
import { HttpClient } from '@angular/common/http';
import { PhoenixMenuNode, LHCbLoader, Configuration, PresetView } from 'phoenix-event-display';


@Component({
  selector: 'app-lhcb',
  templateUrl: './lhcb.component.html',
  styleUrls: ['./lhcb.component.scss']
})
export class LHCbComponent implements OnInit {
  events: any;
  loader: LHCbLoader;
  phoenixMenuRoot: PhoenixMenuNode = new PhoenixMenuNode('Phoenix Menu', 'phoenix-menu');
  loaded = false;

  constructor(private eventDisplay: EventDisplayService, private http: HttpClient) {
  }

  ngOnInit() {
    this.loader = new LHCbLoader();

    const configuration: Configuration = {
      eventDataLoader: this.loader,
      presetViews: [
        new PresetView('Right View', [0, 0, 6000], 'right-cube'),
        new PresetView('Center View', [-500, 1000, 0], 'top-cube'),
        new PresetView('Left View', [0, 0, -6000], 'left-cube')
      ],
      defaultView: [-800, 300, -1000],
      phoenixMenuRoot: this.phoenixMenuRoot
    };

    this.eventDisplay.init(configuration);

    this.eventDisplay.loadGLTFGeometry('assets/geometry/LHCb/lhcb.gltf', 'LHCb detector');

    this.loadEventData();

    this.eventDisplay.getLoadingManager().addLoadListenerWithCheck(() => {
      this.loaded = true;
    });
  }

  private loadEventData() {
    this.http.get('assets/files/lhcb/00191749_0005296728.json').subscribe((data: any) => {
      this.loader.process(data);
      const eventData = this.loader.getEventData();
      this.eventDisplay.buildEventDataFromJSON(eventData);
    });
  }
}
