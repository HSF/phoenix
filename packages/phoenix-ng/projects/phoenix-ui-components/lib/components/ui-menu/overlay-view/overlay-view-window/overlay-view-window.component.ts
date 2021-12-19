import { Component, ViewChild, AfterViewInit, Input } from '@angular/core';
import type { ElementRef } from '@angular/core';
import { EventDisplayService } from '../../../../services/event-display.service';

@Component({
  selector: 'app-overlay-view-window',
  templateUrl: './overlay-view-window.component.html',
  styleUrls: ['./overlay-view-window.component.scss'],
})
export class OverlayViewWindowComponent implements AfterViewInit {
  @Input() showOverlay = true;
  transparentBody = false;
  orthographicView = false;
  overlayViewFixed = false;
  @ViewChild('overlayWindow') overlayWindow: ElementRef<HTMLCanvasElement>;

  constructor(private eventDisplay: EventDisplayService) {}

  ngAfterViewInit(): void {
    const canvas = this.initializeCanvas(this.overlayWindow.nativeElement);
    this.eventDisplay.setOverlayRenderer(canvas);
  }

  initializeCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const width = window.innerWidth / 2.5;
    const height = window.innerHeight / 2.5;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width.toString() + ' px';
    canvas.style.height = height.toString() + ' px';
    return canvas;
  }

  switchOverlayView() {
    this.orthographicView = !this.orthographicView;
    this.eventDisplay
      .getUIManager()
      .toggleOrthographicView(this.orthographicView);
  }

  fixOverlayView() {
    this.overlayViewFixed = !this.overlayViewFixed;
    this.eventDisplay.fixOverlayView(this.overlayViewFixed);
  }

  toggleBgTransparency() {
    this.transparentBody = !this.transparentBody;
  }
}
