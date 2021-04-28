import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-experiment-link',
  templateUrl: './experiment-link.component.html',
  styleUrls: ['./experiment-link.component.scss'],
})
export class ExperimentLinkComponent implements OnInit {
  private experimentLink: string;

  ngOnInit() {
    this.experimentLink = window.location.href.split('?')[0];
  }

  goToExperiment() {
    window.open(this.experimentLink, '_blank');
  }
}
