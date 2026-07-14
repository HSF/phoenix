import { Component, Input } from '@angular/core';
import type { PhoenixMenuNode } from 'phoenix-event-display';
import { MatDialog } from '@angular/material/dialog';
import { ShortcutsDialogComponent } from './shortcuts-dialog/shortcuts-dialog.component';

@Component({
  standalone: false,
  selector: 'app-phoenix-menu',
  templateUrl: './phoenix-menu.component.html',
  styleUrls: ['./phoenix-menu.component.scss'],
})
export class PhoenixMenuComponent {
  @Input() rootNode: PhoenixMenuNode;

  constructor(private dialog: MatDialog) {}

  openShortcutsDialog() {
    this.dialog.open(ShortcutsDialogComponent, {
      panelClass: 'dialog',
    });
  }
}
