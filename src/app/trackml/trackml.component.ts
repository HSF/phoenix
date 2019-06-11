import { Component, OnInit } from '@angular/core';
import {EventdisplayService} from '../services/eventdisplay.service';
import {Configuration} from '../services/configuration';

@Component({
  selector: 'app-trackml',
  templateUrl: './trackml.component.html',
  styleUrls: ['./trackml.component.css']
})
export class TrackmlComponent implements OnInit {

  constructor(private eventDisplay: EventdisplayService) { }

  ngOnInit() {
    this.eventDisplay.init(new Configuration());
    this.eventDisplay.loadGeometryFromOBJ('../../assets/geometry/TrackML/strip_long_simplified.obj', 'Long Strip', 0xe9a23b, true);
    this.eventDisplay.loadGeometryFromOBJ('../../assets/geometry/TrackML/pixel_simplified.obj', 'Pixel', 0xe2a9e8, true);
    this.eventDisplay.loadGeometryFromOBJ('../../assets/geometry/TrackML/strip_short_simplified.obj', 'Short Strip', 0x369f95, true);
    this.eventDisplay.loadGeometryFromOBJ('../../assets/geometry/TrackML/beampipe_simplified.obj', 'Beampipe', 0x7f7f7f, true);
    this.eventDisplay.loadGeometryFromOBJ('../../assets/geometry/TrackML/pixel_support_tube_simplified.obj', 'PST', 0x7bb3ff, true);
  }

}
