import { Component } from '@angular/core';
import { EventdisplayService } from '../../../services/eventdisplay.service';

@Component({
  selector: 'app-auto-rotate',
  templateUrl: './auto-rotate.component.html',
  styleUrls: ['./auto-rotate.component.scss']
})
export class AutoRotateComponent {

  autoRotate = false;

  constructor(private eventDisplay: EventdisplayService) { }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    this.eventDisplay.instance.getUIManager().setAutoRotate(this.autoRotate);
  }

}
