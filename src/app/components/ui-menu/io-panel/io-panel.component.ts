import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-io-panel',
  templateUrl: './io-panel.component.html',
  styleUrls: ['./io-panel.component.scss']
})
export class IOPanelComponent {

  constructor(
    public dialogRef: MatDialogRef<IOPanelComponent>) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
