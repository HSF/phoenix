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
  @Input() excludedColumns: string[] = [
    'uuid',
    'hits',
    'isCut',
    'labelText',
    '_instanceId',
    '_position',
    'index',
  ];
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
    const updateCollections = () => {
      const collectionsGrouped: { [key: string]: string[] } =
        this.eventDisplay.getCollections();
      if (collectionsGrouped) {
        this.collections = Object.entries(collectionsGrouped).map(
          ([type, collections]: [string, string[]]) => ({
            type,
            collections,
          }),
        );
      }
    };

    updateCollections();

    this.unsubscribes.push(
      this.eventDisplay.listenToDisplayedEventChange(() => updateCollections()),
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
        isCut: this.isObjectCut(object, eventDataGroup),
      }));

    this.collectionColumns = Object.keys(this.showingCollection[0]).filter(
      (column) => !this.excludedColumns.includes(column),
    );
  }

  /**
   * Check whether an object is hidden by filtering.
   * For InstancedMesh CaloCells, checks the instance matrix for zero-scale.
   */
  private isObjectCut(object: any, eventDataGroup: any): boolean {
    const sceneObject = eventDataGroup?.getObjectByProperty(
      'uuid',
      object.uuid,
    );
    if (!sceneObject) return false;

    // InstancedMesh: check if instance matrix is zero-scale
    if (
      sceneObject.userData?._isInstancedCaloCells &&
      object._instanceId !== undefined
    ) {
      if (!sceneObject.userData._originalMatrices) {
        return false; // No filtering applied yet — all visible
      }
      const arr = sceneObject.instanceMatrix.array;
      const off = object._instanceId * 16;
      // Zero-scale matrix has diagonal elements [0],[5],[10] = 0
      return arr[off] === 0 && arr[off + 5] === 0 && arr[off + 10] === 0;
    }

    return !sceneObject.visible;
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

  formatValue(value: any): string {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }
    if (Array.isArray(value)) {
      return `[${value
        .map((v) =>
          typeof v === 'number'
            ? Number.isInteger(v)
              ? String(v)
              : v.toFixed(2)
            : v,
        )
        .join(', ')}]`;
    }
    // Handle stringified numbers and arrays
    const str = String(value).trim();
    const numValue = parseFloat(str);
    if (!isNaN(numValue) && str !== '') {
      return Number.isInteger(numValue)
        ? String(numValue)
        : numValue.toFixed(2);
    }
    // Try to parse as stringified array: remove brackets and split by comma
    if ((str.includes('[') && str.includes(']')) || str.includes(',')) {
      const cleaned = str.replaceAll('[', '').replaceAll(']', '').trim();
      const parts = cleaned.split(',').map((s) => s.trim());
      const formatted = parts
        .map((p) => {
          const n = parseFloat(p);
          return !isNaN(n)
            ? Number.isInteger(n)
              ? String(n)
              : n.toFixed(2)
            : p;
        })
        .filter((p) => p !== '');
      return formatted.length > 0 ? `[${formatted.join(', ')}]` : str;
    }
    return str;
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
