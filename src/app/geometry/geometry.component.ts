import {Component, OnInit} from '@angular/core';
import {EventdisplayService} from '../services/eventdisplay.service';
import {Configuration} from '../services/configuration';

@Component({
  selector: 'app-geometry',
  templateUrl: './geometry.component.html',
  styleUrls: ['./geometry.component.css']
})
export class GeometryComponent implements OnInit {

  private eventDisplay: EventdisplayService;

  constructor() {
    this.eventDisplay = new EventdisplayService();
  }

  ngOnInit() {
    const parameters = {
      moduleName: 'Module 2',
      xDim: 10.,
      yDim: 1.,
      zDim: 45,
      numPhiEl: 64,
      numZEl: 10,
      radius: 75,
      minZ: -250,
      maxZ: 250,
      tiltAngle: 0.3,
      phiOffset: 0.0,
      colour: 0x41a6f4,
      edgeColour: 0x41a6f4
    };
    this.eventDisplay.init(new Configuration());
    this.eventDisplay.buildGeometryFromParameters(parameters);
  }

}
