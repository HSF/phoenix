import {Component, OnInit} from '@angular/core';
import {EventdisplayService} from '../services/eventdisplay.service';

@Component({
  selector: 'app-task1',
  templateUrl: './task1.component.html',
  styleUrls: ['./task1.component.css']
})
export class Task1Component implements OnInit {

  constructor(private eventDisplay: EventdisplayService) {
  }

  ngOnInit() {
    this.eventDisplay.task1();
  }

}
