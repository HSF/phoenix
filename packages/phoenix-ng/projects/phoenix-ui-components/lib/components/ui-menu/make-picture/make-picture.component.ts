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
  constructor(private eventDisplay: EventDisplayService) {}
  ngOnInit() {}

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
  makePicture() {
    this.eventDisplay
      .getThreeManager()
      .makeScreenShot(this.width, this.height, this.fitting);
  }
}
