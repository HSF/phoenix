import {Component, OnInit} from '@angular/core';
import {EventdisplayService} from '../../services/eventdisplay.service';
import {Configuration} from '../../services/loaders/configuration.model';
import {PresetView} from '../../services/extras/preset-view.model';
import {HttpClient} from '@angular/common/http';


@Component({
  selector: 'app-lhcb',
  templateUrl: './lhcb.component.html',
  styleUrls: ['./lhcb.component.scss']
})
export class LHCbComponent implements OnInit {
  events: any;

  constructor(private eventDisplay: EventdisplayService, private http: HttpClient) {
  }

  ngOnInit() {
    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Right View', [0, 0, 6000], 'right'),
      new PresetView('Center View', [-500, 1000, 0], 'circle'),
      new PresetView('Left View', [0, 0, -6000], 'left')
    ];
    this.eventDisplay.init(configuration);
    this.eventDisplay.loadGLTFDetector('assets/geometry/LHCb/lhcb.gltf');
  }
}
