import { Component, OnInit } from '@angular/core';
import { EventDisplayService } from '../../../../services/event-display.service';
import { MatDialogRef } from '@angular/material/dialog';
import { JiveXMLLoader } from 'phoenix-event-display';

@Component({
  selector: 'app-io-options-dialog',
  templateUrl: './io-options-dialog.component.html',
  styleUrls: ['./io-options-dialog.component.scss']
})
export class IOOptionsDialogComponent {

  constructor(private eventDisplay: EventDisplayService, public dialogRef: MatDialogRef<IOOptionsDialogComponent>) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  handleEventDataInput(files: any) {
    this.handleFileInput(files, 'json', this.processEventData.bind(this));
  }

  handleJiveXMLDataInput(files: any) {
    this.handleFileInput(files, 'xml', this.processJiveXML.bind(this));
  }

  handleOBJInput(files: any) {
    this.handleFileInput(files, 'obj', this.processOBJ.bind(this));
  }

  handleSceneInput(files: any) {
    this.handleFileInput(files, 'phnx', this.processScene.bind(this));
  }

  handleGLTFInput(files: any) {
    this.handleFileInput(files, 'gltf', this.processGLTF.bind(this));
  }

  handlePhoenixInput(files: any) {
    this.handleFileInput(files, 'phnx', this.processPhoenixScene.bind(this));
  }

  handleFileInput(
    files: any, extension: string,
    callback: (result: string, fileName: string) => void
  ) {
    const file = files[0];
    const reader = new FileReader();
    if (file.name.split('.').pop() === extension) {
      reader.onload = () => {
        callback(reader.result.toString(), file.name.split('.')[0]);
      };
      reader.readAsText(file);
    } else {
      console.log('Error : ¡ Invalid file format !');
    }
    this.onNoClick();
  }

  processEventData(content: any, name: string) {
    const json = JSON.parse(content);
    this.eventDisplay.parsePhoenixEvents(json);
  }

  processJiveXML(content: any, name: string) {
    console.log('Got JiveXML from ' + name);
    const jiveloader = new JiveXMLLoader();
    jiveloader.process(content);
    const eventData = jiveloader.getEventData();
    this.eventDisplay.buildEventDataFromJSON(eventData);
  }

  processOBJ(content: any, name: any) {
    this.eventDisplay.parseOBJGeometry(content, name);
  }

  processScene(content: any, name: string) {
    this.eventDisplay.parsePhoenixDisplay(content);
  }

  processGLTF(content: any, name: string) {
    this.eventDisplay.parseGLTFGeometry(content, name);
  }

  processPhoenixScene(content: any, name: string) {
    this.eventDisplay.parsePhoenixDisplay(content);
  }

  saveScene() {
    this.eventDisplay.exportPhoenixDisplay();
  }

  exportOBJ() {
    this.eventDisplay.exportToOBJ();
  }

}
