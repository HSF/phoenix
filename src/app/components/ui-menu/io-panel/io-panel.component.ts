import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { EventdisplayService } from 'src/app/services/eventdisplay.service';

@Component({
  selector: 'app-io-panel',
  templateUrl: './io-panel.component.html',
  styleUrls: ['./io-panel.component.scss']
})
export class IOPanelComponent {

  constructor(private eventDisplay: EventdisplayService, public dialogRef: MatDialogRef<IOPanelComponent>) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  handleEventDataInput(files: any) {
    const callback = this.processEventData;
    this.handleFileInput(files, 'json', callback);
  }

  handleOBJInput(files: any) {
    const callback = this.processOBJ;
    this.handleFileInput(files, 'obj', callback);
  }

  handleSceneInput(files: any) {
    const callback = this.processScene;
    this.handleFileInput(files, 'phnx', callback);
  }

  handleFileInput(files: any, extension: string, callback) {
    const file = files[0];
    const reader = new FileReader();
    if (file.name.split('.').pop() === extension) {
      reader.onload = () => {
        callback(reader.result.toString(), file.name.split('.')[0], this.eventDisplay);
      };
      reader.readAsText(file);
    } else {
      console.log('Error : ¡ Invalid file format !');
    }
  }

  processEventData(content: any, name: string, evDisplay: EventdisplayService) {
    const json = JSON.parse(content);
    evDisplay.loadEventsFromJSON(json);
    // this.events = this.eventDisplay.loadEventsFromJSON(json);
    // this.collections = this.eventDisplay.getCollections();
  }

  processOBJ(content: any, name: any, evDisplay: EventdisplayService) {
    evDisplay.loadGeometryFromOBJContent(content, name);
  }

  processScene(content: any, name: string, evDisplay: EventdisplayService) {
    evDisplay.loadDisplay(content);
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

}
