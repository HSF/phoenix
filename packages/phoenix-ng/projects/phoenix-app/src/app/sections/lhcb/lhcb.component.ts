import { Component, OnInit } from '@angular/core';
import {
  EventDataFormat,
  EventDataImportOption,
  EventDisplayService,
  ImportOption,
} from 'phoenix-ui-components';
import {
  PhoenixMenuNode,
  LHCbLoader,
  Configuration,
  PresetView,
  PhoenixLoader,
} from 'phoenix-event-display';
import { Plane, Vector3 } from 'three';

@Component({
  selector: 'app-lhcb',
  templateUrl: './lhcb.component.html',
  styleUrls: ['./lhcb.component.scss'],
})
export class LHCbComponent implements OnInit {
  events: any;
  lhcbLoader: LHCbLoader;
  phoenixMenuRoot: PhoenixMenuNode = new PhoenixMenuNode(
    'Phoenix Menu',
    'phoenix-menu'
  );
  loaded = false;
  loadingProgress = 0;

  lhcbImporter = new ImportOption(
    'JSON (LHCb)',
    '.json (LHCb)',
    this.handleLHCbJSONImport.bind(this),
    'application/json'
  );
  eventDataImportOptions: EventDataImportOption[] = [
    EventDataFormat.JSON,
    this.lhcbImporter,
  ];

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit() {
    this.lhcbLoader = new LHCbLoader();

    const configuration: Configuration = {
      eventDataLoader: new PhoenixLoader(),
      presetViews: [
        new PresetView('Right View', [0, 0, 6000], 'right-cube'),
        new PresetView('Center View', [-500, 1000, 0], 'top-cube'),
        new PresetView('Left View', [0, 0, -6000], 'left-cube'),
      ],
      defaultView: [-18000, 0, 15000],
      phoenixMenuRoot: this.phoenixMenuRoot,
      defaultEventFile: {
        eventFile: 'assets/files/lhcb/LHCbEventDataV2.json',
        eventType: 'json',
      },
      clippingPlanes: [
        new Plane(new Vector3(0, 1, 0), 0),
        new Plane(new Vector3(0, -1, 0), 0),
        new Plane(new Vector3(0, 0, 1), -20000),
      ],
    };

    this.eventDisplay.init(configuration);

    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/LHCb/LHCb.gltf',
      '', // ignored in case of multiple scenes
      '',
      1,
      true
    );

    this.eventDisplay
      .getLoadingManager()
      .addProgressListener((progress) => (this.loadingProgress = progress));

    this.eventDisplay
      .getLoadingManager()
      .addLoadListenerWithCheck(() => (this.loaded = true));
  }

  handleLHCbJSONImport(files: FileList) {
    const reader = new FileReader();
    reader.onload = () => {
      this.loadLHCbEventData(JSON.parse(reader.result.toString()));
    };
    reader.readAsText(files[0]);
  }

  private loadLHCbEventData(data: any) {
    this.lhcbLoader.process(data);
    const eventData = this.lhcbLoader.getEventData();
    this.eventDisplay.buildEventDataFromJSON(eventData);
  }
}
