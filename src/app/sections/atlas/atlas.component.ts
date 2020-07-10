import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from '../../services/eventdisplay.service';
import { Configuration } from '../../services/extras/configuration.model';
import { PresetView } from '../../services/extras/preset-view.model';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-atlas',
  templateUrl: './atlas.component.html',
  styleUrls: ['./atlas.component.scss']
})
export class AtlasComponent implements OnInit {

  constructor(private eventDisplay: EventdisplayService, private http: HttpClient) {
  }

  ngOnInit() {

    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -12000], 'left-cube'),
      new PresetView('Center View', [-500, 12000, 0], 'top-cube'),
      new PresetView('Right View', [0, 0, 12000], 'right-cube')
    ];

    this.eventDisplay.init(configuration);
    this.http.get('assets/files/event_data/atlaseventdump2.json')
      .subscribe((res: any) => this.eventDisplay.parsePhoenixEvents(res));
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/toroids.obj', 'Toroids', 0x8c8c8c, false);
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/TRT.obj', 'TRT', 0x356aa5, false);
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/SCT.obj', 'SCT', 0xfff400, false);
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/pixel.obj', 'Pixel', 0x356aa5, false);
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/LAR_Bar.obj', 'LAr Barrel', 0x19CCD2, true);
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/LAR_EC1.obj', 'LAr EC1', 0x19CCD2, true);
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/LAR_EC2.obj', 'LAr EC2', 0x19CCD2, true);
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/TileCal.obj', 'Tile Cal', 0xc14343, true);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/Beam.gltf', 'Beam', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/Barrel-Toroid.gltf', 'Barrel Toroid', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/End-Cap-Toroid.gltf', 'EC Toroid', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/Lar-Barrel.gltf', 'LAr Barrel', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/Lar-EMEC.gltf', 'LAr EC1', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/Lar-FCAL.gltf', 'LAr FCAL', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/Lar-HEC.gltf', 'LAr HEC', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/Tile-Barrel.gltf', 'Tile Cal', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/Tile-End-Cap.gltf', 'Tile Cal EC', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/Pixel.gltf', 'Pixel', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/SCT-BAR.gltf', 'SCT', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/SCT-EC.gltf', 'SCT EC', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/TRT-BAR.gltf', 'TRT', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/TRT-EC.gltf', 'TRT EC', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/Extra-Wheel.gltf', 'Extra wheel', 1000);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/Feet.gltf', 'Feet', 1000);
    // -rw-rw-r--@ 1 emoyse  staff    15M Jul  1  2020 Big-Wheel.gltf
    // -rw-rw-r--@ 1 emoyse  staff   2.9M Jul  1  2020 Extra-Wheel.gltf
    // -rw-rw-r--@ 1 emoyse  staff   4.2M Jul  1  2020 Feet.gltf
    // -rw-rw-r--@ 1 emoyse  staff   2.2M Jul  1  2020 Forward-Shielding.gltf

    // -rw-rw-r--@ 1 emoyse  staff   4.5M Jul  1  2020 Muon-Barrel-Inner.gltf
    // -rw-rw-r--@ 1 emoyse  staff   3.5M Jul  1  2020 Muon-Barrel-Middle.gltf
    // -rw-rw-r--@ 1 emoyse  staff   2.7M Jul  1  2020 Muon-Barrel-Outer.gltf
    // -rw-rw-r--@ 1 emoyse  staff   1.3M Jul  1  2020 Muon-Big-Wheel-MDT.gltf
    // -rw-rw-r--@ 1 emoyse  staff   2.7M Jul  1  2020 Outer-Wheel.gltf
    // -rw-rw-r--@ 1 emoyse  staff    14M Jul  1  2020 Pixel.gltf
    // -rw-rw-r--@ 1 emoyse  staff   1.0M Jul  1  2020 SCT-BAR.gltf
    // -rw-rw-r--@ 1 emoyse  staff    11M Jul  1  2020 SCT-EC.gltf
    // -rw-rw-r--@ 1 emoyse  staff   3.1M Jul  1  2020 Small-Wheel-Chambers.gltf
    // -rw-rw-r--@ 1 emoyse  staff   380K Jul  1  2020 Small-Wheel-Hub.gltf
    // -rw-rw-r--@ 1 emoyse  staff   603K Jul  1  2020 Small-Wheel-NJD.gltf
    // -rw-rw-r--@ 1 emoyse  staff   3.2M Jul  1  2020 TGC2.gltf
    // -rw-rw-r--@ 1 emoyse  staff   3.2M Jul  1  2020 TGC3.gltf
    // -rw-rw-r--@ 1 emoyse  staff   1.1M Jul  1  2020 TRT-BAR.gltf
    // -rw-rw-r--@ 1 emoyse  staff   8.1M Jul  1  2020 TRT-EC.gltf
    // -rw-rw-r--@ 1 emoyse  staff   1.5M Jul  1  2020 Tile-Barrel.gltf
    // -rw-rw-r--@ 1 emoyse  staff   2.6M Jul  1  2020 Tile-End-Cap.gltf
    // -rw-rw-r--@ 1 emoyse  staff   1.5M Jul  1  2020 Tower-Turret.gltf
    // -rw-rw-r--@ 1 emoyse  staff   3.7M Jul  1  2020 Warm-Structure.gltf

  }
}
