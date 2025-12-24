import {
  Component,
  ViewEncapsulation,
  type OnDestroy,
  type OnInit,
} from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-ss-mode',
  templateUrl: './ss-mode.component.html',
  styleUrls: ['./ss-mode.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SSModeComponent implements OnInit, OnDestroy {
  ssMode: boolean = false;

  ngOnInit() {
    document.onfullscreenchange = () => {
      if (!document.fullscreenElement) {
        this.toggleSSMode();
      }
    };
  }

  toggleSSMode() {
    this.ssMode = !this.ssMode;
    document.body.classList.toggle('ss-mode');
    if (this.ssMode) {
      // WORKAROUND - Adding the event listener directly somehow calls it on the first click
      setTimeout(() => {
        document.addEventListener('click', this.onDocumentClick);
        document.addEventListener('touchstart', this.onDocumentClick);
      }, 1);
      document.documentElement.requestFullscreen?.();
    } else {
      document.removeEventListener('click', this.onDocumentClick);
      document.removeEventListener('touchstart', this.onDocumentClick);
    }
  }

  private onDocumentClick = () => {
    document.exitFullscreen?.();
  };

  /**
   * Clean up event listeners and fullscreen state when the component is destroyed.
   */
  ngOnDestroy() {
    // Prevent any further toggleSSMode calls from fullscreenchange during teardown.
    document.onfullscreenchange = null;
    // Remove input event listeners.
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('touchstart', this.onDocumentClick);
    // If still in fullscreen or ssMode is active, exit fullscreen and reset UI state.
    if (document.fullscreenElement || this.ssMode) {
      document.exitFullscreen?.();
    }
    // Ensure the ss-mode class and internal state are cleared.
    document.body.classList.remove('ss-mode');
    this.ssMode = false;
  }
}
