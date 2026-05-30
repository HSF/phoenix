import { Component, Input, ViewChild } from '@angular/core';
import { defaultUIMenuConfig, UIMenuConfig } from '../ui-menu.component';
import { InfoPanelComponent } from '../info-panel/info-panel.component';
import { EventBrowserComponent } from '../event-browser/event-browser.component';
import { CollectionsInfoComponent } from '../collections-info/collections-info.component';
import { EtaPhiPanelComponent } from '../eta-phi-panel/eta-phi-panel.component';
import { GeometryBrowserComponent } from '../geometry-browser/geometry-browser.component';

@Component({
  standalone: false,
  selector: 'app-more-info',
  templateUrl: './more-info.component.html',
  styleUrls: ['./more-info.component.scss'],
})
export class MoreInfoComponent {
  @Input() uiConfig: UIMenuConfig = defaultUIMenuConfig;

  @ViewChild('infoPanel') infoPanel: InfoPanelComponent;
  @ViewChild('eventBrowser') eventBrowser: EventBrowserComponent;
  @ViewChild('collectionsInfo') collectionsInfo: CollectionsInfoComponent;
  @ViewChild('etaPhiPanel') etaPhiPanel: EtaPhiPanelComponent;
  @ViewChild('geometryBrowser') geometryBrowser: GeometryBrowserComponent;
}
