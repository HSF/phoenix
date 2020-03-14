import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from 'src/app/services/eventdisplay.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-io-options-dialog',
  templateUrl: './io-options-dialog.component.html',
  styleUrls: ['./io-options-dialog.component.scss']
})
export class IOOptionsDialogComponent {

  constructor(private eventDisplay: EventdisplayService, public dialogRef: MatDialogRef<IOOptionsDialogComponent>) { }

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

  handleGLTFInput(files: any) {
    const callback = this.processGLTF;
    this.handleFileInput(files, 'gltf', callback);
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
    evDisplay.parsePhoenixEvents(json);
  }

  processOBJ(content: any, name: any, evDisplay: EventdisplayService) {
    evDisplay.parseOBJGeometry(content, name);
  }

  processScene(content: any, name: string, evDisplay: EventdisplayService) {
    evDisplay.parsePhoenixDisplay(content);
  }

  processGLTF(content: any, name: string, evDisplay: EventdisplayService) {
    evDisplay.parseGLTFGeometry(content);
  }

}
