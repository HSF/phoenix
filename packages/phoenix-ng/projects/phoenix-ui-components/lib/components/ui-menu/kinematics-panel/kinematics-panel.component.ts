import {
  Component,
  type OnInit,
  ComponentRef,
  type OnDestroy,
  Input,
  type OnChanges,
  type SimpleChanges,
} from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { KinematicsPanelOverlayComponent } from './kinematics-panel-overlay/kinematics-panel-overlay.component';
import type { KinematicsConfig } from 'phoenix-event-display';
import { OverlayCascadeService } from '../../../services/overlay-cascade.service';

@Component({
  standalone: false,
  selector: 'app-kinematics-panel',
  templateUrl: './kinematics-panel.component.html',
  styleUrls: ['./kinematics-panel.component.scss'],
})
export class KinematicsPanelComponent implements OnInit, OnDestroy, OnChanges {
  showKinematics = false;
  overlayWindow: ComponentRef<KinematicsPanelOverlayComponent>;
  @Input() config?: KinematicsConfig;

  constructor(
    private overlay: Overlay,
    private overlayCascade: OverlayCascadeService,
  ) {}

  ngOnInit() {
    const positionStrategy = this.overlayCascade.getCascadePositionStrategy();
    const overlayRef = this.overlay.create({ positionStrategy });
    const overlayPortal = new ComponentPortal(KinematicsPanelOverlayComponent);
    this.overlayWindow = overlayRef.attach(overlayPortal);
    this.overlayWindow.instance.showKinematics = this.showKinematics;
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
    this.showKinematics = !this.showKinematics;
    this.overlayWindow.instance.showKinematics = this.showKinematics;
  }
}
