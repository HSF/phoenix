import { Component, OnInit, Input } from '@angular/core';
import { InfoLoggerService } from '../../../../services/infologger.service';

/**
 * Component for displaying information from the logger
 */
@Component({
  selector: 'app-info-panel-overlay',
  templateUrl: './info-panel-overlay.component.html',
  styleUrls: ['./info-panel-overlay.component.scss']
})
export class InfoPanelOverlayComponent implements OnInit {

  /** @ignore */
  @Input() showInfoPanel: boolean;
  /** List of actions to be displayed in the info panel */
  actionsList = [];

  /**
   * Create the information panel overlay
   * @param infoLogger Service containing operations related to info logs
   */
  constructor(private infoLogger: InfoLoggerService) { }

  /**
   * Get the list of logs from the info logger service
   */
  ngOnInit() {
    this.actionsList = this.infoLogger.getInfoLoggerList();
  }

}
