import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  EventDataFormat,
  EventDataImportOption,
} from '../../../services/extras/event-data-import';
import { IOOptionsDialogComponent } from './io-options-dialog/io-options-dialog.component';

@Component({
  selector: 'app-io-options',
  templateUrl: './io-options.component.html',
  styleUrls: ['./io-options.component.scss'],
})
export class IoOptionsComponent {
  @Input()
  eventDataImportOptions: EventDataImportOption[] =
    Object.values(EventDataFormat);

  constructor(private dialog: MatDialog) {}

  openIODialog() {
    const dialogRef = this.dialog.open(IOOptionsDialogComponent, {
      panelClass: 'dialog',
    });
    dialogRef.componentInstance.eventDataImportOptions =
      this.eventDataImportOptions;
  }
}
