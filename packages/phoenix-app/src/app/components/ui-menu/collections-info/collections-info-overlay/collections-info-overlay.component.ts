import { Component, OnInit, Input } from '@angular/core';
import { EventDisplayService } from 'src/app/services/eventdisplay.service';

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
  activeObjectId: string;

  constructor(private eventDisplay: EventDisplayService) { }

  ngOnInit() {
    this.eventDisplay.instance.listenToDisplayedEventChange((event) => this.collections = this.eventDisplay.instance.getCollections());
    this.eventDisplay.instance.getActiveObjectId().subscribe((value) => {
      this.activeObjectId = value;
      if (document.getElementById(value)) {
        document.getElementById(value).scrollIntoView(false);
      }
    });
  }

  changeCollection(selected: any) {
    const value = selected.target.value;
    this.showingCollection = this.eventDisplay.instance.getCollection(value);
    this.collectionColumns = Object.keys(this.showingCollection[0]).filter((column) => column !== 'uuid');
  }

  lookAtObject(uuid: string) {
    if (uuid) {
      this.eventDisplay.instance.getActiveObjectId().next(uuid);
      this.eventDisplay.instance.lookAtObject(uuid);
    }
  }

  highlightObject(uuid: string) {
    if (uuid) {
      this.eventDisplay.instance.getActiveObjectId().next(uuid);
      this.eventDisplay.instance.highlightObject(uuid);
    }
  }

}
