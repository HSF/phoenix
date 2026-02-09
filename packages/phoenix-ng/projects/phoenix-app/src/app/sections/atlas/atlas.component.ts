import { Component, type OnInit } from '@angular/core';
import {
  EventDataFormat,
  type EventDataImportOption,
  EventDisplayService,
} from 'phoenix-ui-components';
import {
  PresetView,
  PhoenixMenuNode,
  JiveXMLLoader,
  StateManager,
} from 'phoenix-event-display';
import type { Configuration } from 'phoenix-event-display';
import { environment } from '../../../environments/environment';
import eventConfig from '../../../../event-config.json';

// import the downloaded configuration from assets
import phoenixMenuConfig from '../../../assets/files/config/atlas-config.json';

@Component({
  standalone: false,
  selector: 'app-atlas',
  templateUrl: './atlas.component.html',
  styleUrls: ['./atlas.component.scss'],
})
export class AtlasComponent implements OnInit {
  phoenixMenuRoot = new PhoenixMenuNode('Phoenix Menu', 'phoenix-menu');
  eventDataImportOptions: EventDataImportOption[] = [
    EventDataFormat.JSON,
    EventDataFormat.JIVEXML,
    EventDataFormat.ZIP,
  ];
  loaded = false;
  loadingProgress = 0;

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit() {
    let defaultEvent: { eventFile: string; eventType: string };
    // Get default event from configuration
    if (environment?.singleEvent) {
      defaultEvent = eventConfig;
    } else {
      defaultEvent = {
        eventFile: 'assets/files/JiveXML/JiveXML_336567_2327102923.xml',
        eventType: 'jivexml',
      };
    }

    // Define the configuration
    const configuration: Configuration = {
      eventDataLoader: new JiveXMLLoader([
        'CombinedMuonTracks',
        'MuonSpectrometerTracks',
        'CombinedInDetTracks',
        'Muons_xAOD',
      ]),
      presetViews: [
        new PresetView('Left View', [0, 0, -12000], [0, 0, 0], 'left-cube'),
        new PresetView('Center View', [-500, 12000, 0], [0, 0, 0], 'top-cube'),
        new PresetView('Right View', [0, 0, 12000], [0, 0, 0], 'right-cube'),
      ],
      defaultView: [4000, 0, 4000, 0, 0, 0],
      // Set the phoenix menu to be used (defined above)
      phoenixMenuRoot: this.phoenixMenuRoot,
      // Default event data to fallback to if none given in URL
      // Do not set if there should be no event loaded by default
      defaultEventFile: defaultEvent,
    };

    // Initialize the event display
    this.eventDisplay.init(configuration);

    // Load detector geometries

    // Magnets + Support
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Barrel-Toroid.gltf.zip',
      'Barrel Toroid',
      'Magnets',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/End-Cap-Toroid.gltf.zip',
      'Endcap',
      'Magnets',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Feet.gltf.zip',
      'Feet',
      'Magnets',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Warm-Structure.gltf.zip',
      'Warm structure',
      'Magnets',
      1000,
    );

    // LAr
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Lar-Barrel.gltf.zip',
      'LAr Barrel',
      'Calorimeters',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Lar-EMEC.gltf.zip',
      'LAr EC1',
      'Calorimeters',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Lar-FCAL.gltf.zip',
      'LAr FCAL',
      'Calorimeters',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Lar-HEC.gltf.zip',
      'LAr HEC',
      'Calorimeters',
      1000,
    );

    // Tile
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Tile-Barrel.gltf.zip',
      'Tile Cal',
      'Calorimeters',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Tile-End-Cap.gltf.zip',
      'Tile Cal EC',
      'Calorimeters',
      1000,
    );

    // Inner Detector
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Beam.gltf.zip',
      'Beam',
      'Inner Detector',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Pixel.gltf.zip',
      'Pixel',
      'Inner Detector',
      1000,
      true,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/SCT-BAR.gltf.zip',
      'SCT',
      'Inner Detector',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/SCT-EC.gltf.zip',
      'SCT Endcaps',
      'Inner Detector',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/TRT-BAR.gltf.zip',
      'TRT',
      'Inner Detector',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/TRT-EC.gltf.zip',
      'TRT Endcaps',
      'Inner Detector',
      1000,
    );

    // Muons
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Extra-Wheel.gltf.zip',
      'Extra wheel',
      'Muon Spectrometer > Endcaps',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Big-Wheel.gltf.zip',
      'Big wheel',
      'Muon Spectrometer > Endcaps',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Outer-Wheel.gltf.zip',
      'Outer Wheel',
      'Muon Spectrometer > Endcaps',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Muon-Barrel-Inner.gltf.zip',
      'Muon Barrel Inner',
      'Muon Spectrometer > Barrel',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Muon-Barrel-Middle.gltf.zip',
      'Muon Barrel Middle',
      'Muon Spectrometer > Barrel',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Muon-Barrel-Outer.gltf.zip',
      'Muon Barrel Outer',
      'Muon Spectrometer > Barrel',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Muon-Big-Wheel-MDT.gltf.zip',
      'Big Wheel MDT ',
      'Muon Spectrometer > Endcaps',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Small-Wheel-Chambers.gltf.zip',
      'Small Wheel',
      'Muon Spectrometer > Endcaps',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Small-Wheel-Hub.gltf.zip',
      'Small Wheel Hub',
      'Muon Spectrometer > Endcaps',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/Small-Wheel-NJD.gltf.zip',
      'Small Wheel Feet',
      'Muon Spectrometer > Endcaps',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/TGC2.gltf.zip',
      'TGC2',
      'Muon Spectrometer > Endcaps',
      1000,
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/ATLAS/TGC3.gltf.zip',
      'TGC3',
      'Muon Spectrometer > Endcaps',
      1000,
    );

    this.eventDisplay
      .getLoadingManager()
      .addProgressListener((progress) => (this.loadingProgress = progress));

    // Load the default configuration
    this.eventDisplay.getLoadingManager().addLoadListenerWithCheck(() => {
      console.log('Loading default configuration.');
      this.loaded = true;

      const urlConfig = this.eventDisplay
        .getURLOptionsManager()
        .getURLOptions()
        .get('config');

      if (!urlConfig) {
        const stateManager = new StateManager();
        stateManager.loadStateFromJSON(phoenixMenuConfig);
      }
    });
  }
}
