import { Component, OnInit, Input } from '@angular/core';
import {
  ActiveVariable,
  PrettySymbols,
  SceneManager,
} from 'phoenix-event-display';
import { EventDisplayService } from '../../../../services/event-display.service';
import { Object3D, Event } from 'three';

@Component({
  selector: 'app-geometry-browser-overlay',
  templateUrl: './geometry-browser-overlay.component.html',
  styleUrls: ['./geometry-browser-overlay.component.scss'],
})
export class GeometryBrowserOverlayComponent implements OnInit {
  @Input() browseDetectorParts: boolean;
  collections: string[] = ['soumik c h'];
  selectedCollection: string;
  showingCollection: any;
  activeObject: ActiveVariable<string>;
  children: Object3D<Event>[];

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
    const eventDataGroup = this.getGeometriesGroup();
    this.selectedCollection = selectedCollection;
    for (const child of this.children) {
      if (child.name === this.selectedCollection) {
        this.showingCollection = child.children.map((object: any) => ({
          ...object,
          isCut: !eventDataGroup.getObjectByProperty('uuid', object.uuid)
            ?.visible,
        }));
        console.log('found');
        break;
      }
    }
  }

  highlightObject(uuid: string) {
    if (uuid) {
      this.activeObject.update(uuid);
      this.eventDisplay.highlightObject(uuid, true);
    }
  }

  private getGeometriesGroup() {
    return this.eventDisplay
      .getThreeManager()
      .getSceneManager()
      .getScene()
      .getObjectByName(SceneManager.GEOMETRIES_ID);
  }
}
