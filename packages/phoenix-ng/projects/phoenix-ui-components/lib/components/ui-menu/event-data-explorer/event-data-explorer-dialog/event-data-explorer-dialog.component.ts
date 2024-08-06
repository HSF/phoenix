import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EventDisplayService } from '../../../../services/event-display.service';
import {
  FileNode,
  FileEvent,
} from '../../../file-explorer/file-explorer.component';
import { FileLoaderService } from '../../../../services/file-loader.service';
import { type EventDataExplorerDialogData } from '../event-data-explorer.component';

const supportFileTypes = ['json', 'xml'];

export type FileResponse = {
  name: string;
  url: string;
  nocache: boolean;
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
    private fileLoader: FileLoaderService,
    private dialogRef: MatDialogRef<EventDataExplorerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private dialogData: EventDataExplorerDialogData,
  ) {
    // Event data
    fileLoader.makeRequest(
      this.dialogData.apiURL,
      'json',
      (res: FileResponse[]) => {
        const filePaths = res.filter((file) =>
          supportFileTypes.includes(file.name.split('.').pop()),
        );

        this.eventDataFileNode = this.buildFileNode(filePaths);
      },
    );

    // Config
    fileLoader.makeRequest(
      `${this.dialogData.apiURL}?type=config`,
      'json',
      (res: FileResponse[]) => {
        const filePaths = res.filter(
          (file) => file.name.split('.').pop() === 'json',
        );

        this.configFileNode = this.buildFileNode(filePaths);
      },
    );
  }

  loadEvent(file: FileEvent) {
    this.loading = true;
    this.error = this.fileLoader.loadEvent(
      file.url,
      this.eventDisplay,
      file.nocache ? { cache: 'no-cache' } : {},
    );
    this.loading = false;
    if (!this.error) this.onClose();
  }

  loadConfig(file: FileEvent) {
    this.loading = true;
    this.error = this.fileLoader.makeRequest(
      `${this.dialogData.apiURL}?type=config&f=${file.url}`,
      'text',
      (config) => {
        const stateManager = this.eventDisplay.getStateManager();
        stateManager.loadStateFromJSON(JSON.parse(config));
        this.onClose();
      },
    );
    this.loading = false;
  }

  // Helpers
  onClose() {
    this.dialogRef.close();
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
      fileNode.nocache = filePath.nocache;
      fileNode = rootNode;
    }

    return rootNode;
  }
}
