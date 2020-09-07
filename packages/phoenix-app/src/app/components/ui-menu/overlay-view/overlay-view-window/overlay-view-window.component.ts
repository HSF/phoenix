import { Component, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { EventDisplayService } from '../../../../services/eventdisplay.service';

@Component({
  selector: 'app-overlay-view-window',
  templateUrl: './overlay-view-window.component.html',
  styleUrls: ['./overlay-view-window.component.scss']
})
export class OverlayViewWindowComponent implements AfterViewInit {

  @Input() showOverlay = true;
  orthographicView: boolean = false;
  overlayViewFixed: boolean = false;
  @ViewChild('overlayWindow') overlayWindow: ElementRef<HTMLCanvasElement>;

  constructor(private eventDisplay: EventDisplayService) { }

  ngAfterViewInit(): void {
    const canvas = this.initializeCanvas(this.overlayWindow.nativeElement);
    this.eventDisplay.instance.getUIManager().setOverlayRenderer(canvas);
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
    this.eventDisplay.instance.getUIManager().toggleOrthographicView(this.orthographicView);
  }

  fixOverlayView() {
    this.overlayViewFixed = !this.overlayViewFixed;
    this.eventDisplay.instance.fixOverlayView(this.overlayViewFixed);
  }

}
