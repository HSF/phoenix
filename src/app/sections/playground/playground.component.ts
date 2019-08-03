import {Component, OnInit} from '@angular/core';
import {EventdisplayService} from '../../services/eventdisplay.service';
import {Configuration} from '../../services/loaders/configuration.model';
import {PresetView} from '../../services/extras/preset-view.model';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent implements OnInit {
  // Attributes for displaying the information of selected objects
  hiddenSelectedInfo = true;
  hiddenSelectedInfoBody = true;
  selectedObject: any;
  // Array containing the keys of the multiple loaded events
  events: string[];

  constructor(protected eventDisplay: EventdisplayService) {
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

  changeEvent(selected: any) {
    const value = selected.target.value;
    this.eventDisplay.loadEvent(value);
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

  processJSON(json: any) {
    this.events = this.eventDisplay.loadEventsFromJSON(json);
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

  processOBJ(content: any, name: any) {
    this.eventDisplay.loadGeometryFromOBJContent(content, name);
  }

  handleSceneInput(files: any) {
    const file = files[0];
    const reader = new FileReader();
    if (file.name.split('.').pop() === 'phnx') {
      reader.onload = () => {
        this.processScene(reader.result.toString());
      };
      reader.readAsText(file);
    } else {
      console.log('Error : ¡ Invalid file format !');
    }
  }

  processScene(content: any) {
    this.eventDisplay.loadDisplay(content);
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

  processGLTF(content: any) {
    this.eventDisplay.loadGLTF(content);
  }

  toggleInfo() {
    this.hiddenSelectedInfo = !this.hiddenSelectedInfo;
  }

  exportToOBJ() {
    this.eventDisplay.exportToOBJ();
  }
}
