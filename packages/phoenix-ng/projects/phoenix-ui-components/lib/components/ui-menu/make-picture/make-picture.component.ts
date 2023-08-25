import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
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
  constructor(private eventDisplay: EventDisplayService) {}
  ngOnInit() {}
  private checkSize() {
    return this.eventDisplay
      .getThreeManager()
      .checkScreenShotCanvasSize(this.width, this.height, this.fitting);
  }
  setWidth(value) {
    this.width = value;
    this.disabled = !this.checkSize();
  }
  setHeight(value) {
    this.height = value;
    this.disabled = !this.checkSize();
  }
  buttonText() {
    return this.disabled ? 'Size too large' : 'Create picture';
  }
  makePicture() {
    this.eventDisplay
      .getThreeManager()
      .makeScreenShot(this.width, this.height, this.fitting);
  }
}
