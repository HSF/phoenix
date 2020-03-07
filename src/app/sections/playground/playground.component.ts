import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from '../../services/eventdisplay.service';
import { Configuration } from '../../services/extras/configuration.model';
import { PresetView } from '../../services/extras/preset-view.model';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent implements OnInit {


  constructor(protected eventDisplay: EventdisplayService) {
  }

  ngOnInit() {
    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -6000], 'left'),
      new PresetView('Center View', [-500, 1000, 0], 'circle'),
      new PresetView('Right View', [0, 0, 6000], 'right'),
      new PresetView('Zoom View', [-1, 1, 0], 'zoom')
    ];
    this.eventDisplay.init(configuration);
  }
}
