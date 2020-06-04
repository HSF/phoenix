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
      new PresetView('Left View', [0, 0, -12000], 'left'),
      new PresetView('Center View', [-500, 12000, 0], 'circle'),
      new PresetView('Right View', [0, 0, 12000], 'right')
    ];

    this.eventDisplay.init(configuration);
    this.http.get('assets/files/event_data/atlaseventdump2.json')
      .subscribe((res: any) => this.eventDisplay.parsePhoenixEvents(res));
    this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/toroids.obj', 'Toroids', 0xaaaaaa, false);
    this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/TRT.obj', 'TRT', 0x356aa5, false);
    this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/SCT.obj', 'SCT', 0xfff400, false);
    this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/pixel.obj', 'Pixel', 0x356aa5, false);
    this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/LAR_Bar.obj', 'LAr Barrel', 0x19CCD2, true);
    this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/LAR_EC1.obj', 'LAr EC1', 0x19CCD2, true);
    this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/LAR_EC2.obj', 'LAr EC2', 0x19CCD2, true);
    this.eventDisplay.loadOBJGeometry('assets/geometry/ATLAS/TileCal.obj', 'Tile Cal', 0xc14343, true);
  }
}
