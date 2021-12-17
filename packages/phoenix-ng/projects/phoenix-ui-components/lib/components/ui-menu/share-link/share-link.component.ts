import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ShareLinkDialogComponent } from './share-link-dialog/share-link-dialog.component';

@Component({
  selector: 'app-share-link',
  templateUrl: './share-link.component.html',
  styleUrls: ['./share-link.component.scss'],
})
export class ShareLinkComponent {
  constructor(private dialog: MatDialog) {}

  openShareLinkDialog() {
    this.dialog.open(ShareLinkDialogComponent);
  }
}
