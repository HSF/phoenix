import { Component, OnInit, ComponentRef, OnDestroy } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { InfoPanelOverlayComponent } from './info-panel-overlay/info-panel-overlay.component';
import { EventdisplayService } from 'src/app/services/eventdisplay.service';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.scss']
})
export class InfoPanelComponent implements OnInit, OnDestroy {

  showInfoPanel = false;
  overlayWindow: ComponentRef<InfoPanelOverlayComponent>;

  constructor(private overlay: Overlay, private eventDisplay: EventdisplayService) { }

  ngOnInit() {
    const overlayRef = this.overlay.create();
    const overlayPortal = new ComponentPortal(InfoPanelOverlayComponent);
    this.overlayWindow = overlayRef.attach(overlayPortal);
    this.overlayWindow.instance.showInfoPanel = this.showInfoPanel;
  }

  ngOnDestroy(): void {
    this.overlayWindow.destroy();
  }

  toggleOverlay() {
    this.showInfoPanel = !this.showInfoPanel;
    this.overlayWindow.instance.showInfoPanel = this.showInfoPanel;
  }

}
