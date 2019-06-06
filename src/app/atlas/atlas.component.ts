import { Component, OnInit } from '@angular/core';
import {EventdisplayService} from '../services/eventdisplay.service';
import {Configuration} from '../services/configuration';

@Component({
  selector: 'app-atlas',
  templateUrl: './atlas.component.html',
  styleUrls: ['./atlas.component.css']
})
export class AtlasComponent implements OnInit {

  loading = true;

  constructor(private eventDisplay: EventdisplayService) { }

  ngOnInit() {
    this.eventDisplay.init(new Configuration());
    this.eventDisplay.loadGeometryFromOBJ('../../assets/geometry/ATLASR2/toroids.obj', 'Toroids', 0x878181);
    this.eventDisplay.loadGeometryFromOBJ('../../assets/geometry/ATLASR2/pixel.obj', 'Pixel', 0xe2a9e8);
    this.eventDisplay.loadGeometryFromOBJ('../../assets/geometry/ATLASR2/SCT.obj', 'SCT', 0xb1dbb3);
    this.eventDisplay.loadGeometryFromOBJ('../../assets/geometry/ATLASR2/TRT.obj', 'TRT', 0xf9ac59);
  }

}
