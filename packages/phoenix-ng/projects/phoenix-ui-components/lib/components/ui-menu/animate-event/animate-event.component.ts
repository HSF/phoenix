import { Component } from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';
import type { PileupEvent } from 'phoenix-event-display';

@Component({
  standalone: false,
  selector: 'app-animate-event',
  templateUrl: './animate-event.component.html',
  styleUrls: ['./animate-event.component.scss'],
})
export class AnimateEventComponent {
  /** True while the standard single-event animation is running. */
  isAnimating: boolean = false;

  /** True while the pileup animation is running. */
  isPileupAnimating: boolean = false;

  constructor(private eventDisplay: EventDisplayService) {}

  /** Toggle the standard single-event collision animation. */
  toggleAnimateEvent(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.eventDisplay.animateEventWithCollision(10000, () => {
      this.isAnimating = false;
    });
  }

  /**
   * Toggle the pileup animation.
   *
   * In production, replace `syntheticPileup` with real data loaded from a
   * JSON file that matches the PileupEvent format:
   *
   *   {
   *     "interactions": [
   *       { "timestamp": 0,  "vertex": { "x": 0, "y": 0, "z": -45 }, "tracks": [] },
   *       { "timestamp": 32, "vertex": { "x": 0, "y": 0, "z":  12 }, "tracks": [] }
   *     ]
   *   }
   *
   * Feed that object directly to this.eventDisplay.animatePileup().
   */
  toggleAnimatePileup(): void {
    if (this.isPileupAnimating) return;
    this.isPileupAnimating = true;

    // Safety fallback (prevents UI from getting stuck)
    const safetyTimer = setTimeout(() => {
      this.isPileupAnimating = false;
    }, 8000); // slightly more than 6000ms

    const syntheticPileup: PileupEvent = {
      interactions: Array.from({ length: 20 }, (_, i) => ({
        timestamp: i * 15,
        vertex: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
          z: (Math.random() - 0.5) * 300,
        },
        tracks: [],
      })),
    };

    this.eventDisplay.animatePileup(syntheticPileup, 6000, () => {
      clearTimeout(safetyTimer); // cancel fallback if success
      this.isPileupAnimating = false;
    });
  }
}
