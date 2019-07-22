import {Component, OnInit} from '@angular/core';
import {EventdisplayService} from '../services/eventdisplay.service';
import {Configuration} from '../services/loaders/configuration.model';
import {PresetView} from '../services/extras/preset-view.model';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent implements OnInit {
  hiddenInfo = true;
  hiddenInfoBody = true;
  selectedObject: any;
  events: string[];

  constructor(private eventDisplay: EventdisplayService) {
  }

  ngOnInit() {
    this.selectedObject = {name: 'Object', attributes: []};
    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -6000], 'left.svg'),
      new PresetView('Center View', [-500, 1000, 0], 'circle.svg'),
      new PresetView('Right View', [0, 0, 6000], 'right.svg')
    ];
    this.eventDisplay.init(configuration);
    this.eventDisplay.allowSelection(this.selectedObject);
  }


  saveConfiguration() {
    this.eventDisplay.saveDisplay();
  }

  toggleInfo() {
    this.hiddenInfo = !this.hiddenInfo;
  }

  onOptionsSelected(selected: any) {
    const value = selected.target.value;
    this.eventDisplay.loadEvent(value);
  }

  processJSON(json: any) {
    this.events = this.eventDisplay.loadEventsFromJSON(json);
  }

  processOBJ(content: any, name: any) {
    this.eventDisplay.loadGeometryFromOBJContent(content, name);
  }

  processGLTF(content: any) {
    this.eventDisplay.loadDisplay(content);
  }

  handleEventDataInput(files: any) {
    const file = files[0];
    const reader = new FileReader();
    if (file.type === 'application/json') {
      reader.onload = () => {
        const json = JSON.parse(reader.result.toString());
        this.processJSON(json);
      };
      reader.readAsText(file);
    } else {
      console.log('Error : ¡ Invalid file format !');
    }
  }

  handleOBJInput(files: any) {
    const file = files[0];
    const reader = new FileReader();
    if (file.name.split('.').pop() === 'obj') {
      reader.onload = () => {
        this.processOBJ(reader.result.toString(), file.name.split('.')[0]);
      };
      reader.readAsText(file);
    } else {
      console.log('Error : ¡ Invalid file format !');
    }
  }

  handleGLTFInput(files: any) {
    const file = files[0];
    const reader = new FileReader();
    if (file.name.split('.').pop() === 'gltf') {
      reader.onload = () => {
        this.processGLTF(reader.result.toString());
      };
      reader.readAsText(file);
    } else {
      console.log('Error : ¡ Invalid file format !');
    }
  }
}
