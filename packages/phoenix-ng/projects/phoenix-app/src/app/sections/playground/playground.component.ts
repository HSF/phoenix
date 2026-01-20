import { Component, type OnInit, type OnDestroy } from '@angular/core';
import { EventDisplayService } from 'phoenix-ui-components';
import { type Configuration, PresetView } from 'phoenix-event-display';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: false,
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss'],
})
export class PlaygroundComponent implements OnInit, OnDestroy {
  loaded = false;
  loadingProgress = 0;

  /** Prevents callbacks on destroyed component */
  private isDestroyed = false;

  constructor(
    protected eventDisplay: EventDisplayService,
    protected http: HttpClient,
  ) {}

  ngOnInit() {
    const configuration: Configuration = {
      presetViews: [
        new PresetView('Left View', [0, 0, -12000], [0, 0, 0], 'left-cube'),
        new PresetView('Center View', [-500, 12000, 0], [0, 0, 0], 'top-cube'),
        new PresetView('Right View', [0, 0, 12000], [0, 0, 0], 'right-cube'),
      ],
    };
    this.eventDisplay.init(configuration);

    this.eventDisplay.getLoadingManager().addProgressListener((progress) => {
      if (!this.isDestroyed) {
        this.loadingProgress = progress;
      }
    });

    this.eventDisplay.getLoadingManager().addLoadListenerWithCheck(() => {
      if (!this.isDestroyed) {
        this.loaded = true;
      }
    });
  }

  ngOnDestroy() {
    this.isDestroyed = true;
  }
}
