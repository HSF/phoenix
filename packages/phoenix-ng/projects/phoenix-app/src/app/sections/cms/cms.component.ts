import { Component, OnInit } from '@angular/core';
import {
  Configuration,
  PresetView,
  CMSLoader,
  ScriptLoader,
  PhoenixMenuNode,
} from 'phoenix-event-display';
import {
  EventDataFormat,
  EventDataImportOption,
  EventDisplayService,
} from 'phoenix-ui-components';

@Component({
  selector: 'app-cms',
  templateUrl: './cms.component.html',
  styleUrls: ['./cms.component.scss'],
})
export class CMSComponent implements OnInit {
  phoenixMenuRoot: PhoenixMenuNode = new PhoenixMenuNode(
    'Phoenix Menu',
    'phoenix-menu'
  );
  loaded = false;
  loadingProgress = 0;
  eventDataImportOptions: EventDataImportOption[] = [
    EventDataFormat.JSON,
    EventDataFormat.IG,
  ];

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit(): void {
    const cmsLoader = new CMSLoader();

    const configuration: Configuration = {
      eventDataLoader: cmsLoader,
      presetViews: [
        new PresetView('Left View', [0, 0, -12000], [0, 0, 0], 'left-cube'),
        new PresetView('Center View', [-500, 12000, 0], [0, 0, 0], 'top-cube'),
        new PresetView('Right View', [0, 0, 12000], [0, 0, 0], 'right-cube'),
      ],
      defaultView: [4000, 0, 4000, 0, 0, 0],
      phoenixMenuRoot: this.phoenixMenuRoot,
    };

    this.eventDisplay.init(configuration);

    ScriptLoader.loadJSRootScripts().then((JSROOT) => {
      this.eventDisplay.loadRootJSONGeometry(
        JSROOT,
        'https://root.cern/js/files/geom/cms.json.gz',
        'CMS Detector',
        undefined,
        10,
        true
      );
    });

    cmsLoader.readIgArchive(
      'assets/files/cms/Hto4l_120-130GeV.ig',
      (allEvents: any[]) => {
        const allEventsData = cmsLoader.getAllEventsData(allEvents);
        this.eventDisplay.parsePhoenixEvents(allEventsData);
      }
    );

    this.eventDisplay
      .getLoadingManager()
      .addProgressListener((progress) => (this.loadingProgress = progress));

    this.eventDisplay
      .getLoadingManager()
      .addLoadListenerWithCheck(() => (this.loaded = true));
  }
}
