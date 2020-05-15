import { Component, OnInit, Input } from '@angular/core';
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

  constructor(private eventDisplay: EventdisplayService) { }

  ngOnInit() {
    this.eventDisplay.listenToDisplayedEventChange((event) => this.collections = this.eventDisplay.getCollections());
  }

  changeCollection(selected: any) {
    const value = selected.target.value;
    this.showingCollection = this.eventDisplay.getCollection(value);
    this.collectionColumns = Object.keys(this.showingCollection[0]);
  }

}
