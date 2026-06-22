import {
  Component,
  type OnInit,
  ComponentRef,
  type OnDestroy,
} from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { EtaPhiPanelOverlayComponent } from './eta-phi-panel-overlay/eta-phi-panel-overlay.component';
import { OverlayCascadeService } from '../../../services/overlay-cascade.service';

@Component({
  standalone: false,
  selector: 'app-eta-phi-panel',
  templateUrl: './eta-phi-panel.component.html',
  styleUrls: ['./eta-phi-panel.component.scss'],
})
export class EtaPhiPanelComponent implements OnInit, OnDestroy {
  showPanel = false;
  overlayWindow: ComponentRef<EtaPhiPanelOverlayComponent>;

  constructor(
    private overlay: Overlay,
    private overlayCascade: OverlayCascadeService,
  ) {}

  ngOnInit() {
    const positionStrategy = this.overlayCascade.getCascadePositionStrategy();
    const overlayRef = this.overlay.create({ positionStrategy });
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
