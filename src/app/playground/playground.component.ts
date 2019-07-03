import {Component, OnInit} from '@angular/core';
import {EventdisplayService} from '../services/eventdisplay.service';
import {Configuration} from '../services/configuration';
import {PresetView} from '../services/preset-view';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.css']
})
export class PlaygroundComponent implements OnInit {
  hiddenInfo = true;

  constructor(private eventDisplay: EventdisplayService) {
  }

  ngOnInit() {
    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Right View', [0, 0, 6000], 'right.svg'),
      new PresetView('Center View', [-500, 1000, 0], 'circle.svg'),
      new PresetView('Left View', [0, 0, -6000], 'left.svg')
    ];
    this.eventDisplay.init(configuration);
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

  toggleInfo() {
    this.hiddenInfo = !this.hiddenInfo;
  }
}
