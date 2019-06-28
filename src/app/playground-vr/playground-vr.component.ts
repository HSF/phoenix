import { Component, OnInit } from '@angular/core';
import {EventdisplayService} from '../services/eventdisplay.service';
import {Configuration} from '../services/configuration';

@Component({
  selector: 'app-playground-vr',
  templateUrl: './playground-vr.component.html',
  styleUrls: ['./playground-vr.component.css']
})
export class PlaygroundVrComponent implements OnInit {

  constructor(private eventDisplay: EventdisplayService) { }

  ngOnInit() {
    this.eventDisplay.initVR(new Configuration());
  }

}
