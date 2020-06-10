import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { EventdisplayService } from 'src/app/services/eventdisplay.service';

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

  constructor(private eventDisplay: EventdisplayService) { }

  ngOnInit() {
    this.eventDisplay.listenToDisplayedEventChange((event) => this.collections = this.eventDisplay.getCollections());
    this.eventDisplay.getActiveObjectId().subscribe((value) => {
      this.activeObjectId = value;
      if (document.getElementById(value)) {
        document.getElementById(value).scrollIntoView(false);
      }
    });
  }

  changeCollection(selected: any) {
    const value = selected.target.value;
    this.showingCollection = this.eventDisplay.getCollection(value);
    this.collectionColumns = Object.keys(this.showingCollection[0]).filter((column) => column !== 'uuid');
  }

  lookAtObject(uuid: string) {
    if (uuid) {
      this.eventDisplay.getActiveObjectId().next(uuid);
      this.eventDisplay.lookAtObject(uuid);
    }
  }

}
