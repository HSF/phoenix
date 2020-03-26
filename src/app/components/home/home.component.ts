import { Component, OnInit, AfterViewInit } from '@angular/core';
import { EventdisplayService } from '../../services/eventdisplay.service';
import { UIService } from '../../services/ui.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {

  constructor(private ui: UIService) {
  }

  ngAfterViewInit() {
    this.ui.detectColorScheme();
  }

}
