import {
  Component,
  Input,
  type OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  standalone: false,
  selector: 'app-make-picture',
  templateUrl: './make-picture.component.html',
  styleUrls: ['./make-picture.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MakePictureComponent implements OnInit {
  fittings: string[] = ['Crop', 'Stretch'];
  fitting: string = 'Crop';
  width: number = 3840;
  height: number = 2160;
  disabled: boolean = false;
  ssMode: boolean = false;
  constructor(private eventDisplay: EventDisplayService) {}
  ngOnInit() {
    document.onfullscreenchange = () => {
      if (!document.fullscreenElement && this.ssMode) {
        this.toggleSSMode();
      }
    };
  }

  setWidth(value) {
    this.width = value;
    this.disabled = false;
  }
  setHeight(value) {
    this.height = value;
    this.disabled = false;
  }
  buttonText() {
    return 'Create picture';
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
  makePicture() {
    this.eventDisplay
      .getThreeManager()
      .makeScreenShot(this.width, this.height, this.fitting);
  }

  private onDocumentClick = () => {
    document.exitFullscreen?.();
  };
}
