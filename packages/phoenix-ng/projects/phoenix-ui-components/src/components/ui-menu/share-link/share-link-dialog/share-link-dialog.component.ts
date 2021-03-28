import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { phoenixURLOptions } from 'phoenix-event-display';

@Component({
  selector: 'app-share-link-dialog',
  templateUrl: './share-link-dialog.component.html',
  styleUrls: ['./share-link-dialog.component.scss'],
})
export class ShareLinkDialogComponent {
  baseLink: string;
  shareableLink: string;
  urlOptions = Object.assign({}, phoenixURLOptions);

  constructor(private dialogRef: MatDialogRef<ShareLinkDialogComponent>) {
    const locationHref = window.location.href;
    const lastIndex =
      locationHref.lastIndexOf('?') === -1 ? 0 : locationHref.lastIndexOf('?');
    this.baseLink = locationHref.slice(0, lastIndex);
  }

  onClose() {
    this.dialogRef.close();
  }

  setOptionValue(option: string, value: string) {
    this.urlOptions[option] = value;
    this.onOptionsChange();
  }

  onOptionsChange() {
    this.shareableLink =
      this.baseLink +
      '?' +
      Object.getOwnPropertyNames(this.urlOptions)
        .reduce((filteredOptions: string[], option: string) => {
          if (this.urlOptions[option]) {
            filteredOptions.push(`${option}=${this.urlOptions[option]}`);
          }
          return filteredOptions;
        }, [])
        .join('&');

    console.log(this.shareableLink);
  }
}
