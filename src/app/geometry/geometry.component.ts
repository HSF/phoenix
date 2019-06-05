import { Component, OnInit } from '@angular/core';
import {EventdisplayService} from '../services/eventdisplay.service';

@Component({
  selector: 'app-geometry',
  templateUrl: './geometry.component.html',
  styleUrls: ['./geometry.component.css']
})
export class GeometryComponent implements OnInit {

  constructor(private eventDisplay: EventdisplayService) { }

  ngOnInit() {
    this.eventDisplay.task1();
  }

}
