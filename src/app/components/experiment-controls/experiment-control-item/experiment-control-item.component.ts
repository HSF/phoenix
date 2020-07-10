import { Component, Input } from '@angular/core';
import { ExperimentControlNode } from '../experiment-control-node/experiment-control-node';

@Component({
  selector: 'app-experiment-control-item',
  templateUrl: './experiment-control-item.component.html',
  styleUrls: ['./experiment-control-item.component.scss']
})
export class ExperimentControlItemComponent {

  @Input() currentNode: ExperimentControlNode;
  configActive: boolean = false;
  childrenActive: boolean = false;

}