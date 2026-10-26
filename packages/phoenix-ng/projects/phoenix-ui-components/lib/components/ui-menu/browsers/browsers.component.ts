import { Component, Input, ViewChild } from '@angular/core';
import { defaultUIMenuConfig, UIMenuConfig } from '../ui-menu.component';
import { EventBrowserComponent } from '../event-browser/event-browser.component';
import { CollectionsInfoComponent } from '../collections-info/collections-info.component';
import { GeometryBrowserComponent } from '../geometry-browser/geometry-browser.component';

@Component({
  standalone: false,
  selector: 'app-browsers',
  templateUrl: './browsers.component.html',
  styleUrls: ['./browsers.component.scss'],
})
export class BrowsersComponent {
  @Input() uiConfig: UIMenuConfig = defaultUIMenuConfig;

  @ViewChild('eventBrowser') eventBrowser?: EventBrowserComponent;
  @ViewChild('collectionsInfo') collectionsInfo?: CollectionsInfoComponent;
  @ViewChild('geometryBrowser') geometryBrowser?: GeometryBrowserComponent;

  showEventBrowser = false;
  showCollectionsInfo = false;
  showGeometryBrowser = false;

  toggleEventBrowser() {
    this.showEventBrowser = !this.showEventBrowser;
    this.eventBrowser?.toggleOverlay();
  }

  toggleCollectionsInfo() {
    this.showCollectionsInfo = !this.showCollectionsInfo;
    this.collectionsInfo?.toggleOverlay();
  }

  toggleGeometryBrowser() {
    this.showGeometryBrowser = !this.showGeometryBrowser;
    this.geometryBrowser?.toggleOverlay();
  }
}
