import { Component, type OnInit, type OnDestroy } from '@angular/core';
import {
  EventDataFormat,
  type EventDataImportOption,
  EventDisplayService,
  type UIMenuConfig,
  defaultUIMenuConfig,
} from 'phoenix-ui-components';
import {
  PresetView,
  PhoenixMenuNode,
  JiveXMLLoader,
  StateManager,
  ATLAS_MASTERCLASS_CONFIG,
  type MasterclassConfig,
} from 'phoenix-event-display';
import type { Configuration } from 'phoenix-event-display';
import { environment } from '../../../environments/environment';
import eventConfig from '../../../../event-config.json';

import phoenixMenuConfig from '../../../assets/files/config/atlas-config.json';

/**
 * ATLAS masterclass landing-page example.
 * Loads the standard ATLAS geometry and event, but exposes a reduced toolbar
 * focused on the masterclass workflow (particle tagging + invariant mass).
 * Tracks Edward's issue #915 and bundles the masterclass panel from #835.
 */
@Component({
  standalone: false,
  selector: 'app-atlas-masterclass',
  templateUrl: './atlas-masterclass.component.html',
  styleUrls: ['./atlas-masterclass.component.scss'],
})
export class AtlasMasterclassComponent implements OnInit, OnDestroy {
  phoenixMenuRoot = new PhoenixMenuNode('Phoenix Menu', 'phoenix-menu');
  eventDataImportOptions: EventDataImportOption[] = [
    EventDataFormat.JSON,
    EventDataFormat.JIVEXML,
    EventDataFormat.PHYSLITE,
    EventDataFormat.ZIP,
  ];
  loaded = false;
  loadingProgress = 0;

  /** Reduced toolbar set for the masterclass example. */
  uiConfig: UIMenuConfig = {
    ...defaultUIMenuConfig,
    showObjectClipping: false,
    showOverlayView: false,
    showObjectSelection: false,
    showAnimateEvent: false,
    showAnimateCamera: false,
    showPerformanceToggle: false,
    showVRToggle: false,
    showARToggle: false,
    showMakePicture: false,
    showShareLink: false,
    showCollectionsInfo: false,
    showGeometryBrowser: false,
    showMasterclassPanel: true,
  };

  /** ATLAS Z-path masterclass config (electron, muon, photon tags). */
  masterclassConfig: MasterclassConfig = ATLAS_MASTERCLASS_CONFIG;

  /** Prevents callbacks on destroyed component. */
  private isDestroyed = false;

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnDestroy() {
    this.isDestroyed = true;
  }

  ngOnInit() {
    let defaultEvent: { eventFile: string; eventType: string };
    if (environment?.singleEvent) {
      defaultEvent = eventConfig;
    } else {
      defaultEvent = {
        eventFile: 'assets/files/JiveXML/JiveXML_336567_2327102923.xml',
        eventType: 'jivexml',
      };
    }

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
      phoenixMenuRoot: this.phoenixMenuRoot,
      defaultEventFile: defaultEvent,
    };

    this.eventDisplay.init(configuration);

    // Load the same ATLAS detector geometry as the /atlas route.
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

    this.eventDisplay.getLoadingManager().addProgressListener((progress) => {
      if (!this.isDestroyed) {
        this.loadingProgress = progress;
      }
    });

    this.eventDisplay.getLoadingManager().addLoadListenerWithCheck(() => {
      if (this.isDestroyed) return;

      this.loaded = true;

      const urlOptionsManager = this.eventDisplay.getURLOptionsManager();
      const urlConfig = urlOptionsManager.getURLOptions().get('config');
      const urlState = urlOptionsManager.getURLOptions().get('state');

      if (!urlConfig && !urlState) {
        const stateManager = new StateManager();
        stateManager.loadStateFromJSON(phoenixMenuConfig);
      }
    });
  }
}
