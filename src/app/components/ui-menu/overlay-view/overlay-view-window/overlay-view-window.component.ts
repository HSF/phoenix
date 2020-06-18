import { Component, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { UIService } from 'src/app/services/ui.service';
import { EventdisplayService } from '../../../../services/eventdisplay.service';

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

  constructor(private ui: UIService, private eventDisplay: EventdisplayService) { }

  ngAfterViewInit(): void {
    const canvas = this.initializeCanvas(this.overlayWindow.nativeElement);
    this.ui.setOverlayRenderer(canvas);
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
    this.ui.toggleOrthographicView(this.orthographicView);
  }

  fixOverlayView() {
    this.overlayViewFixed = !this.overlayViewFixed;
    this.eventDisplay.fixOverlayView(this.overlayViewFixed);
  }

}
