import { Component, OnInit } from '@angular/core';
import {EventdisplayService} from '../services/eventdisplay.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  private eventDisplay: EventdisplayService;

  constructor() {
    this.eventDisplay = new EventdisplayService();
  }

  ngOnInit() {
    this.eventDisplay.clearDisplay();
  }

}
