import { Component } from '@angular/core';
import { AnimationPreset, SceneManager } from 'phoenix-event-display';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  selector: 'app-animate-camera',
  templateUrl: './animate-camera.component.html',
  styleUrls: ['./animate-camera.component.scss'],
})
export class AnimateCameraComponent {
  animationPresets: {
    [key: string]: AnimationPreset;
  } = {
    'Preset 1': {
      positions: [
        {
          position: [11976, 7262, 11927],
          duration: 1000,
        },
        {
          position: [1000, 0, 11927],
          duration: 1000,
        },
        {
          position: [-1000, 0, 1000],
          duration: 2000,
        },
        {
          position: [-5000, 0, 1000],
          duration: 3000,
        },
        {
          position: [-5000, 0, 1000],
          duration: 2000,
        },
        {
          position: [11976, 7262, 11927],
          duration: 2000,
        },
      ],
      animateEventAfterInterval: 3000,
      collisionDuration: 2500,
    },
  };

  animationPresetsKeys = Object.keys(this.animationPresets);

  constructor(private eventDisplay: EventDisplayService) {}

  animateScene(preset: string) {
    this.setDetectorOpacity(0.2);
    this.eventDisplay.animateScene(this.animationPresets[preset]);
    this.setDetectorOpacity(1);
  }

  animateCamera() {
    this.eventDisplay.animateThroughEvent([11976, 7262, 11927], 3000);
  }

  private setDetectorOpacity(opacity: number) {
    this.eventDisplay
      .getThreeManager()
      .getSceneManager()
      .setGeometryOpacity(SceneManager.GEOMETRIES_ID, opacity);
  }
}
