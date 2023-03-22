import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-experiment-link',
  templateUrl: './experiment-link.component.html',
  styleUrls: ['./experiment-link.component.scss'],
})
export class ExperimentLinkComponent implements OnInit {
  private experimentLink: string;

  ngOnInit() {
    // we just want to remove the "&embed=true" instruction here.
    const regex = /\&embed=true/
    this.experimentLink = window.location.href.replace(regex,'');
  }

  goToExperiment() {
    window.open(this.experimentLink, '_blank');
  }
}
