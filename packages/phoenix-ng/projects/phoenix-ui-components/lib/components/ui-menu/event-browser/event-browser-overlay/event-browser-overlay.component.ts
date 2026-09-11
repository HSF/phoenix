import { Component, Input, type OnInit, type OnDestroy } from '@angular/core';
import { type EventSummary, getAvailableColumns } from 'phoenix-event-display';
import { EventDisplayService } from '../../../../services/event-display.service';

/** Sort state for a column. */
interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

/** Filter for a collection count column. */
interface ColumnFilter {
  column: string;
  operator: '>=' | '<=' | '=';
  value: number;
}

/** Detector-level types (fixed per detector, not per event). */
const DETECTOR_LEVEL_TYPES = new Set([
  'CaloCells',
  'Hits',
  'PlanarCaloCells',
  'IrregularCaloCells',
]);

@Component({
  standalone: false,
  selector: 'app-event-browser-overlay',
  templateUrl: './event-browser-overlay.component.html',
  styleUrls: ['./event-browser-overlay.component.scss'],
})
export class EventBrowserOverlayComponent implements OnInit, OnDestroy {
  @Input() showEventBrowser: boolean;

  /** All event summaries from the pre-scan. */
  allSummaries: EventSummary[] = [];
  /** Filtered and sorted summaries for display. */
  displayedSummaries: EventSummary[] = [];
  /** Collection type columns available across all events. */
  columns: string[] = [];
  /** Currently active sort. */
  currentSort: SortState | null = null;
  /** Currently selected event key (row highlight). */
  selectedEventKey: string | null = null;
  /** Currently loaded event key (displayed in 3D). */
  loadedEventKey: string | null = null;
  /** Event key currently being loaded (for spinner). */
  loadingEventKey: string | null = null;
  /** Active filters. */
  filters: ColumnFilter[] = [];
  /** MET filter minimum value. */
  metFilterMin: number | null = null;
  /** Search query for event number/key. */
  searchQuery: string = '';

  /** Filter input state for adding new filters. */
  filterColumn: string = '';
  filterOperator: '>=' | '<=' | '=' = '>=';
  filterValue: number | null = null;

  private unsubscribes: (() => void)[] = [];

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit() {
    // Track the currently loaded event
    this.loadedEventKey = this.eventDisplay.getCurrentEventKey();

    // Catch events already loaded before this component initialized
    const existing = this.eventDisplay.getEventSummaries();
    if (existing.length > 0) {
      this.buildSummaries();
    }

    this.unsubscribes.push(
      this.eventDisplay.listenToLoadedEventsChange(() => {
        this.buildSummaries();
      }),
    );

    // Update loaded/loading state when any event finishes rendering
    this.unsubscribes.push(
      this.eventDisplay.listenToDisplayedEventChange(() => {
        this.loadedEventKey = this.eventDisplay.getCurrentEventKey();
        this.loadingEventKey = null;
      }),
    );
  }

  ngOnDestroy() {
    this.unsubscribes.forEach((fn) => fn?.());
  }

  /** Build summaries from loaded events data. */
  buildSummaries() {
    this.allSummaries = this.eventDisplay.getEventSummaries();
    this.columns = getAvailableColumns(this.allSummaries);
    this.filters = [];
    this.metFilterMin = null;
    this.currentSort = null;
    this.applyFiltersAndSort();
  }

  /** Get the count for a collection type in an event summary. */
  getCount(summary: EventSummary, column: string): number {
    return summary.collectionCounts[column] ?? 0;
  }

  /** Format a number with comma separators. */
  formatNumber(value: number): string {
    return value.toLocaleString();
  }

  /** Compute reconstructed objects total (excluding detector-level types). */
  getRecoTotal(summary: EventSummary): number {
    let total = 0;
    for (const [typeName, count] of Object.entries(summary.collectionCounts)) {
      if (!DETECTOR_LEVEL_TYPES.has(typeName)) {
        total += count;
      }
    }
    return total;
  }

  /** Format MET for display. */
  formatMET(met: number): string {
    if (isNaN(met)) return '-';
    return (met / 1000).toFixed(1) + ' GeV';
  }

  /** Sort by a column. Clicking same column+direction resets sort. */
  sort(column: string, direction: 'asc' | 'desc') {
    if (
      this.currentSort?.column === column &&
      this.currentSort?.direction === direction
    ) {
      this.currentSort = null;
    } else {
      this.currentSort = { column, direction };
    }
    this.applyFiltersAndSort();
  }

  /** Sort by MET. */
  sortByMET(direction: 'asc' | 'desc') {
    if (
      this.currentSort?.column === '_met' &&
      this.currentSort?.direction === direction
    ) {
      this.currentSort = null;
    } else {
      this.currentSort = { column: '_met', direction };
    }
    this.applyFiltersAndSort();
  }

  /** Sort by reco total. */
  sortByReco(direction: 'asc' | 'desc') {
    if (
      this.currentSort?.column === '_reco' &&
      this.currentSort?.direction === direction
    ) {
      this.currentSort = null;
    } else {
      this.currentSort = { column: '_reco', direction };
    }
    this.applyFiltersAndSort();
  }

  /** Add a filter from the UI controls. */
  addFilter() {
    if (!this.filterColumn || this.filterValue === null) return;

    // Remove existing filter on same column
    this.filters = this.filters.filter((f) => f.column !== this.filterColumn);
    this.filters.push({
      column: this.filterColumn,
      operator: this.filterOperator,
      value: this.filterValue,
    });
    this.applyFiltersAndSort();
  }

  /** Remove a filter. */
  removeFilter(index: number) {
    this.filters.splice(index, 1);
    this.applyFiltersAndSort();
  }

  /** Update MET minimum filter. */
  updateMETFilter(value: string) {
    const parsed = parseFloat(value);
    this.metFilterMin = isNaN(parsed) ? null : parsed * 1000; // Convert GeV to MeV
    this.applyFiltersAndSort();
  }

  /** Update search query and re-filter. */
  updateSearch(query: string) {
    this.searchQuery = query.trim();
    this.applyFiltersAndSort();
  }

  /** Jump to an event by search - selects and loads the first match. */
  jumpToSearch() {
    if (this.displayedSummaries.length > 0) {
      this.selectEvent(this.displayedSummaries[0]);
    }
  }

  /** Clear all filters. */
  clearFilters() {
    this.filters = [];
    this.metFilterMin = null;
    this.searchQuery = '';
    this.applyFiltersAndSort();
  }

  /** Apply all active filters and current sort to produce displayedSummaries. */
  applyFiltersAndSort() {
    let result = [...this.allSummaries];

    // Apply search query (matches event number or event key)
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.eventKey.toLowerCase().includes(query) ||
          (s.eventNumber !== undefined &&
            String(s.eventNumber).toLowerCase().includes(query)),
      );
    }

    // Apply column filters
    for (const filter of this.filters) {
      result = result.filter((s) => {
        const value = s.collectionCounts[filter.column] ?? 0;
        switch (filter.operator) {
          case '>=':
            return value >= filter.value;
          case '<=':
            return value <= filter.value;
          case '=':
            return value === filter.value;
          default:
            return true;
        }
      });
    }

    // Apply MET filter
    if (this.metFilterMin !== null) {
      result = result.filter(
        (s) => !isNaN(s.met) && s.met >= this.metFilterMin,
      );
    }

    // Apply sort
    if (this.currentSort) {
      const { column, direction } = this.currentSort;
      const multiplier = direction === 'asc' ? 1 : -1;

      result.sort((a, b) => {
        let valA: number, valB: number;
        if (column === '_met') {
          valA = isNaN(a.met) ? -1 : a.met;
          valB = isNaN(b.met) ? -1 : b.met;
        } else if (column === '_reco') {
          valA = this.getRecoTotal(a);
          valB = this.getRecoTotal(b);
        } else {
          valA = a.collectionCounts[column] ?? 0;
          valB = b.collectionCounts[column] ?? 0;
        }
        return (valA - valB) * multiplier;
      });
    }

    this.displayedSummaries = result;
  }

  /** Load the selected event. */
  selectEvent(summary: EventSummary) {
    this.selectedEventKey = summary.eventKey;
    this.loadingEventKey = summary.eventKey;
    this.eventDisplay.loadEvent(summary.eventKey);
  }

  /** Handle keyboard navigation on the table. */
  onTableKeydown(event: KeyboardEvent) {
    if (!this.displayedSummaries.length) return;

    const currentIndex = this.selectedEventKey
      ? this.displayedSummaries.findIndex(
          (s) => s.eventKey === this.selectedEventKey,
        )
      : -1;

    let newIndex = currentIndex;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      newIndex = Math.min(currentIndex + 1, this.displayedSummaries.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      newIndex = Math.max(currentIndex - 1, 0);
    } else if (event.key === 'Enter' && currentIndex >= 0) {
      event.preventDefault();
      this.selectEvent(this.displayedSummaries[currentIndex]);
      return;
    } else {
      return;
    }

    if (newIndex !== currentIndex && newIndex >= 0) {
      this.selectedEventKey = this.displayedSummaries[newIndex].eventKey;
      const row = document.getElementById('event-row-' + this.selectedEventKey);
      if (row) {
        row.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  /** Get display label for an event (event number + run number). */
  getEventLabel(summary: EventSummary): string {
    const parts: string[] = [];
    if (summary.eventNumber !== undefined) {
      parts.push(String(summary.eventNumber));
    } else {
      parts.push(summary.eventKey);
    }
    return parts.join('');
  }

  /** Get run number display. */
  getRunLabel(summary: EventSummary): string {
    if (summary.runNumber !== undefined) {
      return 'Run ' + String(summary.runNumber);
    }
    return '';
  }

  /** Get a filter description for display. */
  getFilterLabel(filter: ColumnFilter): string {
    return `${filter.column} ${filter.operator} ${filter.value}`;
  }

  /** Check if the sort indicator should be active. */
  isSortActive(column: string, direction: 'asc' | 'desc'): boolean {
    return (
      this.currentSort?.column === column &&
      this.currentSort?.direction === direction
    );
  }

  /** Check if a row is the currently loaded event. */
  isLoadedEvent(summary: EventSummary): boolean {
    return this.loadedEventKey === summary.eventKey;
  }

  /** Check if a row is currently loading. */
  isLoadingEvent(summary: EventSummary): boolean {
    return this.loadingEventKey === summary.eventKey;
  }
}
