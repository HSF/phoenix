import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from '../../services/eventdisplay.service';
import { Configuration } from '../../services/extras/configuration.model';
import { PresetView } from '../../services/extras/preset-view.model';
import { HttpClient } from '@angular/common/http';
import { PhoenixMenuNode } from '../../components/phoenix-menu/phoenix-menu-node/phoenix-menu-node';


@Component({
  selector: 'app-atlas',
  templateUrl: './atlas.component.html',
  styleUrls: ['./atlas.component.scss']
})
export class AtlasComponent implements OnInit {

  phoenixMenuRoot = new PhoenixMenuNode('Phoenix Menu', 'phoenix-menu');

  constructor(private eventDisplay: EventdisplayService, private http: HttpClient) { }

  ngOnInit() {
    // Define the configuration
    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -12000], 'left-cube'),
      new PresetView('Center View', [-500, 12000, 0], 'top-cube'),
      new PresetView('Right View', [0, 0, 12000], 'right-cube')
    ];
    // Set the phoenix menu to be used (defined above)
    configuration.setPhoenixMenuRoot(this.phoenixMenuRoot);

    // Initialize the event display
    this.eventDisplay.init(configuration);

    // Load the JSON file containing event data
    this.http.get('assets/files/event_data/atlaseventdump2.json')
      .subscribe((res: any) => {
        // Parse the JSON to extract events and their data
        this.eventDisplay.parsePhoenixEvents(res);
      });

    // Load detector geometries
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/toroids.obj', 'Toroids', 0x8c8c8c, false, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/TRT.obj', 'TRT', 0x356aa5, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/SCT.obj', 'SCT', 0xfff400, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/pixel.obj', 'Pixel', 0x356aa5, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/LAR_Bar.obj', 'LAr Barrel', 0x19CCD2, true, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/LAR_EC1.obj', 'LAr EC1', 0x19CCD2, true, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/LAR_EC2.obj', 'LAr EC2', 0x19CCD2, true, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/TileCal.obj', 'Tile Cal', 0xc14343, true, false);
  }
}
