import {Component, OnInit} from '@angular/core';
import {EventdisplayService} from '../services/eventdisplay.service';
import {Configuration} from '../services/configuration';
import {JSONLoader} from 'three';
import {JsonLoaderService} from '../services/loaders/json-loader.service';
import {PresetView} from '../services/preset-view';


@Component({
  selector: 'app-atlas',
  templateUrl: './atlas.component.html',
  styleUrls: ['./atlas.component.css']
})
export class AtlasComponent implements OnInit {



  constructor(private eventDisplay: EventdisplayService, private jsonLoader: JsonLoaderService) {
  }

  ngOnInit() {
    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Right View', [0, 0, 6000], 'right.svg'),
      new PresetView('Center View', [-500, 1000, 0], 'circle.svg'),
      new PresetView('Left View', [0, 0, -6000], 'left.svg')
    ];
    this.eventDisplay.init(configuration);
    this.jsonLoader.get('assets/files/atlaseventdump.json').subscribe((res: any) => this.eventDisplay.buildEventDataFromJSON(res));
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/toroids.obj', 'Toroids', 0xaaaaaa, false);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/TRT.obj', 'TRT', 0x356aa5, false);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/SCT.obj', 'SCT', 0xfff400, false);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/pixel.obj', 'Pixel', 0x356aa5, false);
  }

}
