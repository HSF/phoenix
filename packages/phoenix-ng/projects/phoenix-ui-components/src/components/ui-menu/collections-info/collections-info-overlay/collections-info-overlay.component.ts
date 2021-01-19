import { Component, OnInit, Input } from '@angular/core';
import { PrettySymbols } from 'phoenix-event-display';
import { EventDisplayService } from '../../../../services/event-display.service';

@Component({
  selector: 'app-collections-info-overlay',
  templateUrl: './collections-info-overlay.component.html',
  styleUrls: ['./collections-info-overlay.component.scss']
})
export class CollectionsInfoOverlayComponent implements OnInit {

  @Input() showObjectsInfo: boolean;
  // showObjectsInfo = true;
  collections: string[];
  showingCollection: any;
  collectionColumns: string[];
  activeObject: any;

  constructor(private eventDisplay: EventDisplayService) { }

  ngOnInit() {
    this.eventDisplay.listenToDisplayedEventChange((event) => this.collections = this.eventDisplay.getCollections());
    this.activeObject = this.eventDisplay.getActiveObjectId();
    this.activeObject.onUpdate((value: string) => {
      if (document.getElementById(value)) {
        document.getElementById(value).scrollIntoView(false);
      }
    });
  }

  changeCollection(selected: any) {
    const value = selected.target.value;
    this.showingCollection = this.eventDisplay.getCollection(value).map(PrettySymbols.getPrettyParams);
    this.collectionColumns = Object.keys(this.showingCollection[0]).filter((column) => column !== 'uuid');
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

  addLabel(index: number) {
    const value = (document.getElementById(`label${index}`) as HTMLInputElement)?.value;
    console.log(`Added label ${value}`);
  }

}
