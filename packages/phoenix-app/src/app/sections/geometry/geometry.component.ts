import { Component, OnInit } from '@angular/core';
import { EventDisplayService } from '../../services/event-display.service';
import { Configuration } from 'phoenix-event-display';

@Component({
  selector: 'app-geometry',
  templateUrl: './geometry.component.html',
  styleUrls: ['./geometry.component.scss']
})
export class GeometryComponent implements OnInit {

  constructor(private eventDisplay: EventDisplayService) {
  }

  ngOnInit() {
    this.eventDisplay.init(new Configuration());
  }

}
