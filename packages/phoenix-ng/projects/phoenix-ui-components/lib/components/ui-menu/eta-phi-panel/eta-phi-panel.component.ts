import {
  Component,
  type OnInit,
  ComponentRef,
  type OnDestroy,
} from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { EtaPhiPanelOverlayComponent } from './eta-phi-panel-overlay/eta-phi-panel-overlay.component';

@Component({
  standalone: false,
  selector: 'app-eta-phi-panel',
  templateUrl: './eta-phi-panel.component.html',
  styleUrls: ['./eta-phi-panel.component.scss'],
})
export class EtaPhiPanelComponent implements OnInit, OnDestroy {
  showPanel = false;
  overlayWindow: ComponentRef<EtaPhiPanelOverlayComponent>;

  constructor(private overlay: Overlay) {}

  ngOnInit() {
    const overlayRef = this.overlay.create();
    const overlayPortal = new ComponentPortal(EtaPhiPanelOverlayComponent);
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
