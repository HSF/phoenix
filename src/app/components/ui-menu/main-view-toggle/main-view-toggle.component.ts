import { Component } from '@angular/core';
import { UIService } from 'src/app/services/ui.service';

@Component({
  selector: 'app-main-view-toggle',
  templateUrl: './main-view-toggle.component.html',
  styleUrls: ['./main-view-toggle.component.scss']
})
export class MainViewToggleComponent {

  orthographicView: boolean = false;

  constructor(private ui: UIService) { }

  switchMainView() {
    this.orthographicView = !this.orthographicView;
    this.ui.toggleOrthographicView(this.orthographicView);
  }

}
