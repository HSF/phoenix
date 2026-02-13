import { Component, type OnInit, type OnDestroy } from '@angular/core';
import {
  EventDataFormat,
  type EventDataImportOption,
  EventDisplayService,
} from 'phoenix-ui-components';
import {
  PhoenixMenuNode,
  type Configuration,
  PresetView,
  ClippingSetting,
  PhoenixLoader,
} from 'phoenix-event-display';
import { Plane, Vector3 } from 'three';

@Component({
  standalone: false, // this is now required when using NgModule
  selector: 'app-lhcb',
  templateUrl: './lhcb.component.html',
  styleUrls: ['./lhcb.component.scss'],
})
export class LHCbComponent implements OnInit, OnDestroy {
  events: any;
  phoenixMenuRoot: PhoenixMenuNode = new PhoenixMenuNode(
    'Phoenix Menu',
    'phoenix-menu',
  );
  loaded = false;
  loadingProgress = 0;

  eventDataImportOptions: EventDataImportOption[] = [
    EventDataFormat.JSON,
    EventDataFormat.ZIP,
  ];

  /** Prevents callbacks on destroyed component */
  private isDestroyed = false;

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnDestroy() {
    this.isDestroyed = true;
  }

  ngOnInit() {
    const configuration: Configuration = {
      eventDataLoader: new PhoenixLoader(),
      presetViews: [
        new PresetView(
          'Global View',
          [-8000, 6000, 0],
          [0, 0, 8000],
          'perspective',
          ClippingSetting.On,
          90,
          90,
        ),
        new PresetView(
          'Calo View',
          [-8000, 6000, 16000],
          [0, 0, 12000],
          'perspective',
          ClippingSetting.On,
          90,
          90,
        ),
        new PresetView(
          'Side View',
          [-12000, 0, 12000],
          [0, 0, 12000],
          'right-cube',
        ),
        new PresetView(
          'Vertex Locator View',
          [-500, 1000, 0],
          [0, 0, 0],
          'top-cube',
        ),
        new PresetView('Front View', [0, 0, -6000], [0, 0, 0], 'left-cube'),
        new PresetView(
          'Top View',
          [0, 16000, 12000],
          [0, 0, 12000],
          'top-cube',
        ),
      ],
      defaultView: [-8000, 6000, 0, 0, 0, 8000], // x,y,z of position followed by x,y,z of target
      phoenixMenuRoot: this.phoenixMenuRoot,
      defaultEventFile: {
        eventFile: 'assets/files/lhcb/LHCbEventData.json',
        eventType: 'json',
      },
    };

    this.eventDisplay.init(configuration);

    try {
      this.eventDisplay.loadGLTFGeometry(
        'assets/geometry/LHCb/LHCb.glb.zip',
        undefined, // name, ignored when empty
        undefined, // menuNodeName
        1, // scale
        true, // initiallyVisible
      );
    } catch (e) {
      console.log('Error:', e);
    }

    this.eventDisplay.getLoadingManager().addProgressListener((progress) => {
      if (!this.isDestroyed) {
        this.loadingProgress = progress;
      }
    });

    this.eventDisplay.getLoadingManager().addLoadListenerWithCheck(() => {
      if (!this.isDestroyed) {
        this.loaded = true;
      }
    });
  }
}
