import { Component, OnInit } from '@angular/core';
import { EventDisplayService, ImportOption } from 'phoenix-ui-components';
import {
  PhoenixMenuNode,
  LHCbLoader,
  Configuration,
  PresetView,
  PhoenixLoader,
} from 'phoenix-event-display';

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
      defaultView: [-800, 300, -1000],
      phoenixMenuRoot: this.phoenixMenuRoot,
      defaultEventFile: {
        eventFile: 'assets/files/lhcb/LHCbEventDataV2.json',
        eventType: 'json',
      },
    };

    this.eventDisplay.init(configuration);

    /** 
     * The following commented part of code is properly working
     * and it is the whole new Geometry of the run3 LHCb detector in one single gltf file,
     * but there is a huge performance issue (max 4fps)
     * the fault is the root file that was designed with too many subchildren for the parts of
     * Ecal, Hcal, Muon
     * and thus the reuslted gltf file generated from the root one has huge performance issues. 
     * Uncomment the following to see it in action ( you'll have to wait a bit :) )
    */

    // this.eventDisplay.loadGLTFGeometry(
    //   'assets/geometry/LHCb/LHCb_run3_full.gltf',
    //   'LHCb Run3 CompleteDetector',
    //   'Whole Detector',
    //   1,
    //   false
    // );

    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/LHCb/LHCb_run3_PIPE.gltf',
      'Pipe',
      'Base',
      1,
      true
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/LHCb/LHCb_run3_MAGNET.gltf',
      'Upper & Lower Coils',
      'Magnets',
      1,
      true
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/LHCb/LHCb_run3_MagnetCover.gltf',
      'Magnet Cover',
      'Magnets',
      1,
      false
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/LHCb/LHCb_run2_ECAL.gltf',
      'Ecal',
      'DownstreamRegion',
      1,
      false
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/LHCb/LHCb_run2_HCAL.gltf',
      'Hcal',
      'DownstreamRegion',
      1,
      false
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/LHCb/LHCb_run2_MUON.gltf',
      'Muon',
      'DownstreamRegion',
      1,
      true
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/LHCb/LHCb_run3_FT.gltf',
      'FT',
      'AfterMagnetRegion',
      1,
      true
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/LHCb/LHCb_run3_Rich_AfterMagnet.gltf',
      'Rich',
      'AfterMagnetRegion',
      1,
      true
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/LHCb/LHCb_run3_Rich_BeforeMagnet.gltf',
      'Rich',
      'BeforeMagnetRegion',
      1,
      true
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/LHCb/LHCb_run3_VP.gltf',
      'VP',
      'BeforeMagnetRegion',
      1,
      true
    );
    this.eventDisplay.loadGLTFGeometry(
      'assets/geometry/LHCb/LHCb_run3_UT.gltf',
      'UT',
      'BeforeMagnetRegion',
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
