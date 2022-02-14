import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ActiveVariable, phoenixURLOptions } from 'phoenix-event-display';
import QRCode from 'qrcode';

@Component({
  selector: 'app-share-link-dialog',
  templateUrl: './share-link-dialog.component.html',
  styleUrls: ['./share-link-dialog.component.scss'],
})
export class ShareLinkDialogComponent implements AfterViewInit {
  baseLink: string;
  shareLink: ActiveVariable<string>;
  embedLink: string;
  urlOptions = Object.assign({}, phoenixURLOptions);
  @ViewChild('qrcodeCanvas') qrcodeCanvas: ElementRef<HTMLCanvasElement>;

  constructor(private dialogRef: MatDialogRef<ShareLinkDialogComponent>) {
    const locationHref = window.location.href;
    const lastIndex =
      locationHref.lastIndexOf('?') === -1
        ? locationHref.length
        : locationHref.lastIndexOf('?');

    this.baseLink = locationHref.slice(0, lastIndex);
    this.shareLink = new ActiveVariable(this.baseLink);
    this.embedLink = this.getEmbedLink();
  }

  ngAfterViewInit() {
    this.updateQRCode(this.shareLink.value);
    this.shareLink.onUpdate(this.updateQRCode.bind(this));
  }

  onClose() {
    this.dialogRef.close();
  }

  getEmbedLink(urlParametersString: string = '') {
    return `<iframe src="${this.baseLink}?embed=true${
      urlParametersString ? '&' : ''
    }${urlParametersString}"></iframe>`;
  }

  setOptionValue(option: string, value: string | boolean) {
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

    this.shareLink.update(
      this.baseLink + (urlParametersString ? '?' : '') + urlParametersString
    );
    this.embedLink = this.getEmbedLink(urlParametersString);
  }

  copyText(text: string, element: HTMLElement) {
    const inputElement = document.createElement('input');
    document.body.appendChild(inputElement);
    inputElement.value = text;
    inputElement.select();
    document.execCommand('copy');
    document.body.removeChild(inputElement);
    element.focus();

    // Set text on copying
    element.innerText = 'COPIED';
    setTimeout(() => {
      element.innerText = 'COPY';
    }, 2000);
  }

  updateQRCode(link: string) {
    QRCode.toCanvas(this.qrcodeCanvas.nativeElement, link);
  }
}
