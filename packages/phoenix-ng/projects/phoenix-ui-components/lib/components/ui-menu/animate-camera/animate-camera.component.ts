import { Component, Input } from '@angular/core';
import { type AnimationPreset, SceneManager } from 'phoenix-event-display';
import { EventDisplayService } from '../../../services/event-display.service';
import { Mesh } from 'three';

export const defaultAnimationPresets: {
  [key: string]: AnimationPreset;
} = {
  'Cavern to ID': {
    name: 'Cavern to ID',
    positions: [
      {
        position: [66388.95051168812, 5264.228603228927, -46910.7848593543],
        duration: 1000,
      },
      {
        position: [12834.18729094943, 677.7571205763458, 135.68755273443463],
        duration: 2000,
      },
      {
        position: [312.02688693297375, 25.884223757326, 270.10019006776236],
        duration: 3500,
      },
      {
        position: [263.3640855132258, 19.874838262525053, -318.16541790248885],
        duration: 3000,
      },
      {
        position: [5534.140362338047, 234.03507981484574, -2933.619479808285],
        duration: 2000,
      },
      {
        position: [2681.277288705242, 646.5795158318147, 5628.5248735111745],
        duration: 1000,
      },
      {
        position: [-6062.586283740076, 790.5876682946184, 1381.1675900848818],
        duration: 1000,
      },
      {
        position: [-1766.7693725879053, 1007.1048030984678, -5928.901341784575],
        duration: 1000,
      },
      {
        position: [12814.982506255355, 2516.987185037266, -22891.902734328327],
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

  constructor(private eventDisplay: EventDisplayService) {
    // this.animationPresets = this.eventDisplay
    //   .getUIManager()
    //   .getPresetAnimations();
    // This is too late to fill the UI! FIXME. EJWM
  }

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
      SceneManager.GEOMETRIES_ID,
    );

    sceneManager.setGeometryOpacity(geometriesGroup as Mesh, opacity);
  }
}
