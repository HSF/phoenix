import { GeometryBrowserOverlayComponent } from './geometry-browser-overlay/geometry-browser-overlay.component';
import {
  Component,
  type OnInit,
  ComponentRef,
  type OnDestroy,
} from '@angular/core';
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
    const overlayRef = this.overlay.create();
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
    // eslint-disable-next-line
    this.browseDetectorParts
      ? this.overlayWindow.instance.enableHighlighting()
      : this.overlayWindow.instance.disableHighlighting();
  }
}
