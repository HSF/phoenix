import {
  Component,
  type OnInit,
  ComponentRef,
  type OnDestroy,
} from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MasterclassPanelOverlayComponent } from './masterclass-panel-overlay/masterclass-panel-overlay.component';

@Component({
  standalone: false,
  selector: 'app-masterclass-panel',
  templateUrl: './masterclass-panel.component.html',
  styleUrls: ['./masterclass-panel.component.scss'],
})
export class MasterclassPanelComponent implements OnInit, OnDestroy {
  showPanel = false;
  overlayWindow: ComponentRef<MasterclassPanelOverlayComponent>;

  constructor(private overlay: Overlay) {}

  ngOnInit() {
    const overlayRef = this.overlay.create();
    const overlayPortal = new ComponentPortal(MasterclassPanelOverlayComponent);
    this.overlayWindow = overlayRef.attach(overlayPortal);
    this.overlayWindow.instance.showPanel = this.showPanel;
  }

  ngOnDestroy(): void {
    this.overlayWindow.destroy();
  }

  toggleOverlay() {
    this.showPanel = !this.showPanel;
    this.overlayWindow.instance.showPanel = this.showPanel;
  }
}
