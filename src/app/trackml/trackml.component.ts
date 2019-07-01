import {Component, OnInit} from '@angular/core';
import {EventdisplayService} from '../services/eventdisplay.service';
import {Configuration} from '../services/configuration';
import {PresetView} from '../services/preset-view';

@Component({
  selector: 'app-trackml',
  templateUrl: './trackml.component.html',
  styleUrls: ['./trackml.component.css']
})
export class TrackmlComponent implements OnInit {

  constructor(private eventDisplay: EventdisplayService) {
  }

  ngOnInit() {
    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Right View', [0, 0, 6000], 'right.svg'),
      new PresetView('Center View', [-500, 1000, 0], 'circle.svg'),
      new PresetView('Left View', [0, 0, -6000], 'left.svg')
    ];
    this.eventDisplay.init(configuration);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/TrackML/strip_long_simplified.obj', 'Long Strip', 0xe9a23b, true);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/TrackML/pixel_simplified.obj', 'Pixel', 0xe2a9e8, true);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/TrackML/strip_short_simplified.obj', 'Short Strip', 0x369f95, true);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/TrackML/beampipe_simplified.obj', 'Beampipe', 0x7f7f7f, true);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/TrackML/pixel_support_tube_simplified.obj', 'PST', 0x7bb3ff, true);
  }

}
