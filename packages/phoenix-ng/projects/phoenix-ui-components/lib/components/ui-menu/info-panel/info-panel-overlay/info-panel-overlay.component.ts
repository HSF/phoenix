import { Component, OnInit, Input } from '@angular/core';
import { EventDisplayService } from '../../../../services/event-display.service';
import packageJson from 'phoenix-event-display/package.json';

/**
 * Component for displaying information from the logger
 */
@Component({
  selector: 'app-info-panel-overlay',
  templateUrl: './info-panel-overlay.component.html',
  styleUrls: ['./info-panel-overlay.component.scss'],
})
export class InfoPanelOverlayComponent implements OnInit {
  /** @ignore */
  @Input() showInfoPanel: boolean;
  /** List of actions to be displayed in the info panel */
  actionsList = [];
  /** Get Phoenix Version */
  version = packageJson.version;

  /**
   * Create the information panel overlay
   * @param infoLogger Service containing operations related to info logs
   */
  constructor(private eventDisplay: EventDisplayService) {}

  /**
   * Get the list of logs from the info logger service
   */
  ngOnInit() {
    this.actionsList = this.eventDisplay.getInfoLogger().getInfoLoggerList();
  }
}
