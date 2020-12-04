import { Component, OnInit } from '@angular/core';
import { EventDisplayService } from 'phoenix-ui-components';
import { Configuration, PresetView, PhoenixMenuNode, PhoenixLoader, StateManager } from 'phoenix-event-display';
import { environment } from '../../../environments/environment';
import eventConfig from '../../../../event-config.json';

// import the downloaded configuration from assets
import phoenixMenuConfig from '../../../assets/files/config/atlas-config.json';

@Component({
  selector: 'app-atlas',
  templateUrl: './atlas.component.html',
  styleUrls: ['./atlas.component.scss']
})
export class AtlasComponent implements OnInit {
  phoenixMenuRoot = new PhoenixMenuNode('Phoenix Menu', 'phoenix-menu');
  loaded = false;

  constructor(private eventDisplay: EventDisplayService) { }

  async ngOnInit() {
    let defaultEvent: { eventFile: string, eventType: string };
    // Get default event from configuration
    if (environment?.singleEvent) {
      defaultEvent = eventConfig;
    } else {
      defaultEvent = {
        eventFile: 'assets/files/JiveXML/JiveXML_336567_2327102923.xml',
        eventType: 'jivexml'
      }
    }

    // Define the configuration
    const configuration: Configuration = {
      eventDataLoader: new PhoenixLoader(),
      presetViews: [
        new PresetView('Left View', [0, 0, -12000], 'left-cube'),
        new PresetView('Center View', [-500, 12000, 0], 'top-cube'),
        new PresetView('Right View', [0, 0, 12000], 'right-cube')
      ],
      defaultView: [4000, 0, 4000],
      // Set the phoenix menu to be used (defined above)
      phoenixMenuRoot: this.phoenixMenuRoot,
      // Default event data to fallback to if none given in URL
      // Do not set if there should be no event loaded by default
      defaultEventFile: defaultEvent
    };

    // Initialize the event display
    this.eventDisplay.init(configuration);

    // Load detector geometries
    await this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/toroids.obj', 'Toroids', 0x8c8c8c, undefined, false, false);
    await this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/TRT.obj', 'TRT', 0x356aa5, undefined, false);
    await this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/SCT.obj', 'SCT', 0xfff400, undefined, false);
    await this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/pixel.obj', 'Pixel', 0x356aa5, undefined, false);
    await this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/LAR_Bar.obj', 'LAr Barrel', 0x19CCD2, undefined, true, false);
    await this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/LAR_EC1.obj', 'LAr EC1', 0x19CCD2, undefined, true, false);
    await this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/LAR_EC2.obj', 'LAr EC2', 0x19CCD2, undefined, true, false);
    await this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/TileCal.obj', 'Tile Cal', 0xc14343, undefined, true, false);

    this.eventDisplay.getLoadingManager().addLoadListenerWithCheck(() => {
      this.loaded = true;
    });

    const stateManager = new StateManager();
    stateManager.loadStateFromJSON(phoenixMenuConfig);
  }
}
