import { Component, OnInit } from '@angular/core';
import { EventDisplayService } from 'phoenix-ui-components';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  PhoenixMenuNode,
  Configuration,
  TrackmlLoader,
  PresetView,
} from 'phoenix-event-display';

@Component({
  selector: 'app-trackml',
  templateUrl: './trackml.component.html',
  styleUrls: ['./trackml.component.scss'],
})
export class TrackmlComponent implements OnInit {
  hitsFile = 'assets/files/TrackML/event000001000-hits.csv';
  particlesFile = 'assets/files/TrackML/event000001000-particles.csv';
  truthFile = 'assets/files/TrackML/event000001000-truth.csv';
  filesProcessed = 0;
  numFiles = 3;
  trackMLLoader: TrackmlLoader;
  httpOptions = {
    headers: new HttpHeaders({}),
    responseType: 'text' as 'json',
  };
  phoenixMenuRoot: PhoenixMenuNode = new PhoenixMenuNode(
    'Phoenix Menu',
    'phoenix-menu'
  );
  loaded = false;
  loadingProgress = 0;

  constructor(
    private eventDisplay: EventDisplayService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.trackMLLoader = new TrackmlLoader();

    const configuration: Configuration = {
      eventDataLoader: this.trackMLLoader,
      presetViews: [
        new PresetView('Right View', [0, 0, 6000], [0, 0, 0], 'right-cube'),
        new PresetView('Center View', [-500, 1000, 0], [0, 0, 0], 'top-cube'),
        new PresetView('Left View', [0, 0, -6000], [0, 0, 0], 'left-cube'),
      ],
      defaultView: [4000, 0, 4000, 0, 0, 0],
      phoenixMenuRoot: this.phoenixMenuRoot,
    };

    this.eventDisplay.init(configuration);
    this.eventDisplay.loadOBJGeometry(
      'assets/geometry/TrackML/strip_long_simplified.obj',
      'Long Strip',
      0xe9a23b,
      undefined,
      true
    );
    this.eventDisplay.loadOBJGeometry(
      'assets/geometry/TrackML/pixel_simplified.obj',
      'Pixel',
      0xe2a9e8,
      undefined,
      true
    );
    this.eventDisplay.loadOBJGeometry(
      'assets/geometry/TrackML/strip_short_simplified.obj',
      'Short Strip',
      0x369f95,
      undefined,
      true
    );
    this.eventDisplay.loadOBJGeometry(
      'assets/geometry/TrackML/beampipe_simplified.obj',
      'Beampipe',
      0x7f7f7f,
      undefined,
      true
    );
    this.eventDisplay.loadOBJGeometry(
      'assets/geometry/TrackML/pixel_support_tube_simplified.obj',
      'PST',
      0x7bb3ff,
      undefined,
      true
    );
    this.loadTrackMLData();

    this.eventDisplay
      .getLoadingManager()
      .addProgressListener((progress) => (this.loadingProgress = progress));

    this.eventDisplay
      .getLoadingManager()
      .addLoadListenerWithCheck(() => (this.loaded = true));
  }

  private loadTrackMLData() {
    this.http.get(this.hitsFile, this.httpOptions).subscribe((resHits: any) => {
      this.loadHits(resHits);
      this.http
        .get(this.particlesFile, this.httpOptions)
        .subscribe((resParticles: any) => {
          this.loadParticles(resParticles);
          this.http
            .get(this.truthFile, this.httpOptions)
            .subscribe((resTruth: any) => this.loadTruth(resTruth));
        });
    });
  }

  private loadHits(res: any) {
    console.log('loading hits');
    this.trackMLLoader.processHits(res);
    this.filesProcessed++;
    this.finishConversion();
  }

  private loadParticles(res: any) {
    console.log('loading particles');
    this.trackMLLoader.processParticles(res);
    this.filesProcessed++;
    this.finishConversion();
  }

  private loadTruth(res: any) {
    console.log('loading truth');
    this.trackMLLoader.processTruth(res);
    this.filesProcessed++;
    this.finishConversion();
  }

  private finishConversion() {
    if (this.filesProcessed === this.numFiles) {
      const eventData = this.trackMLLoader.getEventData('TrackMLEvent');
      this.eventDisplay.buildEventDataFromJSON(eventData);
    }
  }
}
