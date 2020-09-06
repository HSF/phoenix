import { Component } from '@angular/core';
import { EventdisplayService } from '../../../services/eventdisplay.service';

@Component({
  selector: 'app-main-view-toggle',
  templateUrl: './main-view-toggle.component.html',
  styleUrls: ['./main-view-toggle.component.scss']
})
export class MainViewToggleComponent {

  orthographicView: boolean = false;

  constructor(private eventDisplay: EventdisplayService) { }

  switchMainView() {
    this.orthographicView = !this.orthographicView;
    this.eventDisplay.instance.getUIManager().toggleOrthographicView(this.orthographicView);
  }

}
