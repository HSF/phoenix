import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EventDataExplorerDialogComponent } from './event-data-explorer-dialog/event-data-explorer-dialog.component';

@Component({
  selector: 'app-event-data-explorer',
  templateUrl: './event-data-explorer.component.html',
  styleUrls: ['./event-data-explorer.component.scss'],
})
export class EventDataExplorerComponent {
  @Input() apiURL: string;

  constructor(private dialog: MatDialog) {}

  openEventDataExplorerDialog() {
    this.dialog.open(EventDataExplorerDialogComponent, {
      data: {
        apiURL: this.apiURL,
      },
    });
  }
}
