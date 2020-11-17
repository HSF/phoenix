import { Component, OnInit } from '@angular/core';
import { EventDisplayService } from 'phoenix-ui-components';

@Component({
  selector: 'app-geometry',
  templateUrl: './geometry.component.html',
  styleUrls: ['./geometry.component.scss']
})
export class GeometryComponent implements OnInit {

  constructor(private eventDisplay: EventDisplayService) { }

  ngOnInit() {
    this.eventDisplay.init({});
    var parameters = { ModuleName: "Module 2", Xdim: 10., Ydim: 1., Zdim: 45, NumPhiEl: 64, NumZEl: 10, Radius: 75, MinZ: -250, MaxZ: 250, TiltAngle: 0.3, PhiOffset: 0.0, Colour: 0x00ff00, EdgeColour: 0x449458 };
    this.eventDisplay.buildGeometryFromParameters(parameters);
  }

}
