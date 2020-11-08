import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-ss-mode',
  templateUrl: './ss-mode.component.html',
  styleUrls: ['./ss-mode.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SSModeComponent {
  ssMode: boolean = false;

  toggleSSMode() {
    this.ssMode = !this.ssMode;
    document.body.classList.toggle('ss-mode');
    if (this.ssMode) {
      document.addEventListener('keydown', this.onEscapePress);
      // WORKAROUND - Adding the event listener directly somehow calls it on the first click
      setTimeout(() => {
        document.addEventListener('click', this.onDoubleClick);
      }, 1);
    } else {
      document.removeEventListener('keydown', this.onEscapePress);
      document.removeEventListener('click', this.onDoubleClick);
    }
  }

  private onEscapePress = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.toggleSSMode();
    }
  }

  private onDoubleClick = () => {
    this.toggleSSMode();
  }

}
