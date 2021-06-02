import { Component } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  selector: 'app-animate-camera',
  templateUrl: './animate-camera.component.html',
  styleUrls: ['./animate-camera.component.scss'],
})
export class AnimateCameraComponent {
  animationPresets: {
    [key: string]: {
      positions: { position: number[]; duration: number }[];
      animateEventAfterInterval: number;
      collisionDuration: number;
    };
  } = {
    'Preset 1': {
      positions: [
        {
          position: [11976, 7262, 11927],
          duration: 2000,
        },
        {
          position: [11976, 7262, 11927],
          duration: 2000,
        },
        {
          position: [11976, 7262, 11927],
          duration: 2000,
        },
      ],
      animateEventAfterInterval: 3000,
      collisionDuration: 2000,
    },
  };
  animationPresetsKeys = Object.keys(this.animationPresets);

  constructor(private eventDisplay: EventDisplayService) {}

  animateScene(preset: string) {
    const { positions, animateEventAfterInterval, collisionDuration } =
      this.animationPresets[preset];

    this.eventDisplay.animateScene(
      positions,
      animateEventAfterInterval,
      collisionDuration
    );
  }

  animateCamera() {
    this.eventDisplay.animateThroughEvent([11976, 7262, 11927], 3000);
  }
}
