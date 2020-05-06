import { Component, OnInit, Input } from '@angular/core';
import { LoggerService } from '../../../../services/logger.service';

@Component({
  selector: 'app-info-panel-overlay',
  templateUrl: './info-panel-overlay.component.html',
  styleUrls: ['./info-panel-overlay.component.scss']
})
export class InfoPanelOverlayComponent implements OnInit {

  @Input() showInfoPanel: boolean;
  actionsList = [];

  constructor(private logger: LoggerService) { }

  ngOnInit() {
    this.actionsList = this.logger.getLoggerList();
  }

}
