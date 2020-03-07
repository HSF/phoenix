import { Component, OnInit } from '@angular/core';
import { EventdisplayService } from '../../services/eventdisplay.service';
import { Configuration } from '../../services/extras/configuration.model';
import { PresetView } from '../../services/extras/preset-view.model';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent implements OnInit {
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

  constructor(protected eventDisplay: EventdisplayService) {
  }

  ngOnInit() {
    this.selectedObject = { name: 'Object', attributes: [] };
    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -6000], 'left'),
      new PresetView('Center View', [-500, 1000, 0], 'circle'),
      new PresetView('Right View', [0, 0, 6000], 'right'),
      new PresetView('Zoom View', [-1, 1, 0], 'zoom')
    ];
    this.eventDisplay.init(configuration);
    this.eventDisplay.allowSelection(this.selectedObject);
    this.eventDisplay.renderOverlay(this.overlayPanel);
  }


  saveConfiguration() {
    this.eventDisplay.saveDisplay();
  }

  changeEvent(selected: any) {
    const value = selected.target.value;
    this.eventDisplay.loadEvent(value);
    this.collections = this.eventDisplay.getCollections();
  }

  changeCollection(selected: any) {
    const value = selected.target.value;
    this.showingCollection = this.eventDisplay.getCollection(value);
    this.collectionColumns = Object.keys(this.showingCollection[0]);
  }

  toggleInfo() {
    this.hiddenSelectedInfo = !this.hiddenSelectedInfo;
  }

  exportToOBJ() {
    this.eventDisplay.exportToOBJ();
  }

  toggleOverlay() {
    this.overlayPanel = !this.overlayPanel;
    this.eventDisplay.renderOverlay(this.overlayPanel);
  }
}
