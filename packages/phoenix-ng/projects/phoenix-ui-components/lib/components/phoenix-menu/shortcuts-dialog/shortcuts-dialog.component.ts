import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  standalone: false,
  selector: 'app-shortcuts-dialog',
  templateUrl: './shortcuts-dialog.component.html',
  styleUrls: ['./shortcuts-dialog.component.scss'],
})
export class ShortcutsDialogComponent {
  constructor(public dialogRef: MatDialogRef<ShortcutsDialogComponent>) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
