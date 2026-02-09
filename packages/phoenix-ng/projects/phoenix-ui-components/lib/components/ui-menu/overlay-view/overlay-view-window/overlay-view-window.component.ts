import {
  Component,
  ViewChild,
  type AfterViewInit,
  Input,
  Renderer2,
} from '@angular/core';
import type { ElementRef } from '@angular/core';
import { EventDisplayService } from '../../../../services/event-display.service';

@Component({
  standalone: false,
  selector: 'app-overlay-view-window',
  templateUrl: './overlay-view-window.component.html',
  styleUrls: ['./overlay-view-window.component.scss'],
})
export class OverlayViewWindowComponent implements AfterViewInit {
  @Input() showOverlay = true;
  transparentBody = false;
  orthographicView = false;
  overlayViewFixed = false;
  overlayViewLinked = false;
  @ViewChild('overlayWindow') overlayWindow: ElementRef<HTMLCanvasElement>;

  constructor(private eventDisplay: EventDisplayService) {}

  ngAfterViewInit(): void {
    const canvas = this.initializeCanvas(this.overlayWindow.nativeElement);
    this.eventDisplay.setOverlayRenderer(canvas);
    this.eventDisplay.getThreeManager().initOverlayControls(); // Initialize Controls Only after the effective creation of the canva.
  }

  initializeCanvas(
    canvas: HTMLCanvasElement,
    x: number = window.innerWidth / 2.5,
    y: number = window.innerHeight / 2.5,
  ): HTMLCanvasElement {
    console.log('doneee');
    const width = x;
    const height = y;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width.toString() + ' px';
    canvas.style.height = height.toString() + ' px';
    return canvas;
  }

  switchOverlayView() {
    this.orthographicView = this.eventDisplay
      .getThreeManager()
      .revertOverlayCamera();
  }

  fixOverlayView() {
    this.overlayViewFixed = !this.overlayViewFixed;
    this.eventDisplay.fixOverlayView(this.overlayViewFixed);
  }

  toggleBgTransparency() {
    this.transparentBody = !this.transparentBody;
  }

  LinkOverlayView() {
    this.eventDisplay.getThreeManager().linkOverlayToMain();
    this.overlayViewLinked = this.eventDisplay
      .getThreeManager()
      .isOverlayLinked();
  }

  switchContexts() {
    this.eventDisplay.getThreeManager().switchContexts();
  }

  syncOverlayFromMain() {
    this.eventDisplay.getThreeManager().syncOverlayFromMain();
  }
}
