import { type OnInit, Component, Input } from '@angular/core';
import {
  CMSLoader,
  JiveXMLLoader,
  readZipFile,
  Edm4hepJsonLoader,
} from 'phoenix-event-display';
import { EventDisplayService } from '../../../../services/event-display.service';
import { MatDialogRef } from '@angular/material/dialog';
import {
  EventDataFormat,
  type EventDataImportOption,
  ImportOption,
} from '../../../../services/extras/event-data-import';

@Component({
  standalone: false,
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
      'application/json',
    ),
    new ImportOption(
      EventDataFormat.EDM4HEPJSON,
      '.edm4hep.json',
      this.handleEDM4HEPJSONEventDataInput.bind(this),
      'application/json',
    ),
    new ImportOption(
      EventDataFormat.JIVEXML,
      '.xml',
      this.handleJiveXMLDataInput.bind(this),
      'text/xml',
    ),
    new ImportOption(
      EventDataFormat.ZIP,
      '.zip',
      this.handleZipEventDataInput.bind(this),
      '.zip',
    ),
    new ImportOption(
      EventDataFormat.IG,
      '.ig',
      this.handleIgEventDataInput.bind(this),
      '.ig',
    ),
  ];

  constructor(
    private eventDisplay: EventDisplayService,
    public dialogRef: MatDialogRef<IOOptionsDialogComponent>,
  ) {}

  ngOnInit() {
    this.eventDataOptionsWithHandler = this.supportedEventDataFormats.filter(
      (eventDataFormat) =>
        this.eventDataImportOptions.includes(
          eventDataFormat.format as EventDataFormat,
        ),
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

  handleEDM4HEPJSONEventDataInput(files: FileList) {
    const callback = (content: any) => {
      const json = typeof content === 'string' ? JSON.parse(content) : content;
      const edm4hepJsonLoader = new Edm4hepJsonLoader();
      edm4hepJsonLoader.setRawEventData(json);
      edm4hepJsonLoader.processEventData();
      this.eventDisplay.parsePhoenixEvents(edm4hepJsonLoader.getEventData());
    };
    this.handleFileInput(files[0], 'edm4hep.json', callback);
  }

  handleJiveXMLDataInput(files: FileList) {
    const callback = (content: any) => {
      const jiveloader = this.getJiveXMLLoader();
      jiveloader.process(content);
      const eventData = jiveloader.getEventData();
      this.eventDisplay.buildEventDataFromJSON(eventData);
    };
    this.handleFileInput(files[0], 'xml', callback);
  }

  private getJiveXMLLoader(): JiveXMLLoader {
    if (
      this.eventDisplay?.configuration?.eventDataLoader instanceof JiveXMLLoader
    ) {
      return this.eventDisplay.configuration.eventDataLoader as JiveXMLLoader;
    } else {
      return new JiveXMLLoader();
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
    const callback = (file: File) => {
      this.eventDisplay.parseGLTFGeometry(file);
    };
    if (this.isFileOfExtension(files[0].name, 'gltf,glb,gltf.zip,glb.zip')) {
      callback(files[0]);
    }
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
      files[0].name.split('.')[0],
    );

    this.onClose();
  }

  async handleRootJSONInput(files: FileList) {
    if (!this.isFileOfExtension(files[0].name, 'gz')) {
      return;
    }

    const name = files[0].name.split('.')[0];
    await this.eventDisplay.loadRootJSONGeometry(
      URL.createObjectURL(files[0]),
      name,
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

  async handleZipEventDataInput(files: FileList) {
    if (!this.isFileOfExtension(files[0].name, 'zip,json.zip')) {
      return;
    }

    const allEventsObject = {};
    let filesWithData: { [fileName: string]: string };

    // Using a try catch block to catch any errors in Promises
    try {
      filesWithData = await readZipFile(files[0]);
    } catch (error) {
      console.error('Error while reading zip', error);
      this.eventDisplay.getInfoLogger().add('Could not read zip file', 'Error');
      return;
    }

    // JSON event data
    Object.keys(filesWithData)
      .filter((fileName) => fileName.endsWith('.json'))
      .forEach((fileName) => {
        Object.assign(allEventsObject, JSON.parse(filesWithData[fileName]));
      });

    // JiveXML event data
    const jiveloader = this.getJiveXMLLoader();

    Object.keys(filesWithData)
      .filter((fileName) => {
        return fileName.endsWith('.xml') || fileName.startsWith('JiveXML');
      })
      .forEach((fileName) => {
        jiveloader.process(filesWithData[fileName]);
        const eventData = jiveloader.getEventData();
        Object.assign(allEventsObject, { [fileName]: eventData });
      });
    // For some reason the above doesn't pick up JiveXML_XXX_YYY.zip

    this.eventDisplay.parsePhoenixEvents(allEventsObject);

    this.onClose();
  }

  handleFileInput(
    file: File,
    extensions: string,
    callback: (result: string, fileName?: string) => void,
  ) {
    const reader = new FileReader();

    if (this.isFileOfExtension(file.name, extensions)) {
      reader.onload = () => {
        callback(reader.result.toString(), file.name.split('.')[0]);
      };
      reader.onerror = () => {
        const errorMessage = `Failed to read file "${file.name}". The file may be corrupted, too large, or inaccessible.`;
        console.error('FileReader error:', reader.error);
        this.eventDisplay.getInfoLogger().add(errorMessage, 'Error');
      };
      reader.readAsText(file);
    }
    this.onClose();
  }

  private isFileOfExtension(fileName: string, extensions: string): boolean {
    if (
      extensions.split(',').includes(fileName.slice(fileName.indexOf('.') + 1))
    ) {
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
