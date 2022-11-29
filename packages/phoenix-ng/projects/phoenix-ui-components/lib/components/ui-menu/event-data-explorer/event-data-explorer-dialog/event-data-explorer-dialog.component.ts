import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { JiveXMLLoader } from 'phoenix-event-display';
import { EventDisplayService } from '../../../../services/event-display.service';
import { FileNode } from '../../../file-explorer/file-explorer.component';
import { EventDataExplorerDialogData } from '../event-data-explorer.component';
import JSZip from 'jszip';

const supportFileTypes = ['json', 'xml'];

export type FileResponse = {
  name: string;
  url: string;
};

@Component({
  selector: 'app-event-data-explorer-dialog',
  templateUrl: './event-data-explorer-dialog.component.html',
  styleUrls: ['./event-data-explorer-dialog.component.scss'],
})
export class EventDataExplorerDialogComponent {
  eventDataFileNode: FileNode;
  configFileNode: FileNode;
  loading = true;
  error = false;

  constructor(
    private eventDisplay: EventDisplayService,
    private dialogRef: MatDialogRef<EventDataExplorerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private dialogData: EventDataExplorerDialogData
  ) {
    // Event data
    this.makeRequest(this.dialogData.apiURL, 'json', (res: FileResponse[]) => {
      const filePaths = res.filter((file) =>
        supportFileTypes.includes(file.name.split('.').pop())
      );

      this.eventDataFileNode = this.buildFileNode(filePaths);
    });

    // Config
    this.makeRequest(
      `${this.dialogData.apiURL}?type=config`,
      'json',
      (res: FileResponse[]) => {
        const filePaths = res.filter(
          (file) => file.name.split('.').pop() === 'json'
        );

        this.configFileNode = this.buildFileNode(filePaths);
      }
    );
  }

  loadEvent(file: string) {
    const isZip = file.split('.').pop() === 'zip';
    const rawfile = isZip ? file.substring(0, file.length - 4) : file;
    this.makeRequest(file, isZip ? 'blob' : 'text', (eventData) => {
      switch (rawfile.split('.').pop()) {
        case 'xml':
          this.loadJiveXMLEvent(eventData);
          break;
        case 'json':
          this.loadJSONEvent(eventData);
          break;
      }
    });
  }

  private loadJSONEvent(eventData: string) {
    this.eventDisplay.parsePhoenixEvents(JSON.parse(eventData));
    this.onClose();
  }

  private loadJiveXMLEvent(eventData: string) {
    const jiveXMLLoader = new JiveXMLLoader();
    jiveXMLLoader.process(eventData);
    const processedEventData = jiveXMLLoader.getEventData();
    this.eventDisplay.buildEventDataFromJSON(processedEventData);
    this.onClose();
  }

  loadConfig(file: string) {
    this.makeRequest(
      `${this.dialogData.apiURL}?type=config&f=${file}`,
      'text',
      (config) => {
        const stateManager = this.eventDisplay.getStateManager();
        stateManager.loadStateFromJSON(JSON.parse(config));

        this.onClose();
      }
    );
  }

  // Helpers

  onClose() {
    this.dialogRef.close();
  }

  private async unzip(data: ArrayBuffer) {
    const archive = new JSZip();
    await archive.loadAsync(data);
    let fileData = '';
    let multiFile = false;
    for (const filePath in archive.files) {
      if (multiFile) {
        console.error(
          'Zip archive contains more than one file. Ignoring all but first'
        );
        break;
      }
      fileData = await archive.file(filePath).async('string');
      multiFile = true;
    }
    return fileData;
  }

  makeRequest(
    urlPath: string,
    responseType: 'json' | 'text' | 'blob',
    onData: (data: any) => void
  ) {
    this.loading = true;
    fetch(urlPath)
      .then((res) => res[responseType]())
      .then((data) => {
        if (responseType === 'blob') {
          data
            .arrayBuffer()
            .then((buf) => this.unzip(buf))
            .then((d) => onData(d));
        } else {
          onData(data);
        }
        this.error = false;
      })
      .catch((error) => {
        console.error(error);
        this.error = true;
      })
      .finally(() => {
        this.loading = false;
      });
  }

  private buildFileNode(filePaths: FileResponse[]): FileNode {
    const rootNode = new FileNode();
    let fileNode = rootNode;

    for (const filePath of filePaths) {
      filePath.name.split('/').forEach((name) => {
        fileNode.children = fileNode.children ?? {};
        fileNode.children[name] = fileNode.children[name] ?? new FileNode(name);
        fileNode = fileNode.children[name];
      });

      fileNode.url = filePath.url;
      fileNode = rootNode;
    }

    return rootNode;
  }
}
