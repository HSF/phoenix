import { Component, OnInit } from '@angular/core';
import { EventDisplayService } from '../../services/event-display.service';
import { Configuration, PresetView } from '@phoenix/event-display';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent implements OnInit {

  constructor(protected eventDisplay: EventDisplayService, protected http: HttpClient) { }

  ngOnInit() {
    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -12000], 'left-cube'),
      new PresetView('Center View', [-500, 12000, 0], 'top-cube'),
      new PresetView('Right View', [0, 0, 12000], 'right-cube')
    ];
    this.eventDisplay.init(configuration);
  }

}
