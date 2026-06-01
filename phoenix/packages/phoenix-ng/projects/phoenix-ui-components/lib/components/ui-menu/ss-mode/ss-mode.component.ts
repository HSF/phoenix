import { type OnInit, Output, EventEmitter } from '@angular/core';
import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-ss-mode',
  templateUrl: './ss-mode.component.html',
  styleUrls: ['./ss-mode.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SSModeComponent implements OnInit {
  ssMode: boolean = false;

  /** Emits when SS mode is exited, so parent components can clean up. */
  @Output() ssModeExited = new EventEmitter<void>();

  ngOnInit() {
    document.onfullscreenchange = () => {
      if (!document.fullscreenElement) {
        this.exitSSMode();
      }
    };
  }

  toggleSSMode() {
    if (this.ssMode) {
      document.exitFullscreen?.();
    } else {
      this.enterSSMode();
    }
  }

  enterSSMode(onReady?: () => void) {
    if (this.ssMode) {
      onReady?.();
      return;
    }
    this.ssMode = true;
    document.body.classList.add('ss-mode');
    // WORKAROUND - Adding the event listener directly somehow calls it on the first click
    setTimeout(() => {
      document.addEventListener('click', this.onDocumentClick);
      document.addEventListener('touchstart', this.onDocumentClick);
      onReady?.();
    }, 1);
    document.documentElement.requestFullscreen?.();
  }

  exitSSMode() {
    if (!this.ssMode) return;
    this.ssMode = false;
    document.body.classList.remove('ss-mode');
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('touchstart', this.onDocumentClick);
    this.ssModeExited.emit();
  }

  private onDocumentClick = () => {
    document.exitFullscreen?.();
  };
}
