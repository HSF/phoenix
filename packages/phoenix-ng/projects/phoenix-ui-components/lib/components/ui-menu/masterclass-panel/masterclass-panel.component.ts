import {
  Component,
  Input,
  type OnInit,
  ComponentRef,
  type OnDestroy,
  type OnChanges,
  type SimpleChanges,
} from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import type { MasterclassConfig } from 'phoenix-event-display';
import { MasterclassPanelOverlayComponent } from './masterclass-panel-overlay/masterclass-panel-overlay.component';

@Component({
  standalone: false,
  selector: 'app-masterclass-panel',
  templateUrl: './masterclass-panel.component.html',
  styleUrls: ['./masterclass-panel.component.scss'],
})
export class MasterclassPanelComponent implements OnInit, OnDestroy, OnChanges {
  @Input() config?: MasterclassConfig;

  showPanel = false;
  overlayWindow: ComponentRef<MasterclassPanelOverlayComponent>;

  constructor(private overlay: Overlay) {}

  ngOnInit() {
    const overlayRef = this.overlay.create();
    const overlayPortal = new ComponentPortal(MasterclassPanelOverlayComponent);
    this.overlayWindow = overlayRef.attach(overlayPortal);
    this.overlayWindow.instance.showPanel = this.showPanel;
    if (this.config) {
      this.overlayWindow.instance.config = this.config;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config'] && this.overlayWindow) {
      if (this.config) {
        this.overlayWindow.instance.config = this.config;
      }
    }
  }

  ngOnDestroy(): void {
    this.overlayWindow.destroy();
  }

  toggleOverlay() {
    this.showPanel = !this.showPanel;
    this.overlayWindow.instance.showPanel = this.showPanel;
  }
}
