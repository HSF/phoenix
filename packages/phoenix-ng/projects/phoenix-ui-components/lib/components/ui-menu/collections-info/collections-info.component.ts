import {
  Component,
  type OnInit,
  ComponentRef,
  type OnDestroy,
} from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CollectionsInfoOverlayComponent } from './collections-info-overlay/collections-info-overlay.component';

@Component({
  standalone: false, // this is now required when using NgModule
  selector: 'app-collections-info',
  templateUrl: './collections-info.component.html',
  styleUrls: ['./collections-info.component.scss'],
})
export class CollectionsInfoComponent implements OnInit, OnDestroy {
  showObjectsInfo = false;
  overlayWindow: ComponentRef<CollectionsInfoOverlayComponent>;

  constructor(private overlay: Overlay) {}

  ngOnInit() {
    const overlayRef = this.overlay.create();
    const overlayPortal = new ComponentPortal(CollectionsInfoOverlayComponent);
    this.overlayWindow = overlayRef.attach(overlayPortal);
    this.overlayWindow.instance.showObjectsInfo = this.showObjectsInfo;
  }

  ngOnDestroy(): void {
    this.overlayWindow.destroy();
  }

  toggleOverlay() {
    this.showObjectsInfo = !this.showObjectsInfo;
    this.overlayWindow.instance.showObjectsInfo = this.showObjectsInfo;
    if (this.showObjectsInfo) {
      this.overlayWindow.instance.enableHighlighting();
    } else {
      this.overlayWindow.instance.disableHighlighting();
    }
  }
}
