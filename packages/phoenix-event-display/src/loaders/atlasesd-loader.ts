import { PhoenixLoader } from './phoenix-loader';
import { openFile, settings as jsrootSettings } from 'jsroot';
import { TSelector, treeProcess } from 'jsroot/tree';
import { CoordinateHelper } from '../helpers/coordinate-helper';
import { PhoenixEventData, PhoenixEventsData } from '../lib/types/event-data';

/** Converter to run for a given aux container class family. */
type ESDConverter =
  | 'tracks'
  | 'particles'
  | 'jets'
  | 'clusters'
  | 'vertices'
  | 'met';

/** Describes one persistent xAOD auxiliary container class family. */
interface ESDAuxClassDef {
  /** Phoenix object type key, e.g. 'Tracks'. */
  phoenixType: string;
  /** Which converter to run. */
  converter: ESDConverter;
  /** Aux store members without which the collection cannot be drawn. */
  required: string[];
  /**
   * PDG code used for compound objects. Only its sign is consumed, and Phoenix
   * reads that sign as the sign of the charge — see `signedPdgId`.
   */
  pdgId?: number;
}

/**
 * ESD aux containers keyed by class family, i.e. the class name with its `_vN`
 * version suffix removed. Keying on the class rather than on the branch name is
 * what lets the loader survive a container being written with a newer aux
 * version in a future ESD production.
 */
const ESD_AUX_CLASSES: { [auxClass: string]: ESDAuxClassDef } = {
  'xAOD::TrackParticleAuxContainer': {
    phoenixType: 'Tracks',
    converter: 'tracks',
    required: ['phi', 'theta', 'qOverP'],
  },
  'xAOD::VertexAuxContainer': {
    phoenixType: 'Vertices',
    converter: 'vertices',
    required: ['x', 'y', 'z'],
  },
  'xAOD::CaloClusterAuxContainer': {
    phoenixType: 'CaloClusters',
    converter: 'clusters',
    required: ['calE', 'calEta', 'calPhi'],
  },
  'xAOD::MissingETAuxContainer': {
    phoenixType: 'MissingEnergy',
    converter: 'met',
    required: ['mpx', 'mpy'],
  },
  'xAOD::ElectronAuxContainer': {
    phoenixType: 'Electrons',
    converter: 'particles',
    required: ['pt', 'eta', 'phi'],
    pdgId: 11,
  },
  'xAOD::PhotonAuxContainer': {
    phoenixType: 'Photons',
    converter: 'particles',
    required: ['pt', 'eta', 'phi'],
  },
  'xAOD::MuonAuxContainer': {
    phoenixType: 'Muons',
    converter: 'particles',
    required: ['pt', 'eta', 'phi'],
    pdgId: 13,
  },
  'xAOD::JetAuxContainer': {
    phoenixType: 'Jets',
    converter: 'jets',
    required: ['pt', 'eta', 'phi'],
  },
  'xAOD::TauJetAuxContainer': {
    phoenixType: 'Jets',
    converter: 'jets',
    required: ['pt', 'eta', 'phi'],
  },
};

/**
 * Containers read by default. An ESD holds dozens of track, jet and cluster
 * containers; reading them all would be needlessly slow and would bury the
 * interesting ones in the collections menu, so the loader works from an
 * allow-list. Pass `containers` or `extraContainers` to change it.
 */
const DEFAULT_ESD_CONTAINERS: string[] = [
  'InDetTrackParticles',
  'GSFTrackParticles',
  'CombinedMuonTrackParticles',
  'ExtrapolatedMuonTrackParticles',
  'MuonSpectrometerTrackParticles',
  'PrimaryVertices',
  'CaloCalTopoClusters',
  'egammaClusters',
  'MET_Reference_AntiKt4EMPFlow',
  'Electrons',
  'Photons',
  'Muons',
  'AntiKt4EMPFlowJets',
  'AntiKt4EMTopoJets',
  'AntiKt4LCTopoJets',
  'AntiKt10LCTopoJets',
  'TauJets',
];

/** MET terms to prefer, most complete first. */
const DEFAULT_MET_TERMS = ['Final', 'FinalTrk', 'FinalClus'];

/**
 * Matches a static auxiliary store branch and splits it into class family and
 * container name. ESD branch names carry the persistent class, e.g.
 * `xAOD::TrackParticleAuxContainer_v5_InDetTrackParticlesAux.` →
 * ('xAOD::TrackParticleAuxContainer', 'InDetTrackParticles').
 *
 * Requiring the trailing `Aux.` excludes the per-decoration `...AuxDyn.<var>`
 * branches, and requiring the `xAOD::` prefix excludes the POOL
 * type/persistent-separated collections such as `Trk::TrackCollection_tlp7_*`,
 * which cannot be read this way.
 */
const AUX_BRANCH_RE = /^(xAOD::[A-Za-z0-9]+?)(?:_v\d+)?_([A-Za-z0-9_]+)Aux\.$/;

/** What a skip tally counts, so the summary can name the unit. */
type SkipUnit = 'object' | 'event' | 'collection';

/** A collection resolved against the branches actually present in the file. */
interface ESDResolvedCollection {
  def: ESDAuxClassDef;
  /** StoreGate container name, used as the Phoenix collection name. */
  container: string;
  /** Full ROOT branch name. */
  branchName: string;
  /** Key under which jsroot writes the streamed aux store into `tgtobj`. */
  key: string;
}

/** Options accepted by {@link ATLASESDLoader}. */
export interface ATLASESDLoaderOptions {
  /** Maximum number of events to read. Default 10. */
  maxEvents?: number;
  /** Replaces the default container allow-list entirely. */
  containers?: string[];
  /** Appended to the default container allow-list. */
  extraContainers?: string[];
  /** MET terms to prefer, most complete first. */
  metTerms?: string[];
}

/**
 * Loader for ATLAS ESD (`.pool.root`) files.
 *
 * Like {@link PHYSLITELoader} this reads the `CollectionTree` with jsroot, but
 * an ESD stores its kinematics differently. In PHYSLITE each variable is its own
 * flat branch (`AnalysisJetsAuxDyn.pt`); in an ESD they live in the *static*
 * auxiliary store, which is a single unsplit branch holding a streamed C++
 * object whose members are the aux vectors. Branch names are also prefixed with
 * the persistent class name and version, so branches are found by pattern
 * rather than by exact name.
 *
 * Two consequences worth knowing before extending this:
 *
 * - Reading an unsplit aux container materialises *all* of its members (74 for
 *   `xAOD::TrackParticleAuxContainer_v5`), not just the handful used here. That
 *   is inherent — the basket has to be streamed in full before any member is
 *   addressable — so the cost is per container, not per variable. Adding
 *   containers to the allow-list is what makes loading slow; adding fields is
 *   free.
 * - Converters copy values into fresh plain objects and never retain the
 *   streamed store, so each entry's aux objects can be collected immediately.
 *
 * Not handled: POOL type/persistent-separated collections
 * (`Trk::TrackCollection_tlp7_*`), calorimeter cells, and `ElementLink`
 * resolution — so compound objects carry no `LinkedTracks`/`LinkedClusters` and
 * Phoenix extrapolates a track from their kinematics instead, exactly as for
 * PHYSLITE.
 */
export class ATLASESDLoader extends PhoenixLoader {
  /** Maximum number of events to load from the file. */
  private maxEvents: number;
  /** Containers to read. */
  private containers: Set<string>;
  /** MET terms to prefer, most complete first. */
  private metTerms: string[];
  /**
   * Everything the loader chose not to convert, keyed by
   * `<container> — <reason>`. Reported once at the end of a load, so that a
   * collection missing from the menu always has a traceable explanation.
   */
  private skips = new Map<string, { count: number; unit: SkipUnit }>();

  /**
   * Create an ATLAS ESD loader.
   * @param options Loader options, see {@link ATLASESDLoaderOptions}.
   */
  constructor(options: ATLASESDLoaderOptions = {}) {
    super();
    this.maxEvents = options.maxEvents ?? 10;
    this.containers = new Set(
      options.containers ?? [
        ...DEFAULT_ESD_CONTAINERS,
        ...(options.extraContainers ?? []),
      ],
    );
    this.metTerms = options.metTerms ?? DEFAULT_MET_TERMS;
  }

  /**
   * Open an ATLAS ESD file and return all events as a PhoenixEventsData object
   * (keyed by event name).
   * @param fileSource File object or URL of the .root file.
   * @returns Promise resolving to the events data.
   */
  async getEventData(fileSource: File | string): Promise<PhoenixEventsData> {
    jsrootSettings.UseStamp = false;
    this.skips.clear();

    let tree: any;
    try {
      const file = await openFile(fileSource as any);
      tree = await file.readObject('CollectionTree');
    } catch (error: any) {
      throw new Error(this.describeOpenFailure(error));
    }

    if (!tree) {
      throw new Error(
        'No CollectionTree found in this ROOT file. It may not be an ATLAS ESD.',
      );
    }

    const nEntries: number = tree.fEntries ?? 0;
    const nToProcess = Math.min(nEntries, this.maxEvents);

    if (nToProcess === 0) {
      throw new Error('CollectionTree has no entries.');
    }

    const collections = this.resolveCollections(tree);

    if (collections.length === 0) {
      throw new Error(
        'No readable xAOD auxiliary containers found in CollectionTree. ' +
          'It may not be an ATLAS ESD.',
      );
    }

    const selector = new TSelector();
    for (const collection of collections) {
      selector.addBranch(collection.branchName, collection.key);
    }

    const eventInfoKey = 'esd__EventInfo';
    const eventInfoBranch = this.findBranch(tree, 'EventInfo');
    if (eventInfoBranch) {
      selector.addBranch(eventInfoBranch, eventInfoKey);
    }

    const eventsData: Record<string, PhoenixEventData> = {};
    let eventIndex = 0;

    selector.Process = () => {
      if (eventIndex >= nToProcess) {
        selector.Abort();
        return;
      }

      const tgt = selector.tgtobj;
      const eventInfo = eventInfoBranch ? tgt[eventInfoKey] : null;
      const eventNumber = Number(eventInfo?.eventNumber ?? eventIndex);
      const runNumber = Number(eventInfo?.runNumber ?? 0);

      const eventData: PhoenixEventData = {
        'event number': eventNumber,
        'run number': runNumber,
      };
      // 'lumiBlock' is one of the keys PhoenixLoader.getEventMetadata looks for.
      if (eventInfo?.lumiBlock !== undefined) {
        eventData['lumiBlock'] = Number(eventInfo.lumiBlock);
      }

      // Pre-initialise every type so Phoenix registers it from the first event,
      // even where this event happens to have nothing in it.
      for (const { def } of collections) {
        if (!eventData[def.phoenixType]) {
          eventData[def.phoenixType] = {};
        }
      }

      for (const collection of collections) {
        const objects = this.convertCollection(collection, tgt[collection.key]);
        if (objects && objects.length > 0) {
          eventData[collection.def.phoenixType][collection.container] = objects;
        } else if (objects) {
          this.noteSkip(collection.container, 'empty in this event', 'event');
        }
      }

      eventsData[`Event ${eventNumber}`] = eventData;
      eventIndex++;
    };

    await treeProcess(tree, selector, { numentries: nToProcess });

    this.reportSkips(collections.length, eventIndex);

    return eventsData;
  }

  /**
   * Record something that was not converted.
   * @param container Container it relates to.
   * @param reason Why it was skipped, phrased to complete "<container> — ...".
   * @param unit What is being counted.
   * @param count How many to add.
   */
  private noteSkip(
    container: string,
    reason: string,
    unit: SkipUnit,
    count = 1,
  ) {
    const key = `${container} — ${reason}`;
    const entry = this.skips.get(key);
    if (entry) {
      entry.count += count;
    } else {
      this.skips.set(key, { count, unit });
    }
  }

  /**
   * Print a summary of everything that was skipped, and why.
   * @param nCollections How many collections were read.
   * @param nEvents How many events were read.
   */
  private reportSkips(nCollections: number, nEvents: number) {
    const totals: { [unit: string]: number } = {};
    for (const { count, unit } of this.skips.values()) {
      totals[unit] = (totals[unit] ?? 0) + count;
    }

    const headline =
      `ATLASESDLoader: read ${nCollections} collection(s) from ${nEvents} event(s)` +
      (this.skips.size === 0
        ? ', nothing skipped'
        : '; skipped ' +
          (['object', 'collection', 'event'] as SkipUnit[])
            .filter((unit) => totals[unit])
            .map((unit) => `${totals[unit]} ${unit}(s)`)
            .join(', '));

    if (this.skips.size === 0) {
      console.info(headline);
      return;
    }

    const lines = [...this.skips.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([key, { count, unit }]) => `  ${key}: ${count} ${unit}(s)`);

    console.info([headline, ...lines].join('\n'));
  }

  /**
   * Find the collections in the allow-list that this file actually provides.
   * @param tree The CollectionTree.
   * @returns One entry per resolved collection.
   */
  private resolveCollections(tree: any): ESDResolvedCollection[] {
    const resolved: ESDResolvedCollection[] = [];
    const seen = new Set<string>();

    for (const branch of tree.fBranches.arr) {
      const match = AUX_BRANCH_RE.exec(branch.fName);
      if (!match) continue;

      const [, auxClass, container] = match;
      if (!this.containers.has(container)) continue;

      const def = ESD_AUX_CLASSES[auxClass];
      if (!def) {
        this.noteSkip(
          container,
          `unsupported aux class ${auxClass}`,
          'collection',
        );
        continue;
      }

      if (seen.has(container)) {
        this.noteSkip(container, 'duplicate branch', 'collection');
        continue;
      }
      seen.add(container);

      resolved.push({
        def,
        container,
        branchName: branch.fName,
        key: `esd__${container}`,
      });
    }

    // Anything asked for but absent is worth reporting: it is the usual reason
    // a collection a user expected is missing from the menu.
    for (const container of this.containers) {
      if (!seen.has(container)) {
        this.noteSkip(container, 'not present in this file', 'collection');
      }
    }

    return resolved;
  }

  /**
   * Find the static aux store branch for a container.
   * @param tree The CollectionTree.
   * @param container Container name, e.g. 'EventInfo'.
   * @returns The full branch name, or null if absent.
   */
  private findBranch(tree: any, container: string): string | null {
    for (const branch of tree.fBranches.arr) {
      const match = AUX_BRANCH_RE.exec(branch.fName);
      if (match && match[2] === container) {
        return branch.fName;
      }
    }
    return null;
  }

  /**
   * Convert one aux store into Phoenix objects.
   * @param collection The resolved collection.
   * @param store The streamed aux store object for this entry.
   * @returns Phoenix objects, or null if the store is unusable.
   */
  private convertCollection(
    collection: ESDResolvedCollection,
    store: any,
  ): any[] | null {
    const { def, container } = collection;

    if (!store) {
      this.noteSkip(container, 'aux store not read for this event', 'event');
      return null;
    }
    for (const name of def.required) {
      if (!this.member(store, name)) {
        this.noteSkip(container, `aux store has no '${name}'`, 'collection');
        return null;
      }
    }

    switch (def.converter) {
      case 'tracks':
        return this.convertTracks(store, container);
      case 'particles':
        return this.convertParticles(store, def.pdgId);
      case 'jets':
        return this.convertJets(store);
      case 'clusters':
        return this.convertCaloClusters(store);
      case 'vertices':
        return this.convertVertices(store);
      case 'met':
        return this.convertMET(store);
      default:
        return null;
    }
  }

  /**
   * Convert an xAOD::TrackParticleAuxContainer into Phoenix tracks.
   * @param store The aux store.
   * @param container Container name, for attributing skipped tracks.
   * @returns Phoenix track objects.
   */
  private convertTracks(store: any, container: string): any[] {
    const d0Arr = this.member(store, 'd0');
    const z0Arr = this.member(store, 'z0');
    const thetaArr = this.member(store, 'theta');
    const phiArr = this.member(store, 'phi');
    const qOverPArr = this.member(store, 'qOverP');
    const chi2Arr = this.member(store, 'chiSquared');
    const dofArr = this.member(store, 'numberDoF');

    if (!phiArr || !thetaArr || !qOverPArr) return [];

    const tracks: any[] = [];

    for (let i = 0; i < phiArr.length; i++) {
      const d0 = d0Arr ? d0Arr[i] : 0;
      const z0 = z0Arr ? z0Arr[i] : 0;
      const phi = phiArr[i];
      const theta = thetaArr[i];
      const qOverP = qOverPArr[i];

      // Skip tracks with invalid parameters to avoid NaN in Runge-Kutta.
      // The reasons are kept apart so the summary says which one bit.
      if (!qOverP || !isFinite(1.0 / qOverP)) {
        this.noteSkip(container, 'zero or non-finite qOverP', 'object');
        continue;
      }
      if (!(theta > 0 && theta < Math.PI)) {
        this.noteSkip(container, 'theta outside (0, pi)', 'object');
        continue;
      }
      if (!isFinite(d0) || !isFinite(z0) || !isFinite(phi)) {
        this.noteSkip(container, 'non-finite d0, z0 or phi', 'object');
        continue;
      }

      const p = Math.abs(1.0 / qOverP);

      const track: any = {
        dparams: [d0, z0, phi, theta, qOverP],
        phi,
        eta: CoordinateHelper.thetaToEta(theta),
        pT: p * Math.sin(theta),
        d0,
        z0,
      };

      // Field names must be 'chi2' and 'dof' to match the default Tracks cuts
      // in object-type-registry.ts, which are filtered against the fields
      // present on the first object of the collection.
      if (chi2Arr) track.chi2 = chi2Arr[i];
      if (dofArr) track.dof = dofArr[i];

      tracks.push(track);
    }

    return tracks;
  }

  /**
   * Convert an electron, photon or muon aux store into Phoenix compound objects.
   * @param store The aux store.
   * @param pdgId PDG code of the particle, if it is charged.
   * @returns Phoenix particle objects.
   */
  private convertParticles(store: any, pdgId?: number): any[] {
    const ptArr = this.member(store, 'pt');
    const etaArr = this.member(store, 'eta');
    const phiArr = this.member(store, 'phi');
    const mArr = this.member(store, 'm');
    const chargeArr = this.member(store, 'charge');

    if (!etaArr || !phiArr) return [];

    const particles: any[] = new Array(etaArr.length);

    for (let i = 0; i < etaArr.length; i++) {
      const eta = etaArr[i];
      const pt = ptArr ? ptArr[i] : 0; // MeV
      const m = mArr ? mArr[i] : 0;

      // E = sqrt((pt*cosh(eta))^2 + m^2)
      const p = pt * Math.cosh(eta);

      const particle: any = {
        eta,
        phi: phiArr[i],
        pt,
        energy: Math.sqrt(p * p + m * m),
      };

      if (chargeArr) particle.charge = chargeArr[i];
      if (pdgId !== undefined) {
        particle.pdgId = this.signedPdgId(
          pdgId,
          chargeArr ? chargeArr[i] : undefined,
        );
      }

      particles[i] = particle;
    }

    return particles;
  }

  /**
   * Convert a jet or tau aux store into Phoenix jets.
   * @param store The aux store.
   * @returns Phoenix jet objects.
   */
  private convertJets(store: any): any[] {
    const ptArr = this.member(store, 'pt');
    const etaArr = this.member(store, 'eta');
    const phiArr = this.member(store, 'phi');
    const mArr = this.member(store, 'm');

    if (!ptArr || !etaArr || !phiArr) return [];

    const jets: any[] = new Array(etaArr.length);

    for (let i = 0; i < etaArr.length; i++) {
      const eta = etaArr[i];
      const pt = ptArr[i];
      const m = mArr ? mArr[i] : 0;
      const p = pt * Math.cosh(eta);

      jets[i] = {
        eta,
        phi: phiArr[i],
        pt,
        energy: Math.sqrt(p * p + m * m),
      };
    }

    return jets;
  }

  /**
   * Convert an xAOD::CaloClusterAuxContainer into Phoenix calo clusters.
   * @param store The aux store.
   * @returns Phoenix cluster objects.
   */
  private convertCaloClusters(store: any): any[] {
    const eArr = this.member(store, 'calE');
    const etaArr = this.member(store, 'calEta');
    const phiArr = this.member(store, 'calPhi');
    const timeArr = this.member(store, 'time');

    if (!eArr || !etaArr || !phiArr) return [];

    const clusters: any[] = new Array(etaArr.length);

    for (let i = 0; i < etaArr.length; i++) {
      const cluster: any = {
        energy: eArr[i],
        eta: etaArr[i],
        phi: phiArr[i],
      };
      if (timeArr) cluster.time = timeArr[i];
      clusters[i] = cluster;
    }

    return clusters;
  }

  /**
   * Convert an xAOD::VertexAuxContainer into Phoenix vertices.
   * @param store The aux store.
   * @returns Phoenix vertex objects.
   */
  private convertVertices(store: any): any[] {
    const xArr = this.member(store, 'x');
    const yArr = this.member(store, 'y');
    const zArr = this.member(store, 'z');
    const typeArr = this.member(store, 'vertexType');
    const chi2Arr = this.member(store, 'chiSquared');
    const dofArr = this.member(store, 'numberDoF');

    if (!xArr || !yArr || !zArr) return [];

    const vertices: any[] = new Array(xArr.length);

    for (let i = 0; i < xArr.length; i++) {
      const vertex: any = { x: xArr[i], y: yArr[i], z: zArr[i] };
      // vertexType is the only default cut for the Vertices type.
      if (typeArr) vertex.vertexType = typeArr[i];
      if (chi2Arr) vertex.chi2 = chi2Arr[i];
      if (dofArr) vertex.dof = dofArr[i];
      vertices[i] = vertex;
    }

    return vertices;
  }

  /**
   * Convert an xAOD::MissingETAuxContainer into a single Phoenix MET object.
   *
   * Unlike PHYSLITE's single MET value, an ESD MET container holds one entry
   * per term (RefEle, RefGamma, RefJet, ... FinalTrk, FinalClus), so the total
   * has to be picked out by name rather than by index.
   * @param store The aux store.
   * @returns A one-element array holding the MET object.
   */
  private convertMET(store: any): any[] {
    const mpxArr = this.member(store, 'mpx');
    const mpyArr = this.member(store, 'mpy');
    const sumetArr = this.member(store, 'sumet');
    const names: string[] | null = Array.isArray(store.name)
      ? store.name
      : null;

    if (!mpxArr || !mpyArr || mpxArr.length === 0) return [];

    let index = -1;
    if (names) {
      for (const term of this.metTerms) {
        index = names.indexOf(term);
        if (index >= 0) break;
      }
      if (index < 0) {
        console.warn(
          `ATLASESDLoader: no MET term of ${this.metTerms.join('/')} found, ` +
            `using the first of ${names.join(', ')}`,
        );
      }
    }
    if (index < 0) index = 0;

    const met: any = { etx: mpxArr[index], ety: mpyArr[index] };
    if (names) met.name = names[index];
    if (sumetArr) met.sumet = sumetArr[index];

    return [met];
  }

  /**
   * Give a PDG code the sign Phoenix expects.
   *
   * `PhoenixLoader.getCompound` derives the track charge as
   * `pdgId > 0 ? 1 : -1`, i.e. it reads the *sign of pdgId as the sign of the
   * charge*. That is the opposite of the PDG convention for leptons (a mu- is
   * +13), so the sign is flipped here to make extrapolated tracks bend the
   * right way. Where the ESD gives no charge, fall back to the negative
   * particle, matching the PHYSLITE loader.
   * @param pdgId PDG code of the particle.
   * @param charge Charge from the aux store, if available.
   * @returns The PDG code with the sign of the charge.
   */
  private signedPdgId(pdgId: number, charge?: number): number {
    const magnitude = Math.abs(pdgId);
    return charge !== undefined && charge > 0 ? magnitude : -magnitude;
  }

  /**
   * Read one aux store member as an indexable numeric sequence.
   * @param store The aux store.
   * @param name Member name.
   * @returns The member, or null if absent or not indexable.
   */
  private member(store: any, name: string): ArrayLike<number> | null {
    const value = store?.[name];
    if (value == null) return null;
    if (Array.isArray(value)) return value;
    if (ArrayBuffer.isView(value)) return value as unknown as ArrayLike<number>;
    if (typeof value === 'number') return [value];
    return null;
  }

  /**
   * Turn a jsroot failure into something a user can act on.
   * @param error The error thrown by jsroot.
   * @returns The message to report.
   */
  private describeOpenFailure(error: any): string {
    const message = error?.message ?? String(error);

    if (/LZMA|corrupted input|unpacked buffer size/i.test(message)) {
      return (
        'Failed to decompress this ROOT file. ATLAS ESDs are LZMA compressed, ' +
        'and jsroot cannot decode multi-chunk LZMA2 blocks without the patch ' +
        'Phoenix applies on install (scripts/patch-jsroot.js). If you are ' +
        `using phoenix-event-display from npm, this fix may not be in your ` +
        `jsroot version yet. Original error: ${message}`
      );
    }

    return `Failed to open ROOT file: ${message}`;
  }
}
