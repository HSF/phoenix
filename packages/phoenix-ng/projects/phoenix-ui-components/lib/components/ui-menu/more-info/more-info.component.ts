import { Component, Input, ViewChild } from '@angular/core';
import { defaultUIMenuConfig, UIMenuConfig } from '../ui-menu.component';
import { InfoPanelComponent } from '../info-panel/info-panel.component';
import { EventBrowserComponent } from '../event-browser/event-browser.component';
import { CollectionsInfoComponent } from '../collections-info/collections-info.component';
import { EtaPhiPanelComponent } from '../eta-phi-panel/eta-phi-panel.component';
import { GeometryBrowserComponent } from '../geometry-browser/geometry-browser.component';
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

  @ViewChild('infoPanel') infoPanel: InfoPanelComponent;
  @ViewChild('eventBrowser') eventBrowser: EventBrowserComponent;
  @ViewChild('collectionsInfo') collectionsInfo: CollectionsInfoComponent;
  @ViewChild('etaPhiPanel') etaPhiPanel: EtaPhiPanelComponent;
  @ViewChild('geometryBrowser') geometryBrowser: GeometryBrowserComponent;
  @ViewChild('kinematicsPanel') kinematicsPanel!: KinematicsPanelComponent;

  showInfoPanel = false;
  showEventBrowser = false;
  showCollectionsInfo = false;
  showEtaPhiPanel = false;
  showGeometryBrowser = false;
  showKinematicsPanel = false;

  toggleInfoPanel() {
    this.showInfoPanel = !this.showInfoPanel;
    this.infoPanel?.toggleOverlay();
  }

  toggleEventBrowser() {
    this.showEventBrowser = !this.showEventBrowser;
    this.eventBrowser?.toggleOverlay();
  }

  toggleCollectionsInfo() {
    this.showCollectionsInfo = !this.showCollectionsInfo;
    this.collectionsInfo?.toggleOverlay();
  }

  toggleEtaPhiPanel() {
    this.showEtaPhiPanel = !this.showEtaPhiPanel;
    this.etaPhiPanel?.toggleOverlay();
  }

  toggleGeometryBrowser() {
    this.showGeometryBrowser = !this.showGeometryBrowser;
    this.geometryBrowser?.toggleOverlay();
  }

  toggleKinematicsPanel() {
    this.showKinematicsPanel = !this.showKinematicsPanel;
    this.kinematicsPanel?.toggleOverlay();
  }
}
