import {Component, OnInit} from '@angular/core';
import {EventdisplayService} from '../services/eventdisplay.service';
import {Configuration} from '../services/configuration';
import {PresetView} from '../services/preset-view';
import {HttpClient} from '@angular/common/http';


@Component({
  selector: 'app-atlas',
  templateUrl: './atlas.component.html',
  styleUrls: ['./atlas.component.css']
})
export class AtlasComponent implements OnInit {
  events: any;

  constructor(private eventDisplay: EventdisplayService, private http: HttpClient) {
  }

  ngOnInit() {
    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Right View', [0, 0, 6000], 'right.svg'),
      new PresetView('Center View', [-500, 1000, 0], 'circle.svg'),
      new PresetView('Left View', [0, 0, -6000], 'left.svg')
    ];
    this.eventDisplay.init(configuration);
    this.http.get('assets/files/atlaseventdump2.json').subscribe((res: any) => this.events = this.eventDisplay.loadEventsFromJSON(res));
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/toroids.obj', 'Toroids', 0xaaaaaa, false);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/TRT.obj', 'TRT', 0x356aa5, false);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/SCT.obj', 'SCT', 0xfff400, false);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/pixel.obj', 'Pixel', 0x356aa5, false);
  }

  onOptionsSelected(selected: any) {
    const value = selected.target.value;
    this.eventDisplay.loadEvent(value);
  }
}
