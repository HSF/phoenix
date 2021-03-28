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
  shareLink: string;
  embedLink: string;
  urlOptions = Object.assign({}, phoenixURLOptions);

  constructor(private dialogRef: MatDialogRef<ShareLinkDialogComponent>) {
    const locationHref = window.location.href;
    const lastIndex =
      locationHref.lastIndexOf('?') === -1 ? 0 : locationHref.lastIndexOf('?');
    this.baseLink = locationHref.slice(0, lastIndex);
    this.shareLink = this.baseLink;
    this.embedLink = this.getEmbedLink();
  }

  onClose() {
    this.dialogRef.close();
  }

  getEmbedLink() {
    return `<iframe src="${this.shareLink}"></iframe>`;
  }

  setOptionValue(option: string, value: string) {
    this.urlOptions[option] = value;
    this.onOptionsChange();
  }

  onOptionsChange() {
    const urlParametersString = Object.getOwnPropertyNames(this.urlOptions)
      .reduce((filteredOptions: string[], option: string) => {
        if (this.urlOptions[option]) {
          filteredOptions.push(
            `${option}=${encodeURI(this.urlOptions[option])}`
          );
        }
        return filteredOptions;
      }, [])
      .join('&');

    this.shareLink =
      this.baseLink + (urlParametersString ? '?' : '') + urlParametersString;
    this.embedLink = this.getEmbedLink();
  }

  copyText(text: string, element: HTMLElement) {
    const inputElement = document.createElement('input');
    document.body.appendChild(inputElement);
    inputElement.value = text;
    inputElement.select();
    document.execCommand('copy');
    document.body.removeChild(inputElement);

    // Set text on copying
    element.innerText = 'COPIED';
    setTimeout(() => {
      element.innerText = 'COPY';
    }, 2000);
  }
}
