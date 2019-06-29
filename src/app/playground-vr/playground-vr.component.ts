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

  handleFileInput(files: any) {
    const file = files[0];
    const reader = new FileReader();
    if (file.type === 'application/json') {
      reader.onload = () => {
        const json = JSON.parse(reader.result.toString());
        this.eventDisplay.buildEventDataFromJSON(json);
      };
      reader.readAsText(file);
    }
    if (file.name.split('.').pop() === 'obj') {
      reader.onload = () => {
        this.eventDisplay.loadGeometryFromOBJContent(reader.result.toString(), file.name.split('.')[0]);
      };
      reader.readAsText(file);
    }
    if (file.name.split('.').pop() === 'gltf') {
      reader.onload = () => {
        this.eventDisplay.loadDisplay(reader.result.toString());
      };
      reader.readAsText(file);
    } else {
      console.log('Error : ¡ Invalid file format !');
    }
  }

  saveConfiguration() {
    this.eventDisplay.saveDisplay();
  }
}
