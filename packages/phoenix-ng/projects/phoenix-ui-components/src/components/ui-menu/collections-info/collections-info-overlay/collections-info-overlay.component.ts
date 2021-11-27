import { Component, OnInit, Input, ElementRef } from '@angular/core';
import {
  PrettySymbols,
  ActiveVariable,
  SceneManager,
} from 'phoenix-event-display';
import { EventDisplayService } from '../../../../services/event-display.service';

@Component({
  selector: 'app-collections-info-overlay',
  templateUrl: './collections-info-overlay.component.html',
  styleUrls: ['./collections-info-overlay.component.scss'],
})
export class CollectionsInfoOverlayComponent implements OnInit {
  @Input() showObjectsInfo: boolean;
  hideInvisible: boolean;
  collections: string[];
  selectedCollection: string;
  showingCollection: any;
  allCollection: any;
  visibleCollection: any;
  collectionColumns: string[];
  getPrettySymbol = PrettySymbols.getPrettySymbol;
  activeObject: ActiveVariable<string>;

  constructor(
    private elementRef: ElementRef,
    private eventDisplay: EventDisplayService
  ) {}

  ngOnInit() {
    this.eventDisplay.listenToDisplayedEventChange(
      (_event) => (this.collections = this.eventDisplay.getCollections())
    );
    this.activeObject = this.eventDisplay.getActiveObjectId();
    this.activeObject.onUpdate((value: string) => {
      if (document.getElementById(value)) {
        document.getElementById(value).scrollIntoView(false);
      }
    });
  }

  changeCollection(selectedCollection: string) {
    const eventDataGroup = this.getEventDataGroup();
    this.selectedCollection = selectedCollection;

    this.allCollection = this.eventDisplay
      .getCollection(selectedCollection)
      .map((object: any) => ({
        ...object,
        isCut: !eventDataGroup.getObjectByProperty('uuid', object.uuid)
          ?.visible,
      }));

    this.visibleCollection = this.allCollection.filter(
      (collection) => collection.isCut === false
    );

    if (this.hideInvisible) this.showingCollection = this.visibleCollection;
    else this.showingCollection = this.allCollection;

    this.collectionColumns = Object.keys(this.allCollection[0]).filter(
      (column) => !['uuid', 'hits', 'isCut'].includes(column) // FIXME - this is an ugly hack. But currently hits from tracks make track collections unusable. Better to have exlusion list passed in.
    );
  }

  lookAtObject(uuid: string) {
    if (uuid) {
      this.activeObject.update(uuid);
      this.eventDisplay.lookAtObject(uuid);
    }
  }

  highlightObject(uuid: string) {
    if (uuid) {
      this.activeObject.update(uuid);
      this.eventDisplay.highlightObject(uuid);
    }
  }

  toggleInvisible(checked: boolean) {
    this.hideInvisible = checked;

    if (this.hideInvisible) this.showingCollection = this.visibleCollection;
    else this.showingCollection = this.allCollection;
  }

  addLabel(index: number, uuid: string) {
    const labelValue = this.elementRef.nativeElement.querySelector(
      `#label${index}`
    ).value;
    if (this.selectedCollection) {
      // Empty labelValue will remove the label object
      this.eventDisplay.addLabelToObject(
        labelValue,
        this.selectedCollection,
        index,
        uuid
      );
    }
  }

  private getEventDataGroup() {
    return this.eventDisplay
      .getThreeManager()
      .getSceneManager()
      .getScene()
      .getObjectByName(SceneManager.EVENT_DATA_ID);
  }
}
