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

    // USING SINGLE GLTF GEOMETRY
    // this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/ATLAS.gltf', 'ATLAS Detector', 1200);

    // USING SEPARATE GLTF GEOMETRIES
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/glTF/SCT_BAR.gltf', 'SCT BAR', 1200);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/glTF/SCT_EC.gltf', 'SCT EC', 1200);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/glTF/TRT_BAR.gltf', 'TRT BAR', 1200);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/glTF/TRT_EC.gltf', 'TRT EC', 1200);
    this.eventDisplay.loadGLTFGeometry('assets/geometry/ATLAS/glTF/Pixel.gltf', 'Pixel', 1200);

    // USING OBJ GEOMETRIES
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/toroids.obj', 'Toroids', 0x8c8c8c, false);
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/TRT.obj', 'TRT', 0x356aa5, false);
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/SCT.obj', 'SCT', 0xfff400, false);
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/pixel.obj', 'Pixel', 0x356aa5, false);
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/LAR_Bar.obj', 'LAr Barrel', 0x19CCD2, true);
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/LAR_EC1.obj', 'LAr EC1', 0x19CCD2, true);
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/LAR_EC2.obj', 'LAr EC2', 0x19CCD2, true);
    // this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/TileCal.obj', 'Tile Cal', 0xc14343, true);
  }
}
