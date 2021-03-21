import { Component, OnInit } from '@angular/core';
import { EventDisplayService } from '../../../../services/event-display.service';
import { MatDialogRef } from '@angular/material/dialog';
import { JiveXMLLoader, ScriptLoader } from 'phoenix-event-display';
import JSZip from 'jszip';

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

  handleJSONEventDataInput(files: FileList) {
    const callback = (content: any) => {
      const json = typeof content === 'string' ? JSON.parse(content) : content;
      this.eventDisplay.parsePhoenixEvents(json);
    };

    if (this.isFileOfExtension(files[0], 'zip')) {
      this.handleZipInput(files[0], (allFilesWithData) => {
        const allEventsObject = {};

        Object.values(allFilesWithData).forEach((fileData) => {
          Object.assign(allEventsObject, JSON.parse(fileData));
        });

        callback(allEventsObject);
        this.onNoClick();
      });
    } else {
      this.handleFileInput(files[0], 'json', callback);
    }
  }

  handleJiveXMLDataInput(files: FileList) {
    const processEventData = (content: any) => {
      const jiveloader = new JiveXMLLoader();
      jiveloader.process(content);
      return jiveloader.getEventData();
    };

    const callback = (content: any) => {
      const eventData = processEventData(content);
      this.eventDisplay.buildEventDataFromJSON(eventData);
    };

    if (this.isFileOfExtension(files[0], 'zip')) {
      this.handleZipInput(files[0], (allFilesWithData) => {
        const allEventsObject = {};

        Object.entries(allFilesWithData).forEach(([fileName, fileData]) => {
          const eventData = processEventData(fileData);
          Object.assign(allEventsObject, { [fileName]: eventData });
        });

        this.eventDisplay.parsePhoenixEvents(allEventsObject);
        this.onNoClick();
      });
    } else {
      this.handleFileInput(files[0], 'xml', callback);
    }
  }

  handleOBJInput(files: FileList) {
    const callback = (content: any, name: string) => {
      this.eventDisplay.parseOBJGeometry(content, name);
    };
    this.handleFileInput(files[0], 'obj', callback);
  }

  handleSceneInput(files: FileList) {
    const callback = (content: any) => {
      this.eventDisplay.parsePhoenixDisplay(content);
    };
    this.handleFileInput(files[0], 'phnx', callback);
  }

  handleGLTFInput(files: FileList) {
    const callback = (content: any, name: string) => {
      this.eventDisplay.parseGLTFGeometry(content, name);
    };
    this.handleFileInput(files[0], 'gltf', callback);
  }

  handlePhoenixInput(files: FileList) {
    const callback = (content: any) => {
      this.eventDisplay.parsePhoenixDisplay(content);
    };
    this.handleFileInput(files[0], 'phnx', callback);
  }

  handleROOTInput(files: FileList) {
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

  handleRootJSONInput(files: FileList) {
    ScriptLoader.loadJSRootScripts().then((JSROOT: any) => {
      const callback = (content: any, name: string) => {
        this.eventDisplay.loadJSONGeometry(
          JSROOT.GEO.build(JSROOT.parse(content), {
            dflt_colors: true,
          }).toJSON(),
          name
        );
      };
      this.handleFileInput(files[0], 'gz', callback);
    });
  }

  async handleZipInput(
    file: File,
    callback: (allFilesWithData: { [key: string]: string }) => void
  ) {
    const allFilesWithData: { [key: string]: string } = {};
    // Using a try catch block to catch any errors in Promises
    try {
      const zipArchive = new JSZip();
      await zipArchive.loadAsync(file);
      const allFiles = Object.keys(zipArchive.files);
      for (const singleFile of allFiles) {
        const fileData = await zipArchive.file(singleFile).async('string');
        allFilesWithData[singleFile] = fileData;
      }
      callback(allFilesWithData);
    } catch (error) {
      console.error('Error while reading zip', error);
      this.eventDisplay.getInfoLogger().add('Could not read zip file', 'Error');
    }
  }

  handleFileInput(
    file: File,
    extension: string,
    callback: (result: string, fileName?: string) => void
  ) {
    const reader = new FileReader();
    if (this.isFileOfExtension(file, extension)) {
      reader.onload = () => {
        callback(reader.result.toString(), file.name.split('.')[0]);
      };
      reader.readAsText(file);
    } else {
      console.error('Error: Invalid file format!');
      this.eventDisplay.getInfoLogger().add('Invalid file format!', 'Error');
    }
    this.onNoClick();
  }

  private isFileOfExtension(file: File, extension: string) {
    return file.name.split('.').pop() === extension;
  }

  saveScene() {
    this.eventDisplay.exportPhoenixDisplay();
  }

  exportOBJ() {
    this.eventDisplay.exportToOBJ();
  }
}
