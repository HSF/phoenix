import { OnInit, Component, Input } from '@angular/core';
import { CMSLoader, JiveXMLLoader } from 'phoenix-event-display';
import JSZip from 'jszip';
import { EventDisplayService } from '../../../../services/event-display.service';
import { MatDialogRef } from '@angular/material/dialog';
import {
  EventDataFormat,
  EventDataImportOption,
  ImportOption,
} from '../../../../services/extras/event-data-import';

@Component({
  selector: 'app-io-options-dialog',
  templateUrl: './io-options-dialog.component.html',
  styleUrls: ['./io-options-dialog.component.scss'],
})
export class IOOptionsDialogComponent implements OnInit {
  @Input()
  eventDataImportOptions: EventDataImportOption[] = [EventDataFormat.JSON];

  eventDataOptionsWithHandler: ImportOption[];

  private supportedEventDataFormats = [
    new ImportOption(
      EventDataFormat.JSON,
      '.json',
      this.handleJSONEventDataInput.bind(this),
      'application/json'
    ),
    new ImportOption(
      EventDataFormat.JIVEXML,
      '.xml',
      this.handleJiveXMLDataInput.bind(this),
      'text/xml'
    ),
    new ImportOption(
      EventDataFormat.ZIP,
      '.zip',
      this.handleZipEventDataInput.bind(this),
      '.zip'
    ),
    new ImportOption(
      EventDataFormat.IG,
      '.ig',
      this.handleIgEventDataInput.bind(this),
      '.ig'
    ),
  ];

  constructor(
    private eventDisplay: EventDisplayService,
    public dialogRef: MatDialogRef<IOOptionsDialogComponent>
  ) {}

  ngOnInit() {
    this.eventDataOptionsWithHandler = this.supportedEventDataFormats.filter(
      (eventDataFormat) =>
        this.eventDataImportOptions.includes(
          eventDataFormat.format as EventDataFormat
        )
    );

    this.eventDataImportOptions.forEach((eventDataImportOption) => {
      if (eventDataImportOption instanceof ImportOption) {
        const importHandler = eventDataImportOption.handler.bind(this);
        eventDataImportOption.handler = (files: FileList) => {
          importHandler(files);
          this.onClose();
        };

        this.eventDataOptionsWithHandler.push(eventDataImportOption);
      }
    });
  }

  getSupportedEventDataFormats() {
    return this.eventDataImportOptions
      .map((format) => {
        if (format instanceof ImportOption) {
          return format.format;
        }

        return format;
      })
      .filter((format) => format !== 'ZIP')
      .join(', ');
  }

  onClose(): void {
    this.dialogRef.close();
  }

  handleJSONEventDataInput(files: FileList) {
    const callback = (content: any) => {
      const json = typeof content === 'string' ? JSON.parse(content) : content;
      this.eventDisplay.parsePhoenixEvents(json);
    };
    this.handleFileInput(files[0], 'json', callback);
  }

  handleJiveXMLDataInput(files: FileList) {
    const callback = (content: any) => {
      const jiveloader = new JiveXMLLoader();
      jiveloader.process(content);
      const eventData = jiveloader.getEventData();
      this.eventDisplay.buildEventDataFromJSON(eventData);
    };
    this.handleFileInput(files[0], 'xml', callback);
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

  async handleROOTInput(files: FileList) {
    const rootObjectName = prompt('Enter object name in ROOT file');

    await this.eventDisplay.loadRootGeometry(
      URL.createObjectURL(files[0]),
      rootObjectName,
      files[0].name.split('.')[0]
    );

    this.onClose();
  }

  async handleRootJSONInput(files: FileList) {
    if (!this.isFileOfExtension(files[0], 'gz')) {
      return;
    }

    const name = files[0].name.split('.')[0];
    await this.eventDisplay.loadRootJSONGeometry(
      URL.createObjectURL(files[0]),
      name
    );

    this.onClose();
  }

  handleIgEventDataInput(files: FileList) {
    const cmsLoader = new CMSLoader();
    cmsLoader.readIgArchive(files[0], (allEvents: any[]) => {
      const allEventsData = cmsLoader.getAllEventsData(allEvents);
      this.eventDisplay.parsePhoenixEvents(allEventsData);
      this.onClose();
    });
  }

  handleZipEventDataInput(files: FileList) {
    if (!this.isFileOfExtension(files[0], 'zip')) {
      return;
    }

    this.handleZipInput(files[0], (allFilesWithData) => {
      const allEventsObject = {};

      // JSON event data
      Object.keys(allFilesWithData)
        .filter((fileName) => fileName.endsWith('.json'))
        .forEach((fileName) => {
          Object.assign(
            allEventsObject,
            JSON.parse(allFilesWithData[fileName])
          );
        });

      // JiveXML event data
      const jiveloader = new JiveXMLLoader();
      Object.keys(allFilesWithData)
        .filter((fileName) => {
          return fileName.endsWith('.xml') || fileName.startsWith('JiveXML');
        })
        .forEach((fileName) => {
          jiveloader.process(allFilesWithData[fileName]);
          const eventData = jiveloader.getEventData();
          Object.assign(allEventsObject, { [fileName]: eventData });
        });
      // For some reason the above doesn't pick up JiveXML_XXX_YYY.zip

      this.eventDisplay.parsePhoenixEvents(allEventsObject);

      this.onClose();
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
    }

    this.onClose();
  }

  private isFileOfExtension(file: File, extension: string): boolean {
    if (file.name.split('.').pop() === extension) {
      return true;
    }

    console.error('Error: Invalid file format!');
    this.eventDisplay.getInfoLogger().add('Invalid file format!', 'Error');

    return false;
  }

  saveScene() {
    this.eventDisplay.exportPhoenixDisplay();
  }

  exportOBJ() {
    this.eventDisplay.exportToOBJ();
  }
}
