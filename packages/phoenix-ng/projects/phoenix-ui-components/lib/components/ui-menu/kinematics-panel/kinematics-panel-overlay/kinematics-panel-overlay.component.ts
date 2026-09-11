import {
  ChangeDetectorRef,
  Component,
  Input,
  type OnInit,
  type OnDestroy,
} from '@angular/core';
import {
  ActiveVariable,
  SceneManager,
  type KinematicsConfig,
  type KinematicsColumn,
  ATLAS_KINEMATICS,
} from 'phoenix-event-display';
import { EventDisplayService } from '../../../../services/event-display.service';

/** Pre-computed row for display. */
interface KinematicsRow {
  uuid: string;
  values: { [columnId: string]: number | string };
  isCut: boolean;
}

@Component({
  standalone: false,
  selector: 'app-kinematics-panel-overlay',
  templateUrl: './kinematics-panel-overlay.component.html',
  styleUrls: ['./kinematics-panel-overlay.component.scss'],
})
export class KinematicsPanelOverlayComponent implements OnInit, OnDestroy {
  /** Visibility toggle — refreshes data when panel becomes visible. */
  private _showKinematics = false;
  @Input() set showKinematics(val: boolean) {
    const wasHidden = !this._showKinematics;
    this._showKinematics = val;
    if (val && wasHidden) {
      this.refreshData();
    }
  }
  get showKinematics(): boolean {
    return this._showKinematics;
  }

  @Input() config: KinematicsConfig = ATLAS_KINEMATICS;

  /** Available collections matching the configured type. */
  collections: string[];
  /** Currently selected collection name. */
  selectedCollection: string;
  /** All rows before filtering. */
  allRows: KinematicsRow[] = [];
  /** Filtered display rows. */
  rows: KinematicsRow[] = [];
  /** Current sort state. */
  sortColumn: string;
  sortDirection: 'asc' | 'desc' = 'desc';
  /** Tracks the 3D-selected object for bidirectional highlighting. */
  activeObject: ActiveVariable<string>;
  /** Resolved group uuid for the currently active 3D object. */
  activeRowUuid = '';
  /** Filter threshold value (for pT cut etc.). */
  filterValue: number = 0;
  /** Resolved filter column definition. */
  filterCol: KinematicsColumn | undefined;

  private unsubscribes: (() => void)[] = [];

  constructor(
    private eventDisplay: EventDisplayService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.sortColumn = this.config.defaultSort ?? '';
    this.sortDirection = this.config.defaultSortDirection ?? 'desc';
    this.filterCol = this.config.filterColumn
      ? this.config.columns.find((c) => c.id === this.config.filterColumn)
      : undefined;

    // Refresh when event data changes (new event loaded).
    this.unsubscribes.push(
      this.eventDisplay.listenToDisplayedEventChange(() => {
        this.refreshData();
      }),
    );

    // Bidirectional selection — scroll to row when object hovered/selected in 3D.
    // Walks up the scene hierarchy to resolve child mesh uuids to row group uuids.
    // Note: currently only fires for Mesh objects (jets, calo cells). Tracks are
    // rendered as Lines which the selection manager doesn't hover-detect yet.
    this.activeObject = this.eventDisplay.getActiveObjectId();
    this.unsubscribes.push(
      this.activeObject.onUpdate((uuid: string) => {
        if (!uuid) {
          this.activeRowUuid = '';
          this.cdr.detectChanges();
          return;
        }
        let resolvedUuid = uuid;
        let el = document.getElementById('kin-' + uuid);
        if (!el) {
          const scene = this.eventDisplay
            .getThreeManager()
            .getSceneManager()
            .getScene();
          const obj = scene.getObjectByProperty('uuid', uuid);
          let ancestor = obj?.parent;
          while (ancestor && !el) {
            el = document.getElementById('kin-' + ancestor.uuid);
            if (el) {
              resolvedUuid = ancestor.uuid;
            }
            ancestor = ancestor.parent;
          }
        }
        this.activeRowUuid = resolvedUuid;
        this.cdr.detectChanges();
        if (el) {
          el.scrollIntoView({ block: 'nearest' });
        }
      }),
    );
  }

  ngOnDestroy() {
    this.unsubscribes.forEach((unsub) => unsub?.());
  }

  /** Reload collections and recompute rows. */
  refreshData() {
    const allCollections = this.eventDisplay.getCollections();
    const type = this.config.collectionType ?? 'Tracks';
    this.collections = allCollections[type] ?? [];

    if (this.collections.length > 0) {
      if (
        !this.selectedCollection ||
        !this.collections.includes(this.selectedCollection)
      ) {
        this.selectCollection(this.collections[0]);
      } else {
        this.selectCollection(this.selectedCollection);
      }
    } else {
      this.selectedCollection = '';
      this.allRows = [];
      this.rows = [];
    }
  }

  /** Load and compute rows for a collection. */
  selectCollection(name: string) {
    this.selectedCollection = name;
    const rawObjects = this.eventDisplay.getCollection(name);
    if (!rawObjects || !Array.isArray(rawObjects)) {
      this.allRows = [];
      this.rows = [];
      return;
    }

    const eventDataGroup = this.eventDisplay
      .getThreeManager()
      .getSceneManager()
      .getScene()
      .getObjectByName(SceneManager.EVENT_DATA_ID);

    this.allRows = rawObjects.map((obj: any) => {
      const values: { [id: string]: number | string } = {};
      for (const col of this.config.columns) {
        try {
          values[col.id] = col.getter(obj);
        } catch {
          values[col.id] = 0;
        }
      }

      return {
        uuid: obj.uuid,
        values,
        isCut: obj.uuid
          ? !eventDataGroup?.getObjectByProperty('uuid', obj.uuid)?.visible
          : false,
      };
    });

    this.applyFilterAndSort();
  }

  /** Toggle sort on a column. */
  sort(columnId: string) {
    if (this.sortColumn === columnId) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columnId;
      this.sortDirection = 'desc';
    }
    this.applyFilterAndSort();
  }

  /** Update the filter threshold and refilter. */
  onFilterChange(value: string) {
    this.filterValue = parseFloat(value) || 0;
    this.applyFilterAndSort();
  }

  /** Apply filter then sort. */
  private applyFilterAndSort() {
    // Filter
    if (this.filterCol && this.filterValue > 0) {
      const colId = this.filterCol.id;
      this.rows = this.allRows.filter((row) => {
        const v = row.values[colId];
        return typeof v === 'number' && v >= this.filterValue;
      });
    } else {
      this.rows = [...this.allRows];
    }

    // Sort
    if (this.sortColumn) {
      const col = this.sortColumn;
      const dir = this.sortDirection === 'asc' ? 1 : -1;
      this.rows.sort((a, b) => {
        const va = a.values[col];
        const vb = b.values[col];
        if (typeof va === 'number' && typeof vb === 'number') {
          return (va - vb) * dir;
        }
        return String(va).localeCompare(String(vb)) * dir;
      });
    }
  }

  /** Highlight a track in 3D and update active object. */
  selectTrack(row: KinematicsRow) {
    if (!row.uuid) return;
    this.activeRowUuid = row.uuid;
    this.activeObject.update(row.uuid);
    this.eventDisplay.highlightObject(row.uuid);

    // TODO: Emit 'track:inspected' via event bus when #826 event bus lands on main.
  }

  /** Pan camera to a track and highlight it. */
  lookAtTrack(uuid: string, event: Event) {
    event.stopPropagation();
    if (!uuid) return;
    this.activeObject.update(uuid);
    this.eventDisplay.lookAtObject(uuid);
  }

  /** Keyboard navigation: arrow keys move between rows, Enter looks at track. */
  onKeyDown(event: KeyboardEvent) {
    if (!this.rows.length) return;
    const currentIndex = this.rows.findIndex(
      (r) => r.uuid === this.activeObject?.value,
    );

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = Math.min(currentIndex + 1, this.rows.length - 1);
      this.selectTrack(this.rows[next]);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = Math.max(currentIndex < 0 ? 0 : currentIndex - 1, 0);
      this.selectTrack(this.rows[prev]);
    } else if (event.key === 'Enter' && currentIndex >= 0) {
      event.preventDefault();
      this.eventDisplay.lookAtObject(this.rows[currentIndex].uuid);
    }
  }

  /** Export displayed rows as TSV. */
  exportTSV() {
    if (!this.rows.length) return;
    const cols = this.config.columns;

    // Header row
    let tsv =
      cols
        .map((c) => (c.unit ? `${c.label} (${c.unit})` : c.label))
        .join('\t') + '\n';

    // Data rows
    for (const row of this.rows) {
      tsv +=
        cols.map((c) => this.formatValue(row.values[c.id], c)).join('\t') +
        '\n';
    }

    const filename =
      this.selectedCollection.toLowerCase().replace(/\s+/g, '_') +
      '_kinematics.tsv';
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Format a value for display. */
  formatValue(value: number | string, col: KinematicsColumn): string {
    if (typeof value === 'string') return value;
    if (!isFinite(value)) return '\u2014';
    const precision = col.precision ?? 1;
    return value.toFixed(precision);
  }

  /** Get the charge sign class for colored +/- display. */
  getChargeClass(col: KinematicsColumn, value: number | string): string {
    if (col.id !== 'charge' || typeof value !== 'number') return '';
    if (value > 0) return 'charge-pos';
    if (value < 0) return 'charge-neg';
    return '';
  }

  /** Charge-based color for the row index number. */
  getChargeColor(row: KinematicsRow): string {
    const v = row.values['charge'];
    if (typeof v !== 'number' || v === 0) return '';
    return v > 0 ? '#ff6b6b' : '#6baaff';
  }
}
