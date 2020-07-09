import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { EventdisplayService } from '../../services/eventdisplay.service';
import { Configuration } from '../../services/extras/configuration.model';
import { PresetView } from '../../services/extras/preset-view.model';
import { HttpClient } from '@angular/common/http';
import { ExperimentControlItemComponent } from '../../components/experiment-controls/experiment-control-item/experiment-control-item.component';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent implements AfterViewInit {

  @ViewChild('experimentControlsRoot') experimentControlsRoot: ExperimentControlItemComponent;

  constructor(protected eventDisplay: EventdisplayService, protected http: HttpClient) { }

  ngAfterViewInit() {
    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -6000], 'left-cube'),
      new PresetView('Center View', [-500, 1000, 0], 'top-cube'),
      new PresetView('Right View', [0, 0, 6000], 'right-cube'),
      new PresetView('Zoom View', [-1, 1, 0], 'zoom-in')
    ];
    configuration.experimentControlsRoot = this.experimentControlsRoot;
    this.eventDisplay.init(configuration);
  }
}
