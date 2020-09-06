import { Component, AfterViewInit } from '@angular/core';
import { EventdisplayService } from '../../services/eventdisplay.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {

  year: number;

  constructor(private eventDisplay: EventdisplayService) {
    this.year = new Date().getFullYear();
  }

  ngAfterViewInit() {
    this.eventDisplay.instance.getUIManager().detectColorScheme();
  }

}
