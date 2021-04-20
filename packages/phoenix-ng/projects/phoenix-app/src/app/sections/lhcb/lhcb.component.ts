import { Component, OnInit } from '@angular/core';
import { EventDisplayService, ImportOption } from 'phoenix-ui-components';
import {
  PhoenixMenuNode,
  LHCbLoader,
  Configuration,
  PresetView,
} from 'phoenix-event-display';

@Component({
  selector: 'app-lhcb',
  templateUrl: './lhcb.component.html',
  styleUrls: ['./lhcb.component.scss'],
})
export class LHCbComponent implements OnInit {
  events: any;
  loader: LHCbLoader;
  phoenixMenuRoot: PhoenixMenuNode = new PhoenixMenuNode(
    'Phoenix Menu',
    'phoenix-menu'
  );
  loaded = false;

  lhcbImporter = new ImportOption(
    'JSON (LHCb)',
    '.json (LHCb)',
    this.handleLHCbJSONImport.bind(this),
    'application/json'
  );

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit() {
    this.loader = new LHCbLoader();

    const configuration: Configuration = {
      eventDataLoader: this.loader,
      presetViews: [
        new PresetView('Right View', [0, 0, 6000], 'right-cube'),
        new PresetView('Center View', [-500, 1000, 0], 'top-cube'),
        new PresetView('Left View', [0, 0, -6000], 'left-cube'),
      ],
      defaultView: [-800, 300, -1000],
      phoenixMenuRoot: this.phoenixMenuRoot,
    };

    this.eventDisplay.init(configuration);

    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/LHCb/lhcb.gltf',
      'LHCb detector'
    );

    fetch('assets/files/lhcb/00191749_0005296728.json')
      .then((res) => res.json())
      .then((eventData) => {
        this.loadEventData(eventData);
      });

    this.eventDisplay.getLoadingManager().addLoadListenerWithCheck(() => {
      this.loaded = true;
    });
  }

  handleLHCbJSONImport(files: FileList) {
    const reader = new FileReader();
    reader.onload = () => {
      this.loadEventData(JSON.parse(reader.result.toString()));
    };
    reader.readAsText(files[0]);
  }

  private loadEventData(data: any) {
    this.loader.process(data);
    const eventData = this.loader.getEventData();
    this.eventDisplay.buildEventDataFromJSON(eventData);
  }
}
