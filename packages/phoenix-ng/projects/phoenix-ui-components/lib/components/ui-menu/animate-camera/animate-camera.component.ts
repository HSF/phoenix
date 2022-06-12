import { Component, Input } from '@angular/core';
import { AnimationPreset, SceneManager } from 'phoenix-event-display';
import { EventDisplayService } from '../../../services/event-display.service';

export const defaultAnimationPresets: {
  [key: string]: AnimationPreset;
} = {
  'Preset 1': {
    positions: [
      {
        position: [11976, 7262, 11927],
        duration: 1000,
      },
      {
        position: [-1000, 0, 11927],
        duration: 2000,
      },
      {
        position: [2000, 500, 1000],
        duration: 3500,
      },
      {
        position: [5000, 2000, 1000],
        duration: 3000,
      },
      {
        position: [5000, 2000, 1000],
        duration: 2000,
      },
      {
        position: [11976, 7262, 11927],
        duration: 1000,
      },
    ],
    animateEventAfterInterval: 5000,
    collisionDuration: 6000,
  },
};

@Component({
  selector: 'app-animate-camera',
  templateUrl: './animate-camera.component.html',
  styleUrls: ['./animate-camera.component.scss'],
})
export class AnimateCameraComponent {
  @Input() animationPresets = defaultAnimationPresets;
  animationPresetsKeys = Object.keys(this.animationPresets);
  isAnimating = false;

  constructor(private eventDisplay: EventDisplayService) {}

  animatePreset(preset: string) {
    this.setDetectorOpacity(0.2);
    this.eventDisplay.animatePreset(this.animationPresets[preset], () => {
      this.setDetectorOpacity(1);
    });
  }

  animateCamera() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.eventDisplay.animateThroughEvent([11976, 7262, 11927], 3000, () => {
        this.isAnimating = false;
      });
    }
  }

  private setDetectorOpacity(opacity: number) {
    const sceneManager = this.eventDisplay.getThreeManager().getSceneManager();
    const geometriesGroup = sceneManager.getObjectByName(
      SceneManager.GEOMETRIES_ID
    );

    sceneManager.setGeometryOpacity(geometriesGroup, opacity);
  }
}
