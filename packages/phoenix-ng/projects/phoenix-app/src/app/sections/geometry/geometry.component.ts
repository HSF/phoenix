import { Component, type OnInit, type OnDestroy } from '@angular/core';
import { EventDisplayService } from 'phoenix-ui-components';

@Component({
  standalone: false, // this is now required when using NgModule
  selector: 'app-geometry',
  templateUrl: './geometry.component.html',
  styleUrls: ['./geometry.component.scss'],
})
export class GeometryComponent implements OnInit, OnDestroy {
  loaded = false;
  loadingProgress = 0;

  /** Prevents callbacks on destroyed component */
  private isDestroyed = false;

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit() {
    this.eventDisplay.init({});
    const parameters = {
      ModuleName: 'Module 2',
      Xdim: 10,
      Ydim: 1,
      Zdim: 45,
      NumPhiEl: 64,
      NumZEl: 10,
      Radius: 75,
      MinZ: -250,
      MaxZ: 250,
      TiltAngle: 0.3,
      PhiOffset: 0.0,
      Colour: 0x00ff00,
      EdgeColour: 0x449458,
    };
    this.eventDisplay.buildGeometryFromParameters(parameters);

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

  copyCode() {
    const code = document.getElementById('geometryCode').textContent.trim();
    const inputElement = document.createElement('input');
    document.body.appendChild(inputElement);
    inputElement.value = code;
    inputElement.select();
    document.execCommand('copy');
    document.body.removeChild(inputElement);
  }
}
