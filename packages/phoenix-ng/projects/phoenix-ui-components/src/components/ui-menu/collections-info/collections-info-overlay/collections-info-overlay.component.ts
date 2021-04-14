import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { PrettySymbols, ActiveVariable } from 'phoenix-event-display';
import { EventDisplayService } from '../../../../services/event-display.service';

@Component({
  selector: 'app-collections-info-overlay',
  templateUrl: './collections-info-overlay.component.html',
  styleUrls: ['./collections-info-overlay.component.scss'],
})
export class CollectionsInfoOverlayComponent implements OnInit {
  @Input() showObjectsInfo: boolean;
  collections: string[];
  selectedCollection: string;
  showingCollection: any;
  collectionColumns: string[];
  activeObject: ActiveVariable<string>;

  constructor(
    private elementRef: ElementRef,
    private eventDisplay: EventDisplayService
  ) {}

  ngOnInit() {
    this.eventDisplay.listenToDisplayedEventChange(
      (event) => (this.collections = this.eventDisplay.getCollections())
    );
    this.activeObject = this.eventDisplay.getActiveObjectId();
    this.activeObject.onUpdate((value: string) => {
      if (document.getElementById(value)) {
        document.getElementById(value).scrollIntoView(false);
      }
    });
  }

  changeCollection(selected: any) {
    const value = selected.target.value;
    this.selectedCollection = value;
    this.showingCollection = this.eventDisplay
      .getCollection(value)
      .map(PrettySymbols.getPrettyParams);
    this.collectionColumns = Object.keys(this.showingCollection[0]).filter(
      (column) => column !== 'uuid' && column !== 'hits' // FIXME - this is an ugly hack. But currently hits from tracks make track collections unusable. Better to have exlusion list passed in.
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
}
