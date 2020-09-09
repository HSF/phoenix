import { Component } from '@angular/core';
import { EventDisplayService } from '../../../services/eventdisplay.service';

@Component({
  selector: 'app-main-view-toggle',
  templateUrl: './main-view-toggle.component.html',
  styleUrls: ['./main-view-toggle.component.scss']
})
export class MainViewToggleComponent {

  orthographicView: boolean = false;

  constructor(private eventDisplay: EventDisplayService) { }

  switchMainView() {
    this.orthographicView = !this.orthographicView;
    this.eventDisplay.getUIManager().toggleOrthographicView(this.orthographicView);
  }

}
