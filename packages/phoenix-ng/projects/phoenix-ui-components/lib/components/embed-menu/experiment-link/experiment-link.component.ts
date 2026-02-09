import { Component, type OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-experiment-link',
  templateUrl: './experiment-link.component.html',
  styleUrls: ['./experiment-link.component.scss'],
})
export class ExperimentLinkComponent implements OnInit {
  private experimentLink: string;

  ngOnInit() {
    // we just want to remove the "&embed=true" instruction here.
    const url = new URL(window.location.href);
    url.searchParams.delete('embed');
    this.experimentLink = url.toString();
  }

  goToExperiment() {
    window.open(this.experimentLink, '_blank');
  }
}
