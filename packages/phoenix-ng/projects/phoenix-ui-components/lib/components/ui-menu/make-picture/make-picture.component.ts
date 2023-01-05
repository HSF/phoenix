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
  constructor(private eventDisplay: EventDisplayService) {}
  ngOnInit() {}
  setWidth(value) {
    this.width = value;
  }
  setHeight(value) {
    this.height = value;
  }

  makePicture() {
    this.eventDisplay.makeScreenShot(this.width, this.height, this.fitting);
  }
}
