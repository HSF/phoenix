import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from 'src/app/services/eventdisplay.service';

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
  showObjectsInfo = false;
  selectedObject: any;
  // Array containing the keys of the multiple loaded events
  events: string[];
  collections: string[];
  showingCollection: any;
  collectionColumns: string[];

  constructor(private eventDisplay: EventdisplayService) { }

  ngOnInit() {
  }

  toggleOverlay() {
    this.overlayPanel = !this.overlayPanel;
    this.eventDisplay.renderOverlay(this.overlayPanel);
  }
}
