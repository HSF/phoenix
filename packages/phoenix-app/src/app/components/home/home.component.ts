import { Component, AfterViewInit } from '@angular/core';
import { EventDisplayService } from '../../services/eventdisplay.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {

  year: number;

  constructor(private eventDisplay: EventDisplayService) {
    this.year = new Date().getFullYear();
  }

  ngAfterViewInit() {
    this.eventDisplay.getUIManager().detectColorScheme();
  }

}
