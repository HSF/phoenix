import { OnInit } from '@angular/core';
import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-ss-mode',
  templateUrl: './ss-mode.component.html',
  styleUrls: ['./ss-mode.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SSModeComponent implements OnInit {
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
}
