import { Component, Input, type OnDestroy, type OnInit } from '@angular/core';
import {
  type TaggedParticle,
  type ParticleTagDef,
  type MasterclassConfig,
  type FourMomentum,
  ATLAS_MASTERCLASS_CONFIG,
  fourMomentumFromTrack,
  fourMomentumFromCluster,
  invariantMass,
} from 'phoenix-event-display';
import { EventDisplayService } from '../../../../services/event-display.service';

interface MassResult {
  eventType: string;
  mass: number;
  particleCount: number;
}

interface CollectionItem {
  index: number;
  uuid: string;
  userData: any;
  selected: boolean;
  pT: number;
  eta: number;
  phi: number;
}

@Component({
  standalone: false,
  selector: 'app-masterclass-panel-overlay',
  templateUrl: './masterclass-panel-overlay.component.html',
  styleUrls: ['./masterclass-panel-overlay.component.scss'],
})
export class MasterclassPanelOverlayComponent implements OnInit, OnDestroy {
  @Input() showPanel: boolean;
  @Input() config: MasterclassConfig = ATLAS_MASTERCLASS_CONFIG;

  // Step 1: Collection selection
  collectionNames: string[] = [];
  selectedCollection = '';
  collectionItems: CollectionItem[] = [];

  // Step 2: Tagged particles
  taggedParticles: TaggedParticle[] = [];

  // Step 3: Invariant mass results (persisted across events)
  massResults: MassResult[] = [];

  // UI state
  statusMessage = '';
  statusType: 'info' | 'success' | 'warning' = 'info';

  /** Live invariant mass of currently tagged particles. */
  get liveMass(): number {
    if (this.taggedParticles.length < 2) return 0;
    return invariantMass(this.taggedParticles.map((p) => p.fourMomentum));
  }

  /** Live event type classification using experiment-specific classifier. */
  get liveEventType(): string {
    const tagCounts: Record<string, number> = {};
    for (const p of this.taggedParticles) {
      tagCounts[p.tag] = (tagCounts[p.tag] ?? 0) + 1;
    }
    return this.config.classifyEvent(tagCounts);
  }

  get selectedCount(): number {
    return this.collectionItems.filter((i) => i.selected).length;
  }

  private unsubscribes: (() => void)[] = [];

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit() {
    this.unsubscribes.push(
      this.eventDisplay.listenToDisplayedEventChange(() => {
        this.taggedParticles = [];
        this.statusMessage = '';
        this.selectedCollection = '';
        this.loadCollections();
      }),
    );
    setTimeout(() => this.loadCollections(), 500);
  }

  ngOnDestroy() {
    this.unsubscribes.forEach((fn) => fn?.());
  }

  // ── Step 1: Collection ──────────────────────────────────

  private loadCollections() {
    const grouped = this.eventDisplay.getCollections();
    this.collectionNames = [];
    for (const [, names] of Object.entries(grouped) as [string, string[]][]) {
      this.collectionNames.push(...names);
    }
    if (this.collectionNames.length > 0 && !this.selectedCollection) {
      this.selectCollection(this.collectionNames[0]);
    }
  }

  selectCollection(name: string) {
    this.selectedCollection = name;
    const objects = this.eventDisplay.getCollection(name) || [];
    this.collectionItems = objects.map((obj: any, i: number) => ({
      index: i + 1,
      uuid: obj.uuid,
      userData: obj,
      selected: false,
      pT: obj.pT ?? 0,
      eta: obj.eta ?? 0,
      phi: obj.phi ?? obj.dparams?.[2] ?? 0,
    }));
  }

  toggleItem(item: CollectionItem) {
    item.selected = !item.selected;
  }

  highlightItem(uuid: string) {
    this.eventDisplay.highlightObject(uuid);
  }

  // ── Step 2: Tagging ─────────────────────────────────────

  tagSelectedAs(tagDef: ParticleTagDef) {
    this.statusMessage = '';
    const selected = this.collectionItems.filter((i) => i.selected);

    if (selected.length === 0) {
      this.setStatus('Select tracks from the list first.', 'warning');
      return;
    }

    let added = 0;
    for (const item of selected) {
      if (this.taggedParticles.some((p) => p.uuid === item.uuid)) continue;

      const ud = item.userData;
      let fourMom: FourMomentum | null = null;

      // For massless particles, prefer cluster data; otherwise prefer track data.
      if (tagDef.mass === 0) {
        fourMom =
          fourMomentumFromCluster(ud) || fourMomentumFromTrack(ud, tagDef.mass);
      } else {
        fourMom =
          fourMomentumFromTrack(ud, tagDef.mass) || fourMomentumFromCluster(ud);
      }

      if (!fourMom) continue;

      const tagged: TaggedParticle = {
        uuid: item.uuid,
        tag: tagDef.id,
        fourMomentum: fourMom,
        pT: ud.pT ?? 0,
        eta: ud.eta ?? 0,
        phi: ud.phi ?? ud.dparams?.[2] ?? 0,
      };

      this.taggedParticles.push(tagged);
      this.eventDisplay.emit('particle-tagged', tagged);
      added++;
    }

    // Uncheck all
    this.collectionItems.forEach((i) => (i.selected = false));

    if (added > 0) {
      this.setStatus(
        `Tagged ${added} as ${tagDef.symbol}. ${this.taggedParticles.length} total.`,
        'success',
      );
    } else {
      this.setStatus(
        'Could not extract momentum from selected items.',
        'warning',
      );
    }
  }

  removeTagged(index: number) {
    const removed = this.taggedParticles.splice(index, 1);
    if (removed.length > 0) {
      this.eventDisplay.emit('particle-untagged', removed[0]);
    }
  }

  clearTagged() {
    this.taggedParticles = [];
    this.statusMessage = '';
  }

  // ── Step 3: Record result ───────────────────────────────

  recordResult() {
    if (this.taggedParticles.length < 2) return;

    const result: MassResult = {
      eventType: this.liveEventType,
      mass: this.liveMass,
      particleCount: this.taggedParticles.length,
    };
    this.massResults.push(result);

    this.eventDisplay.emit('result-recorded', result);

    this.setStatus(
      `Recorded: ${result.eventType} \u2192 ${this.massGeV(result.mass)} GeV`,
      'success',
    );

    // Clear tagged for next event
    this.taggedParticles = [];
  }

  removeResult(index: number) {
    this.massResults.splice(index, 1);
  }

  clearResults() {
    this.massResults = [];
  }

  // ── Export ──────────────────────────────────────────────

  exportResults() {
    if (this.massResults.length === 0) return;

    const lines = ['type\tmass_GeV'];
    for (const r of this.massResults) {
      lines.push(`${r.eventType}\t${this.massGeV(r.mass)}`);
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Invariant_Masses.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Helpers ─────────────────────────────────────────────

  massGeV(mev: number): string {
    return (mev / 1000).toFixed(2);
  }

  ptGeV(mev: number): string {
    return (mev / 1000).toFixed(1);
  }

  /** Look up the tag definition for a tagged particle. */
  getTagDef(tagId: string): ParticleTagDef | undefined {
    return this.config.particleTags.find((t) => t.id === tagId);
  }

  private setStatus(msg: string, type: 'info' | 'success' | 'warning') {
    this.statusMessage = msg;
    this.statusType = type;
  }
}
