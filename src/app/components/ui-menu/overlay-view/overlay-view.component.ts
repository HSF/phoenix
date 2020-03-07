import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from 'src/app/services/eventdisplay.service';

@Component({
  selector: 'app-overlay-view',
  templateUrl: './overlay-view.component.html',
  styleUrls: ['./overlay-view.component.scss']
})
export class OverlayViewComponent implements OnInit {
  overlayPanel: boolean;

  constructor(private eventDisplay: EventdisplayService) { }

  ngOnInit() {
  }

  toggleOverlay() {
    this.overlayPanel = !this.overlayPanel;
    this.eventDisplay.renderOverlay(this.overlayPanel);
  }

}
