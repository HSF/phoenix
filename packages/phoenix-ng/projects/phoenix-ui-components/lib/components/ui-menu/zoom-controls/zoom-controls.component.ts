import { Component } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';

/**
 * Component for adding zoom controls for the main and overlay cameras.
 */
@Component({
  selector: 'app-zoom-controls',
  templateUrl: './zoom-controls.component.html',
  styleUrls: ['./zoom-controls.component.scss'],
})
export class ZoomControlsComponent {
  /** All camera being used by the scene. */
  allCameras: any[];
  /** Factor to zoom by. */
  private zoomFactor: number = 1.1;
  /** Timeout for clearing mouse hold. */
  private zoomTimeout: any;
  /** The speed and time of zoom. */
  private zoomTime: number = 200;

  constructor(private eventDisplay: EventDisplayService) {}

  /**
   * Zoom all the cameras by a specific zoom factor.
   * The factor may either be greater (zoom in) or smaller (zoom out) than 1.
   * @param zoomFactor The factor to zoom by.
   */
  zoomTo(zoomFactor: number) {
    this.zoomTime =
      this.zoomTime > 30 ? Math.floor(this.zoomTime / 1.1) : this.zoomTime;

    this.eventDisplay.zoomTo(zoomFactor, this.zoomTime);

    this.zoomTimeout = setTimeout(() => {
      this.zoomTo(zoomFactor);
    }, this.zoomTime);
  }

  /**
   * Zoom the camera in.
   * @param leftClick Whether the mouse click is left or not.
   */
  zoomIn(leftClick: boolean) {
    if (leftClick) {
      this.zoomTo(1 / this.zoomFactor);
    }
  }

  /**
   * Zoom the camera out.
   * @param leftClick Whether the mouse click is left or not.s
   */
  zoomOut(leftClick: boolean) {
    if (leftClick) {
      this.zoomTo(this.zoomFactor);
    }
  }

  /**
   * Reset the zoom time which decreases upon hold and clear the zoom timeout.
   */
  clearZoom() {
    this.zoomTime = 200;
    clearTimeout(this.zoomTimeout);
  }
}
