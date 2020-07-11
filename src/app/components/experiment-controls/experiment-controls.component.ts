import { Component, Input } from '@angular/core';
import { ExperimentControlNode } from './experiment-control-node/experiment-control-node';

@Component({
  selector: 'app-experiment-controls',
  templateUrl: './experiment-controls.component.html',
  styleUrls: ['./experiment-controls.component.scss']
})
export class ExperimentControlsComponent {

  @Input() rootNode: ExperimentControlNode;

}
