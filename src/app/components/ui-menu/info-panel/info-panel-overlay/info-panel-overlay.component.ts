import { Component, OnInit, Input } from '@angular/core';
import { InfoLoggerService } from '../../../../services/infologger.service';

@Component({
  selector: 'app-info-panel-overlay',
  templateUrl: './info-panel-overlay.component.html',
  styleUrls: ['./info-panel-overlay.component.scss']
})
export class InfoPanelOverlayComponent implements OnInit {

  @Input() showInfoPanel: boolean;
  actionsList = [];

  constructor(private infoLogger: InfoLoggerService) { }

  ngOnInit() {
    this.actionsList = this.infoLogger.getInfoLoggerList();
  }

}
