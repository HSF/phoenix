import { Component, OnInit, AfterViewInit } from '@angular/core';
import { EventdisplayService } from '../../services/eventdisplay.service';
import { UIService } from '../../services/ui.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {

  year: number;

  constructor(private ui: UIService) {
    this.year = new Date().getFullYear();
  }

  ngAfterViewInit() {
    this.ui.detectColorScheme();
  }

}
