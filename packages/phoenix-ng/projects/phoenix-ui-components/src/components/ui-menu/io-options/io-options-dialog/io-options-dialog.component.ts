import { Component, OnInit } from '@angular/core';
import { EventDisplayService } from '../../../../services/event-display.service';
import { MatDialogRef } from '@angular/material/dialog';
import { JiveXMLLoader, ScriptLoader } from 'phoenix-event-display';

@Component({
  selector: 'app-io-options-dialog',
  templateUrl: './io-options-dialog.component.html',
  styleUrls: ['./io-options-dialog.component.scss'],
})
export class IOOptionsDialogComponent {
  constructor(
    private eventDisplay: EventDisplayService,
    public dialogRef: MatDialogRef<IOOptionsDialogComponent>
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  handleEventDataInput(files: any) {
    const callback = (content: any) => {
      const json = JSON.parse(content);
      this.eventDisplay.parsePhoenixEvents(json);
    };
    this.handleFileInput(files, 'json', callback);
  }

  handleJiveXMLDataInput(files: any) {
    const callback = (content: any) => {
      const jiveloader = new JiveXMLLoader();
      jiveloader.process(content);
      const eventData = jiveloader.getEventData();
      this.eventDisplay.buildEventDataFromJSON(eventData);
    };
    this.handleFileInput(files, 'xml', callback);
  }

  handleOBJInput(files: any) {
    const callback = (content: any, name: string) => {
      this.eventDisplay.parseOBJGeometry(content, name);
    };
    this.handleFileInput(files, 'obj', callback);
  }

  handleSceneInput(files: any) {
    const callback = (content: any) => {
      this.eventDisplay.parsePhoenixDisplay(content);
    };
    this.handleFileInput(files, 'phnx', callback);
  }

  handleGLTFInput(files: any) {
    const callback = (content: any, name: string) => {
      this.eventDisplay.parseGLTFGeometry(content, name);
    };
    this.handleFileInput(files, 'gltf', callback);
  }

  handlePhoenixInput(files: any) {
    const callback = (content: any) => {
      this.eventDisplay.parsePhoenixDisplay(content);
    };
    this.handleFileInput(files, 'phnx', callback);
  }

  handleROOTInput(files: any) {
    ScriptLoader.loadJSRootScripts().then((JSROOT: any) => {
      const objectName = prompt('Enter object name in ROOT file');
      JSROOT.openFile(files[0]).then((file: any) => {
        file.readObject(objectName).then((obj: any) => {
          this.eventDisplay.loadJSONGeometry(
            JSROOT.GEO.build(obj, { dflt_colors: true }).toJSON(),
            files[0].name.split('.')[0]
          );
        });
      });
    });
    this.onNoClick();
  }

  handleRootJSONInput(files: any) {
    ScriptLoader.loadJSRootScripts().then((JSROOT: any) => {
      const callback = (content: any, name: string) => {
        this.eventDisplay.loadJSONGeometry(
          JSROOT.GEO.build(JSROOT.parse(content), {
            dflt_colors: true,
          }).toJSON(),
          name
        );
      };
      this.handleFileInput(files, 'gz', callback);
    });
  }

  handleFileInput(
    files: any,
    extension: string,
    callback: (result: string, fileName?: string) => void
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

  saveScene() {
    this.eventDisplay.exportPhoenixDisplay();
  }

  exportOBJ() {
    this.eventDisplay.exportToOBJ();
  }
}
