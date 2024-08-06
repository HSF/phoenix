import { Component, type OnInit, Input } from '@angular/core';
import { ActiveVariable } from 'phoenix-event-display';
import { EventDisplayService } from '../../../../services/event-display.service';
import { Object3D, type Object3DEventMap } from 'three';

@Component({
  selector: 'app-geometry-browser-overlay',
  templateUrl: './geometry-browser-overlay.component.html',
  styleUrls: ['./geometry-browser-overlay.component.scss'],
})
export class GeometryBrowserOverlayComponent implements OnInit {
  @Input() browseDetectorParts: boolean;
  selectedCollection: string;
  showingCollection: any;
  activeObject: ActiveVariable<string>;
  children: Object3D<Object3DEventMap>[];

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit() {
    this.children = this.eventDisplay
      .getThreeManager()
      .getSceneManager()
      .getGeometries().children;

    this.activeObject = this.eventDisplay.getActiveObjectId();
    this.activeObject.onUpdate((value: string) => {
      if (document.getElementById(value)) {
        document.getElementById(value).scrollIntoView(false);
      }
    });
  }

  changeCollection(selectedCollection: string) {
    this.selectedCollection = selectedCollection;
    for (const child of this.children) {
      if (child.name === this.selectedCollection) {
        this.showingCollection = child.children;
        break;
      }
    }
  }

  lookAtObject(uuid: string) {
    if (uuid) {
      this.activeObject.update(uuid);
      this.eventDisplay.lookAtObject(uuid, true);
    }
  }

  highlightObject(uuid: string) {
    if (uuid) {
      this.activeObject.update(uuid);
      this.eventDisplay.highlightObject(uuid, true);
    }
  }

  enableHighlighting() {
    this.eventDisplay.enableHighlighting();
  }

  disableHighlighting() {
    this.eventDisplay.disableHighlighting();
  }
}
