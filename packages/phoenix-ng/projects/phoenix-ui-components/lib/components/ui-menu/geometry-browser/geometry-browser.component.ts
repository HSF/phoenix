import {
  Component,
  type OnInit,
  ComponentRef,
  type OnDestroy,
} from '@angular/core';
import { GeometryBrowserOverlayComponent } from './geometry-browser-overlay/geometry-browser-overlay.component';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

@Component({
  standalone: false,
  selector: 'app-geometry-browser',
  templateUrl: './geometry-browser.component.html',
  styleUrls: ['./geometry-browser.component.scss'],
})
export class GeometryBrowserComponent implements OnInit, OnDestroy {
  browseDetectorParts: boolean = false;
  overlayWindow: ComponentRef<GeometryBrowserOverlayComponent>;

  constructor(private overlay: Overlay) {}

  ngOnInit() {
    const positionStrategy = this.overlay
      .position()
      .global()
      .bottom('150px')
      .right('15px');

    const overlayRef = this.overlay.create({ positionStrategy });
    const overlayPortal = new ComponentPortal(GeometryBrowserOverlayComponent);
    this.overlayWindow = overlayRef.attach(overlayPortal);
    this.overlayWindow.instance.browseDetectorParts = this.browseDetectorParts;
  }

  ngOnDestroy(): void {
    this.overlayWindow.destroy();
  }

  toggleOverlay() {
    this.browseDetectorParts = !this.browseDetectorParts;
    this.overlayWindow.instance.browseDetectorParts = this.browseDetectorParts;
    if (this.browseDetectorParts) {
      this.overlayWindow.instance.enableHighlighting();
    } else {
      this.overlayWindow.instance.disableHighlighting();
    }
  }
}
