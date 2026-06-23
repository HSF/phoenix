import { PhoenixLoader } from './phoenix-loader';
import { openFile, settings as jsrootSettings } from 'jsroot';
import { TSelector, treeProcess } from 'jsroot/tree';
import { CoordinateHelper } from '../helpers/coordinate-helper';

/**
 * Interface representing a particle in Phoenix with basic kinematic properties.
 */
export interface PhoenixParticle {
  pt: number;
  eta: number;
  phi: number;
  energy: number;
  pdgId?: number;
}
/**
 * Interface representing a track in Phoenix with its physical parameters.
 */
export interface PhoenixTrack {
  dparams: [number, number, number, number, number];
  phi: number;
  eta: number;
  pT: number;
  d0: number;
  z0: number;
}

interface PHYSLITECollectionDef {
  /** Branch prefix in the ROOT file (e.g. 'AnalysisElectronsAuxDyn'). */
  prefix: string;
  /** Branch suffixes to read (e.g. ['pt', 'eta', 'phi', 'm']). */
  fields: string[];
  /** Phoenix object type this maps to. */
  phoenixType: string;
  /** Name for the Phoenix collection. */
  collectionName: string;
  /** Parser function to extract and format the data */
  parser: (
    keys: Record<string, string>,
    tgt: any,
    loader: PHYSLITELoader,
  ) => any[];
}

// --- CONFIGURATION MAPPING
const DEFAULT_COLLECTIONS: PHYSLITECollectionDef[] = [
  {
    prefix: 'AnalysisElectronsAuxDyn',
    fields: ['pt', 'eta', 'phi', 'm'],
    phoenixType: 'Electrons',
    collectionName: 'AnalysisElectrons',
    parser: (keys, tgt, loader) =>
      loader.convertCompoundObjects(keys, tgt, true),
  },
  {
    prefix: 'AnalysisMuonsAuxDyn',
    fields: ['pt', 'eta', 'phi'],
    phoenixType: 'Muons',
    collectionName: 'AnalysisMuons',
    parser: (keys, tgt, loader) =>
      loader.convertCompoundObjects(keys, tgt, true),
  },
  {
    prefix: 'AnalysisPhotonsAuxDyn',
    fields: ['pt', 'eta', 'phi', 'm'],
    phoenixType: 'Photons',
    collectionName: 'AnalysisPhotons',
    parser: (keys, tgt, loader) =>
      loader.convertCompoundObjects(keys, tgt, false),
  },
  {
    prefix: 'AnalysisJetsAuxDyn',
    fields: ['pt', 'eta', 'phi', 'm'],
    phoenixType: 'Jets',
    collectionName: 'AnalysisJets',
    parser: (keys, tgt, loader) => loader.convertJets(keys, tgt),
  },
  {
    prefix: 'AnalysisLargeRJetsAuxDyn',
    fields: ['pt', 'eta', 'phi', 'm'],
    phoenixType: 'Jets',
    collectionName: 'AnalysisLargeRJets',
    parser: (keys, tgt, loader) => loader.convertJets(keys, tgt),
  },
  {
    prefix: 'InDetTrackParticlesAuxDyn',
    fields: ['d0', 'z0', 'theta', 'phi', 'qOverP'],
    phoenixType: 'Tracks',
    collectionName: 'InDetTrackParticles',
    parser: (keys, tgt, loader) => loader.convertTracks(keys, tgt),
  },
  {
    prefix: 'MuonSpectrometerTrackParticlesAuxDyn',
    fields: ['d0', 'z0', 'theta', 'phi', 'qOverP'],
    phoenixType: 'Tracks',
    collectionName: 'MuonSpectrometerTrackParticles',
    parser: (keys, tgt, loader) => loader.convertTracks(keys, tgt),
  },
  {
    prefix: 'CombinedMuonTrackParticlesAuxDyn',
    fields: ['d0', 'z0', 'theta', 'phi', 'qOverP'],
    phoenixType: 'Tracks',
    collectionName: 'CombinedMuonTrackParticles',
    parser: (keys, tgt, loader) => loader.convertTracks(keys, tgt),
  },
  {
    prefix: 'ExtrapolatedMuonTrackParticlesAuxDyn',
    fields: ['d0', 'z0', 'theta', 'phi', 'qOverP'],
    phoenixType: 'Tracks',
    collectionName: 'ExtrapolatedMuonTrackParticles',
    parser: (keys, tgt, loader) => loader.convertTracks(keys, tgt),
  },
  {
    prefix: 'GSFTrackParticlesAuxDyn',
    fields: ['d0', 'z0', 'theta', 'phi', 'qOverP'],
    phoenixType: 'Tracks',
    collectionName: 'GSFTrackParticles',
    parser: (keys, tgt, loader) => loader.convertTracks(keys, tgt),
  },
  {
    prefix: 'MET_Core_AnalysisMETAuxDyn',
    fields: ['mpx', 'mpy'],
    phoenixType: 'MissingEnergy',
    collectionName: 'MET',
    parser: (keys, tgt, loader) => loader.convertMET(keys, tgt),
  },
  {
    prefix: 'PrimaryVerticesAuxDyn',
    fields: ['x', 'y', 'z'],
    phoenixType: 'Vertices',
    collectionName: 'PrimaryVertices',
    parser: (keys, tgt, loader) => loader.convertVertices(keys, tgt),
  },
  {
    prefix: 'egammaClustersAuxDyn',
    fields: ['calE', 'calEta', 'calPhi'],
    phoenixType: 'CaloClusters',
    collectionName: 'egammaClusters',
    parser: (keys, tgt, loader) => loader.convertCaloClusters(keys, tgt),
  },
];

/**
 * Loader for ATLAS PHYSLITE (DAOD_PHYSLITE) ROOT files.
 */
export class PHYSLITELoader extends PhoenixLoader {
  private maxEvents: number;
  private collectionDefs: PHYSLITECollectionDef[];

  constructor(maxEvents: number = 100) {
    super();
    this.maxEvents = maxEvents;
    this.collectionDefs = DEFAULT_COLLECTIONS;
  }

  /**
   * Calculates the total energy of a particle based on its kinematics.
   * @param pt Transverse momentum
   * @param eta Pseudorapidity
   * @param m Mass
   * @returns Calculated energy
   */
  public calculateEnergy(pt: number, eta: number, m: number = 0): number {
    const p = pt * Math.cosh(eta);
    return Math.sqrt(p * p + m * m);
  }

  async getEventData(fileSource: File | string): Promise<any> {
    jsrootSettings.UseStamp = false;

    const file = await openFile(fileSource as any);
    const tree: any = await file.readObject('CollectionTree');

    if (!tree)
      throw new Error(
        'No CollectionTree found. It may not be a PHYSLITE file.',
      );

    const nEntries: number = tree.fEntries ?? 0;
    const nToProcess = Math.min(nEntries, this.maxEvents);

    if (nToProcess === 0) throw new Error('CollectionTree has no entries.');

    const topLevelNames = new Set<string>(
      tree.fBranches.arr.map((b: any) => b.fName as string),
    );
    const activeDefs: {
      def: PHYSLITECollectionDef;
      selectorKeys: Record<string, string>;
    }[] = [];
    const selector = new TSelector();

    for (const def of this.collectionDefs) {
      const firstBranch = `${def.prefix}.${def.fields[0]}`;
      if (!topLevelNames.has(firstBranch)) continue;

      const keys: Record<string, string> = {};
      let allFound = true;

      for (const field of def.fields) {
        const branchName = `${def.prefix}.${field}`;
        if (!topLevelNames.has(branchName)) {
          allFound = false;
          break;
        }
        keys[field] = `${def.prefix}__${field}`;
      }

      if (!allFound) continue;

      for (const field of def.fields) {
        selector.addBranch(`${def.prefix}.${field}`, keys[field]);
      }
      activeDefs.push({ def, selectorKeys: keys });
    }

    const eventNumberKey = 'evtinfo_eventNumber';
    const runNumberKey = 'evtinfo_runNumber';
    selector.addBranch('EventInfoAuxDyn.eventNumber', eventNumberKey);
    selector.addBranch('EventInfoAuxDyn.runNumber', runNumberKey);

    const eventsData: any = {};
    let eventIndex = 0;

    selector.Process = (entry: number) => {
      if (eventIndex >= nToProcess) {
        selector.Abort();
        return;
      }

      const tgt = selector.tgtobj;
      const eventNumber = eventNumberKey ? tgt[eventNumberKey] : eventIndex;
      const runNumber = runNumberKey ? tgt[runNumberKey] : 0;

      const eventData: any = {
        'event number': eventNumber,
        'run number': runNumber,
      };

      for (const { def } of activeDefs) {
        if (!eventData[def.phoenixType]) eventData[def.phoenixType] = {};
      }

      for (const { def, selectorKeys } of activeDefs) {
        const collection = def.parser(selectorKeys, tgt, this);
        if (collection && collection.length > 0) {
          eventData[def.phoenixType][def.collectionName] = collection;
        }
      }

      eventsData[`Event ${eventNumber}`] = eventData;
      eventIndex++;
    };

    await treeProcess(tree, selector, { numentries: nToProcess });
    return eventsData;
  }

  // ---  OPTIMIZED PARSERS (Memory Pre-allocation) ---
  public convertCompoundObjects(
    keys: Record<string, string>,
    tgt: any,
    isCharged: boolean,
  ): PhoenixParticle[] {
    const ptArr = keys['pt'] ? this.toArray(tgt[keys['pt']]) : null;
    const etaArr = keys['eta'] ? this.toArray(tgt[keys['eta']]) : null;
    const phiArr = keys['phi'] ? this.toArray(tgt[keys['phi']]) : null;
    const mArr = keys['m'] ? this.toArray(tgt[keys['m']]) : null;

    if (!etaArr || !phiArr) return [];

    const n = etaArr.length;
    const objects: PhoenixParticle[] = new Array(n);

    for (let i = 0; i < n; i++) {
      const pt = ptArr ? ptArr[i] : 0;
      const m = mArr ? mArr[i] : 0;

      const obj: PhoenixParticle = {
        eta: etaArr[i],
        phi: phiArr[i],
        pt: pt,
        energy: this.calculateEnergy(pt, etaArr[i], m),
      };

      if (isCharged) obj.pdgId = -1;
      objects[i] = obj;
    }
    return objects;
  }
  /** Converts jet objects to Phoenix particles. */
  public convertJets(
    keys: Record<string, string>,
    tgt: any,
  ): PhoenixParticle[] {
    const ptArr = keys['pt'] ? this.toArray(tgt[keys['pt']]) : null;
    const etaArr = keys['eta'] ? this.toArray(tgt[keys['eta']]) : null;
    const phiArr = keys['phi'] ? this.toArray(tgt[keys['phi']]) : null;
    const mArr = keys['m'] ? this.toArray(tgt[keys['m']]) : null;

    if (!etaArr || !phiArr) return [];

    const n = etaArr.length;
    const jets: PhoenixParticle[] = new Array(n);

    for (let i = 0; i < n; i++) {
      const pt = ptArr ? ptArr[i] : 0;
      const m = mArr ? mArr[i] : 0;

      jets[i] = {
        eta: etaArr[i],
        phi: phiArr[i],
        pt: pt,
        energy: this.calculateEnergy(pt, etaArr[i], m),
      };
    }
    return jets;
  }
  /** Converts track objects to Phoenix tracks. */
  public convertTracks(keys: Record<string, string>, tgt: any): PhoenixTrack[] {
    const d0Arr = keys['d0'] ? this.toArray(tgt[keys['d0']]) : null;
    const z0Arr = keys['z0'] ? this.toArray(tgt[keys['z0']]) : null;
    const thetaArr = keys['theta'] ? this.toArray(tgt[keys['theta']]) : null;
    const phiArr = keys['phi'] ? this.toArray(tgt[keys['phi']]) : null;
    const qOverPArr = keys['qOverP'] ? this.toArray(tgt[keys['qOverP']]) : null;

    if (!phiArr || !thetaArr || !qOverPArr) return [];

    const n = phiArr.length;
    const tracks: PhoenixTrack[] = [];

    for (let i = 0; i < n; i++) {
      const d0 = d0Arr ? d0Arr[i] : 0;
      const z0 = z0Arr ? z0Arr[i] : 0;
      const phi = phiArr[i];
      const theta = thetaArr[i];
      const qOverP = qOverPArr[i];

      if (!qOverP || !isFinite(1.0 / qOverP) || theta <= 0 || theta >= Math.PI)
        continue;

      const p = Math.abs(1.0 / qOverP);

      tracks.push({
        dparams: [d0, z0, phi, theta, qOverP],
        phi,
        eta: CoordinateHelper.thetaToEta(theta),
        pT: p * Math.sin(theta),
        d0,
        z0,
      });
    }
    return tracks;
  }
  /** Converts Missing Energy (MET) objects. */
  public convertMET(keys: Record<string, string>, tgt: any): any[] {
    const mpx = keys['mpx'] ? tgt[keys['mpx']] : null;
    const mpy = keys['mpy'] ? tgt[keys['mpy']] : null;
    if (mpx == null || mpy == null) return [];
    return [
      {
        etx: typeof mpx === 'number' ? mpx : (mpx[0] ?? 0),
        ety: typeof mpy === 'number' ? mpy : (mpy[0] ?? 0),
      },
    ];
  }
  /** Converts primary vertices. */
  public convertVertices(keys: Record<string, string>, tgt: any): any[] {
    const xArr = keys['x'] ? this.toArray(tgt[keys['x']]) : null;
    const yArr = keys['y'] ? this.toArray(tgt[keys['y']]) : null;
    const zArr = keys['z'] ? this.toArray(tgt[keys['z']]) : null;
    if (!xArr || !yArr || !zArr) return [];

    const n = xArr.length;
    const vertices: any[] = new Array(n);
    for (let i = 0; i < n; i++) {
      vertices[i] = { x: xArr[i], y: yArr[i], z: zArr[i] };
    }
    return vertices;
  }
  /** Converts calorimeter clusters. */
  public convertCaloClusters(keys: Record<string, string>, tgt: any): any[] {
    const eArr = keys['calE'] ? this.toArray(tgt[keys['calE']]) : null;
    const etaArr = keys['calEta'] ? this.toArray(tgt[keys['calEta']]) : null;
    const phiArr = keys['calPhi'] ? this.toArray(tgt[keys['calPhi']]) : null;
    if (!eArr || !etaArr || !phiArr) return [];

    const n = eArr.length;
    const clusters: any[] = new Array(n);
    for (let i = 0; i < n; i++) {
      clusters[i] = { energy: eArr[i], eta: etaArr[i], phi: phiArr[i] };
    }
    return clusters;
  }

  private toArray(val: any): number[] | null {
    if (val == null) return null;
    if (Array.isArray(val)) return val;
    if (ArrayBuffer.isView(val)) return Array.from(val as any);
    if (typeof val === 'number') return [val];
    return null;
  }
}
