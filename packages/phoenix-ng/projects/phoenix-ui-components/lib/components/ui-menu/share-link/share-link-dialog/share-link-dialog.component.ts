import {
  type AfterViewInit,
  Component,
  ElementRef,
  type OnDestroy,
  ViewChild,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ActiveVariable, phoenixURLOptions } from 'phoenix-event-display';
import QRCode from 'qrcode';
import { EventDisplayService } from '../../../../services/event-display.service';

@Component({
  standalone: false,
  selector: 'app-share-link-dialog',
  templateUrl: './share-link-dialog.component.html',
  styleUrls: ['./share-link-dialog.component.scss'],
})
export class ShareLinkDialogComponent implements AfterViewInit, OnDestroy {
  baseLink: string;
  shareLink: ActiveVariable<string>;
  embedLink: string;
  urlOptions = Object.assign({}, phoenixURLOptions);
  @ViewChild('qrcodeCanvas') qrcodeCanvas: ElementRef<HTMLCanvasElement>;
  private unsubscribe: () => void;

  constructor(
    private dialogRef: MatDialogRef<ShareLinkDialogComponent>,
    private eventDisplay: EventDisplayService,
  ) {
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
    this.unsubscribe = this.shareLink.onUpdate(this.updateQRCode.bind(this));
  }

  ngOnDestroy() {
    this.unsubscribe?.();
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
            `${option}=${encodeURIComponent(this.urlOptions[option])}`,
          );
        }
        return filteredOptions;
      }, [])
      .join('&');

    this.shareLink.update(
      this.baseLink + (urlParametersString ? '?' : '') + urlParametersString,
    );
    this.embedLink = this.getEmbedLink(urlParametersString);
  }

  async toggleViewState(include: boolean) {
    if (include) {
      const stateManager = this.eventDisplay.getStateManager();
      if (stateManager) {
        const state = stateManager.saveStateAsJSON();
        const jsonStr = JSON.stringify(state);
        // Compress using built-in deflate to keep URL manageable
        const stream = new Blob([jsonStr])
          .stream()
          .pipeThrough(new CompressionStream('deflate'));
        const compressed = await new Response(stream).arrayBuffer();
        const bytes = new Uint8Array(compressed);
        const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join(
          '',
        );
        this.urlOptions['state'] = btoa(binary);
      }
    } else {
      this.urlOptions['state'] = '';
    }
    this.onOptionsChange();
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
