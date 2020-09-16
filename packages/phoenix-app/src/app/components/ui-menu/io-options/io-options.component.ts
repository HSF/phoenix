import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IOOptionsDialogComponent } from './io-options-dialog/io-options-dialog.component';

@Component({
  selector: 'app-io-options',
  templateUrl: './io-options.component.html',
  styleUrls: ['./io-options.component.scss']
})
export class IoOptionsComponent {

  constructor(private dialog: MatDialog) { }

  openIODialog() {
    this.dialog.open(IOOptionsDialogComponent, { panelClass: 'dialog' });
  }
}
