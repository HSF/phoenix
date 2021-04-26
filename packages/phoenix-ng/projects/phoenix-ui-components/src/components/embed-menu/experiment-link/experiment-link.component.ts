import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-experiment-link',
  templateUrl: './experiment-link.component.html',
  styleUrls: ['./experiment-link.component.scss'],
})
export class ExperimentLinkComponent {
  @Input() experimentLink: string;

  goToExperiment() {
    window.open('this.experimentLink', '_blank');
  }
}
