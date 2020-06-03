import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from 'src/app/services/eventdisplay.service';
import * as TWEEN from '@tweenjs/tween.js';

/**
 * Component for adding zoom controls for the main and overlay cameras.
 */
@Component({
  selector: 'app-zoom-controls',
  templateUrl: './zoom-controls.component.html',
  styleUrls: ['./zoom-controls.component.scss']
})
export class ZoomControlsComponent implements OnInit {

  /** All camera being used by the scene. */
  allCameras: any[];
  /** Factor to zoom by. */
  private zoomFactor: number = 1.1;
  /** Array containing pairs of camera and their zoom animation. */
  private animCameraPairs: any[] = [];
  /** Timeout for clearing mouse hold. */
  private zoomTimeout: any;
  /** The speed and time of zoom. */
  private zoomTime: number = 200;

  constructor(private eventdisplay: EventdisplayService) { }

  /**
   * Get all the cameras and set up their zoom animations.
   */
  ngOnInit(): void {
    this.allCameras = this.eventdisplay.getAllCameras();
    for (const camera of this.allCameras) {
      const animation = camera.isOrthographicCamera
        ? new TWEEN.Tween(camera)
        : new TWEEN.Tween(camera.position);
      this.animCameraPairs.push({
        'camera': camera,
        'anim': animation
      });
    }
  }

  /**
   * Zoom all the cameras by a specific zoom factor.
   * The factor may either be greater or smaller.
   * @param zoomFactor The factor to zoom by.
   */
  zoomTo(zoomFactor: number) {
    this.zoomTime = this.zoomTime > 30
      ? Math.floor(this.zoomTime / 1.1)
      : this.zoomTime;

    for (const animCameraPair of this.animCameraPairs) {
      const camera = animCameraPair['camera'];
      const anim = animCameraPair['anim'];
      if (camera.isOrthographicCamera) {
        anim.to({
          zoom: camera.zoom * (1 / zoomFactor)
        }, this.zoomTime);
        camera.updateProjectionMatrix();
      } else {
        const cameraPosition = camera.position;
        anim.to(
          {
            x: cameraPosition.x * zoomFactor,
            y: cameraPosition.y * zoomFactor,
            z: cameraPosition.z * zoomFactor
          },
          this.zoomTime
        );
      }
      anim.start();
    }

    this.zoomTimeout = setTimeout(() => {
      this.zoomTo(zoomFactor);
    }, this.zoomTime);
  }

  /**
   * Zoom the camera in.
   */
  zoomIn(leftClick: boolean) {
    if (leftClick) {
      this.zoomTo(1 / this.zoomFactor);
    }
  }

  /**
   * Zoom the camera out.
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
