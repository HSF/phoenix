import { Component, OnInit, ComponentRef, OnDestroy } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { InfoPanelOverlayComponent } from './info-panel-overlay/info-panel-overlay.component';

/**
 * Component for toggling info panel overlay
 */
@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.scss'],
})
export class InfoPanelComponent implements OnInit, OnDestroy {
  /** @ignore */
  showInfoPanel = false;
  /** Information panel overlay window */
  overlayWindow: ComponentRef<InfoPanelOverlayComponent>;

  /**
   * Create the info panel toggle
   * @param overlay Info panel overlay containing logger data
   */
  constructor(private overlay: Overlay) {}

  /**
   * Create the info panel overlay
   */
  ngOnInit() {
    const overlayRef = this.overlay.create();
    const overlayPortal = new ComponentPortal(InfoPanelOverlayComponent);
    this.overlayWindow = overlayRef.attach(overlayPortal);
    this.overlayWindow.instance.showInfoPanel = this.showInfoPanel;
  }

  /**
   * Destroy the info panel overlay
   */
  ngOnDestroy(): void {
    this.overlayWindow.destroy();
  }

  /**
   * Toggle the info panel overlay
   */
  toggleOverlay() {
    this.showInfoPanel = !this.showInfoPanel;
    this.overlayWindow.instance.showInfoPanel = this.showInfoPanel;
  }
}
