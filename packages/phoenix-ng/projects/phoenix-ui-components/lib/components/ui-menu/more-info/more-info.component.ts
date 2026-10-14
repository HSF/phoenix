import { Component, Input, ViewChild } from '@angular/core';
import { defaultUIMenuConfig, UIMenuConfig } from '../ui-menu.component';
import { InfoPanelComponent } from '../info-panel/info-panel.component';
import { EtaPhiPanelComponent } from '../eta-phi-panel/eta-phi-panel.component';
import { KinematicsPanelComponent } from '../kinematics-panel/kinematics-panel.component';
import type { KinematicsConfig } from 'phoenix-event-display';

@Component({
  standalone: false,
  selector: 'app-more-info',
  templateUrl: './more-info.component.html',
  styleUrls: ['./more-info.component.scss'],
})
export class MoreInfoComponent {
  @Input() uiConfig: UIMenuConfig = defaultUIMenuConfig;
  @Input() kinematicsConfig?: KinematicsConfig;

  @ViewChild('infoPanel') infoPanel?: InfoPanelComponent;
  @ViewChild('etaPhiPanel') etaPhiPanel?: EtaPhiPanelComponent;
  @ViewChild('kinematicsPanel') kinematicsPanel?: KinematicsPanelComponent;

  showInfoPanel = false;
  showEtaPhiPanel = false;
  showKinematicsPanel = false;

  toggleInfoPanel() {
    this.showInfoPanel = !this.showInfoPanel;
    this.infoPanel?.toggleOverlay();
  }

  toggleEtaPhiPanel() {
    this.showEtaPhiPanel = !this.showEtaPhiPanel;
    this.etaPhiPanel?.toggleOverlay();
  }

  toggleKinematicsPanel() {
    this.showKinematicsPanel = !this.showKinematicsPanel;
    this.kinematicsPanel?.toggleOverlay();
  }
}
