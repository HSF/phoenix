import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from 'src/app/services/eventdisplay.service';
import { MatDialog } from '@angular/material/dialog';
import { IOPanelComponent } from './io-panel/io-panel.component';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-ui-menu',
  templateUrl: './ui-menu.component.html',
  styleUrls: ['./ui-menu.component.scss']
})
export class UiMenuComponent implements OnInit {

  // Attributes for displaying the information of selected objects
  hiddenSelectedInfo = true;
  hiddenSelectedInfoBody = true;
  overlayPanel = false;
  selectedObject: any;
  // Array containing the keys of the multiple loaded events
  events: string[];
  collections: string[];

  constructor(private eventDisplay: EventdisplayService, private dialog: MatDialog) { }

  ngOnInit() {
    this.eventDisplay.listenToLoadedEventsChange((events) => this.events = events);
    this.collections = this.eventDisplay.getCollections();
  }

  toggleOverlay() {
    this.overlayPanel = !this.overlayPanel;
    this.eventDisplay.renderOverlay(this.overlayPanel);
  }

  openIODialog() {
    this.dialog.open(IOPanelComponent, { panelClass: 'dialog' });
  }
}
