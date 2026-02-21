import {
  Component,
  ElementRef,
  Input,
  type OnInit,
  type OnDestroy,
} from '@angular/core';
import {
  ActiveVariable,
  PrettySymbols,
  SceneManager,
} from 'phoenix-event-display';
import { EventDisplayService } from '../../../../services/event-display.service';

@Component({
  standalone: false,
  selector: 'app-collections-info-overlay',
  templateUrl: './collections-info-overlay.component.html',
  styleUrls: ['./collections-info-overlay.component.scss'],
})
export class CollectionsInfoOverlayComponent implements OnInit, OnDestroy {
  @Input() showObjectsInfo: boolean;
  /** Columns to exclude from the collection info table. */
  @Input() excludedColumns: string[] = ['uuid', 'hits', 'isCut', 'labelText'];
  hideInvisible: boolean;
  collections: { type: string; collections: string[] }[];
  selectedCollection: string;
  showingCollection: any;
  collectionColumns: string[];
  getPrettySymbol = PrettySymbols.getPrettySymbol;
  activeObject: ActiveVariable<string>;
  private unsubscribes: (() => void)[] = [];

  constructor(
    private elementRef: ElementRef,
    private eventDisplay: EventDisplayService,
  ) {}

  ngOnInit() {
    this.unsubscribes.push(
      this.eventDisplay.listenToDisplayedEventChange(() => {
        const collectionsGrouped: { [key: string]: string[] } =
          this.eventDisplay.getCollections();
        this.collections = Object.entries(collectionsGrouped).map(
          ([type, collections]: [string, string[]]) => ({
            type,
            collections,
          }),
        );
      }),
    );

    this.activeObject = this.eventDisplay.getActiveObjectId();
    this.unsubscribes.push(
      this.activeObject.onUpdate((value: string) => {
        if (document.getElementById(value)) {
          document.getElementById(value).scrollIntoView(false);
        }
      }),
    );
  }

  ngOnDestroy() {
    this.unsubscribes.forEach((unsubscribe) => unsubscribe?.());
  }

  changeCollection(selectedCollection: string) {
    const eventDataGroup = this.getEventDataGroup();
    this.selectedCollection = selectedCollection;

    this.showingCollection = this.eventDisplay
      .getCollection(selectedCollection)
      .map((object: any) => ({
        ...object,
        isCut: !eventDataGroup.getObjectByProperty('uuid', object.uuid)
          ?.visible,
      }));

    this.collectionColumns = Object.keys(this.showingCollection[0]).filter(
      (column) => !this.excludedColumns.includes(column),
    );
  }

  sort(column: string, order: string) {
    if (order === 'asc')
      this.showingCollection.sort((a, b) => (a[column] < b[column] ? -1 : 1));
    else
      this.showingCollection.sort((a, b) => (a[column] > b[column] ? -1 : 1));
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

  enableHighlighting() {
    this.eventDisplay.enableHighlighting();
  }

  disableHighlighting() {
    this.eventDisplay.disableHighlighting();
  }

  toggleInvisible(checked: boolean) {
    this.hideInvisible = checked;
  }

  addLabel(index: number, uuid: string) {
    const labelValue = this.elementRef.nativeElement.querySelector(
      `#label${index}`,
    ).value;
    if (this.selectedCollection) {
      // Empty labelValue will remove the label object
      this.eventDisplay.addLabelToObject(
        labelValue,
        this.selectedCollection,
        index,
        uuid,
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
