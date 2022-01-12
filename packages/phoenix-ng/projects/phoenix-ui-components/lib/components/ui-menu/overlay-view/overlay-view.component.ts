import { Component, ComponentRef, OnDestroy, OnInit } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { OverlayViewWindowComponent } from './overlay-view-window/overlay-view-window.component';

@Component({
  selector: 'app-overlay-view',
  templateUrl: './overlay-view.component.html',
  styleUrls: ['./overlay-view.component.scss'],
})
export class OverlayViewComponent implements OnInit, OnDestroy {
  overlayWindow: ComponentRef<OverlayViewWindowComponent>;
  showOverlay = false;

  constructor(private overlay: Overlay) {}

  ngOnInit() {
    const overlayRef = this.overlay.create();
    const overlayPortal = new ComponentPortal(OverlayViewWindowComponent);
    this.overlayWindow = overlayRef.attach(overlayPortal);
    this.overlayWindow.instance.showOverlay = this.showOverlay;
  }

  ngOnDestroy(): void {
    this.overlayWindow.destroy();
  }

  toggleOverlay() {
    this.showOverlay = !this.showOverlay;
    this.overlayWindow.instance.showOverlay = this.showOverlay;
  }
}
