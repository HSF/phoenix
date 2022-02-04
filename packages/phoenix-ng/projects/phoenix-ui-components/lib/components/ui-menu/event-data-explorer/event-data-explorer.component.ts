import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EventDataExplorerDialogComponent } from './event-data-explorer-dialog/event-data-explorer-dialog.component';

@Component({
  selector: 'atlas-event-data-explorer',
  templateUrl: './event-data-explorer.component.html',
  styleUrls: ['./event-data-explorer.component.scss'],
})
export class EventDataExplorerComponent {
  constructor(private dialog: MatDialog) {}

  openEventDataExplorerDialog() {
    this.dialog.open(EventDataExplorerDialogComponent);
  }
}
