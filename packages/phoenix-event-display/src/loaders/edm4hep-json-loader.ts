import { PhoenixLoader } from './phoenix-loader';
import { edmPhoenix } from 'src/lib/types/edmPhoenix';
import { edm4hep } from 'src/lib/types/edm4hep';
import { ObjectID, Vector3d } from 'src/lib/types/edm4hep-schemas/utils';

/**
 * Edm4hepJsonLoader for loading EDM4hep json dumps
 */
export class Edm4hepJsonLoader extends PhoenixLoader {
  /**  Event data loaded from EDM4hep JSON file */
  private rawEventData: any;

  /** Create Edm4hepJsonLoader */
  constructor() {
    super();
    this.eventData = {};
  }

  /** Put raw EDM4hep JSON event data into the loader */
  setRawEventData(rawEventData: any) {
    this.rawEventData = rawEventData;
  }

  /** Process raw EDM4hep JSON event data into the Phoenix format */
  processEventData(): boolean {
    console.log('This is a test');
    // Iterate over events
    Object.entries(this.rawEventData).forEach(
      ([eventName, rawEvent]: [string, edm4hep.Event]) => {
        const newEvent: edmPhoenix.Event = {
          'event number': 0,
          'run number': 0,
          Vertices: {},
          Tracks: {},
          Hits: {},
          CaloClusters: {},
          CaloCells: {},
          Jets: {},
          MissingEnergy: {},
        };

        this.assignPID(rawEvent);

        // Iterate over event collections
        Object.entries(rawEvent).forEach(
          ([collName, { collType, collection }]: [string, edm4hep.Item]) => {
            switch (collType) {
              case 'edm4hep::EventHeaderCollection':
                newEvent['event number'] = Number(
                  collection[0].eventNumber ?? 0,
                );
                newEvent['run number'] = Number(collection[0].runNumber ?? 0);
                break;
              case 'edm4hep::VertexCollection':
                newEvent.Vertices[collName] = this.getVertices(collection);
                break;
              case 'edm4hep::TrackCollection':
                this.getTracks(rawEvent, collection as edm4hep.Track[]).forEach(
                  ([label, arr]) => {
                    newEvent.Tracks[`${collName} | ${label}`] = arr;
                  },
                );
                break;
              case 'edm4hep::TrackerHitCollection':
              case 'edm4hep::TrackerHit3DCollection':
              case 'edm4hep::SimTrackerHitCollection':
                // case 'edm4hep::TrackerHitPlaneCollection':
                // case 'edm4hep::SenseWireHitCollection':

                this.getHits(rawEvent, collection).forEach(([label, arr]) => {
                  newEvent.Hits[`${collName} | ${label}`] = arr;
                });
                break;
              case 'edm4hep::CalorimeterHitCollection':
              case 'edm4hep::SimCalorimeterHitCollection':
                newEvent.CaloCells[collName] = this.getCaloCells(collection);
                break;
              case 'edm4hep::ClusterCollection':
                newEvent.CaloClusters[collName] =
                  this.getCaloClusters(collection);
                break;
              case 'edm4hep::ReconstructedParticleCollection':
                if (collName === 'Jet')
                  newEvent.Jets[collName] = this.getJets(collection);
                else if (collName.toLowerCase().includes('missing'))
                  newEvent.MissingEnergy[collName] =
                    this.getMissingEnergy(collection);
                break;
            }
          },
        );

        this.eventData[eventName] = newEvent;

        console.log(eventName, newEvent);
      },
    );
    return true;
  }

  /** Output event data in Phoenix compatible format */
  getEventData(): any {
    return this.eventData;
  }

  /** Return number of events */
  private getNumEvents(): number {
    return Object.keys(this.rawEventData).length;
  }

  /* Define particle PID based on link */
  private assignPID(rawEvent: any) {
    // Link collection name and type vary by schema:
    // - Schema 1: MCRecoAssociations
    // - Schema 2: MCRecoAssociations or RecoMCLink
    // - Schema 3: RecoMCLink
    const linkCollection = (rawEvent.MCRecoAssociations ?? rawEvent.RecoMCLink)
      ?.collection as
      | edm4hep.Association[] // Schema 1
      | edm4hep.Link[]; // From Schema 2 Onwards

    if (!linkCollection) return;

    const reconstructedParticleCollection = rawEvent.ReconstructedParticles
      ?.collection as edm4hep.ReconstructedParticle[];

    if (!reconstructedParticleCollection) return;

    const mcParticleCollection = rawEvent.Particle
      ?.collection as edm4hep.MCParticle[];

    if (!mcParticleCollection) return;

    const trackCollection = rawEvent.EFlowTrack?.collection as edm4hep.Track[];

    if (!trackCollection) return;

    linkCollection.forEach((link: edm4hep.Association | edm4hep.Link) => {
      const recIndex = 'rec' in link ? link.rec.index : link.from.index;
      const simIndex = 'sim' in link ? link.sim.index : link.to.index;
      const pdgid = mcParticleCollection[simIndex].PDG;
      const trackRefs = reconstructedParticleCollection[recIndex].tracks;

      let color: string, pid: string;

      switch (Math.abs(pdgid)) {
        case 11:
          color = '#00ff00';
          pid = 'electron';
          break;
        case 22:
          color = '#ff0000';
          pid = 'photon';
          break;
        case 111:
        case 211:
          color = '#a52a2a';
          pid = 'pion';
          break;
        case 2212:
          color = '#778899';
          pid = 'proton';
          break;
        case 321:
          color = '#5f9ea0';
          pid = 'kaon';
          break;
        default:
          color = '#0000cd';
          pid = 'other';
      }

      trackRefs.forEach(({ index }) => {
        const track = trackCollection[index];

        track.color = color;
        track.pid = pid;
        track.pdgid = pdgid;
      });
    });
  }

  /** Return vertices */
  private getVertices(vertexCollection: edm4hep.Vertex[]): edmPhoenix.Vertex[] {
    return vertexCollection.map((vertex: edm4hep.Vertex) => ({
      pos: [
        vertex.position.x * 0.1,
        vertex.position.y * 0.1,
        vertex.position.z * 0.1,
      ],
      color: this.randomColor(),
    }));
  }

  /** Return tracks */
  private getTracks(
    rawEvent: any,
    trackCollection: edm4hep.Track[],
  ): [string, edmPhoenix.Track[]][] {
    const categories: { [name: string]: edmPhoenix.Track[][] } = {
      other: [],
      electron: [],
      photon: [],
      pion: [],
      proton: [],
      kaon: [],
    };

    trackCollection.forEach((rawTrack: edm4hep.Track) => {
      const parsedHits: edmPhoenix.Track[] = [];

      if ('trackerHits' in rawTrack && rawTrack.trackerHits.length > 0) {
        rawTrack.trackerHits.forEach((trackerHitRef: ObjectID) => {
          // @todo always assumes getCollById will return a collection
          const trackerHits: edm4hep.Hit[] = this.getCollByID(
            rawEvent,
            trackerHitRef.collectionID,
          );

          parsedHits.push({
            pos: [
              trackerHits[trackerHitRef.index].position.x * 0.1,
              trackerHits[trackerHitRef.index].position.y * 0.1,
              trackerHits[trackerHitRef.index].position.z * 0.1,
            ],
            color: rawTrack.color ?? '#0000cd',
          });
        });
      }

      if (
        parsedHits.length === 0 &&
        'trackStates' in rawTrack &&
        rawTrack.trackStates.length > 0
      ) {
        rawTrack.trackStates.forEach((trackState: edm4hep.TrackState) => {
          // @todo 'trackState' might always be present
          parsedHits.push({
            pos: [
              trackState.referencePoint.x * 0.1,
              trackState.referencePoint.y * 0.1,
              trackState.referencePoint.z * 0.1,
            ],
            color: rawTrack.color ?? '#0000cd',
          });
        });
      }

      // @todo if none of those two properties exist definition will be invalid

      const category = rawTrack.pid ?? 'other';

      categories[category].push(parsedHits);
    });

    return Object.entries(categories)
      .map(([label, category]): [string, edmPhoenix.Track[]] => [
        label,
        category.flat(),
      ])
      .filter(([, arr]) => arr.length !== 0);
  }

  /** Return tracker hits */
  private getHits(
    rawEvent: any,
    hitCollection: edm4hep.Hit[],
  ): [string, edmPhoenix.Hit[]][] {
    const categories: { [name: string]: edmPhoenix.Hit[] } = {
      other: [],
      overlay: [],
      secondary: [],
      electron: [],
      muon: [],
      pion: [],
      kaon: [],
      proton: [],
    };

    const colorOther = this.randomColor();
    const colorOverlay = this.randomColor();
    const colorSecondary = this.randomColor();
    const colorElectron = this.randomColor();
    const colorMuon = this.randomColor();
    const colorPion = this.randomColor();
    const colorKaon = this.randomColor();
    const colorProton = this.randomColor();

    hitCollection.forEach((rawHit) => {
      const pos: edmPhoenix.Position = [
        rawHit.position.x * 0.1,
        rawHit.position.y * 0.1,
        rawHit.position.z * 0.1,
      ];

      if ((rawHit.quality & (1 << 31)) !== 0) {
        /* BITOverlay = 31
         * https://github.com/key4hep/EDM4hep/blob/fe5a54046a91a7e648d0b588960db7841aebc670/edm4hep.yaml#L349
         */
        categories.overlay.push({
          type: 'Point',
          pos,
          color: colorOverlay,
        });
      } else if ((rawHit.quality & (1 << 30)) !== 0) {
        /* BITProducedBySecondary = 30
         * https://github.com/key4hep/EDM4hep/blob/fe5a54046a91a7e648d0b588960db7841aebc670/edm4hep.yaml#L350
         */
        categories.secondary.push({
          type: 'Point',
          pos,
          color: colorSecondary,
        });
      } else {
        let ref: ObjectID | null = null;

        if ('particle' in rawHit && rawHit.particle.length > 0) {
          // 'particle' exists in type SimTrackerHit from Schema2 onwards
          ref = rawHit.particle[0];
        } else if ('MCParticle' in rawHit) {
          // 'MCParticle' only exists in type SimTrackerHit within Schema1
          ref = rawHit.MCParticle;
        }

        if (ref !== null) {
          const collection = this.getCollByID(rawEvent, ref.collectionID);
          const pdg = Math.abs(collection?.[ref.index]?.PDG ?? 0);

          switch (pdg) {
            case 11:
              categories.electron.push({
                type: 'Point',
                pos,
                color: colorElectron,
              });
              break;
            case 13:
              categories.muon.push({
                type: 'Point',
                pos,
                color: colorMuon,
              });
              break;
            case 211:
              categories.pion.push({
                type: 'Point',
                pos,
                color: colorPion,
              });
              break;
            case 321:
              categories.kaon.push({
                type: 'Point',
                pos,
                color: colorKaon,
              });
              break;
            case 2212:
              categories.proton.push({
                type: 'Point',
                pos,
                color: colorProton,
              });
              break;
            default:
              categories.other.push({
                type: 'Point',
                pos,
                color: colorOther,
              });
              break;
          }
        } else {
          categories.other.push({
            type: 'Point',
            pos,
            color: colorOther,
          });
        }
      }
    });

    return Object.entries(categories).filter(([, arr]) => arr.length !== 0);
  }

  /** Returns Calo cells */
  private getCaloCells(
    caloCellCollection: edm4hep.CaloCell[],
  ): edmPhoenix.CaloCell[] {
    const cells: edmPhoenix.CaloCell[] = [];

    caloCellCollection.forEach((rawCell) => {
      const x = rawCell.position.x * 0.1;
      const y = rawCell.position.y * 0.1;
      const z = rawCell.position.z * 0.1;
      const rho = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

      cells.push({
        eta: rho === 0 ? 0 : Math.asinh(z / rho), // Check because '0 / 0 = NaN'
        phi: Math.atan2(y, x), // Safer equivalent to 'Math.acos(x / rho) * Math.sign(y)'
        energy: rawCell.energy,
      });
    });

    return cells;
  }

  /** Return Calo clusters */
  private getCaloClusters(
    caloClusterCollection: edm4hep.CaloCluster[],
  ): edmPhoenix.CaloCluster[] {
    const clusters: edmPhoenix.CaloCluster[] = [];

    caloClusterCollection.forEach((rawCluster) => {
      const x = rawCluster.position.x * 0.1;
      const y = rawCluster.position.y * 0.1;
      const z = rawCluster.position.z * 0.1;
      const rho = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

      clusters.push({
        eta: rho === 0 ? 0 : Math.asinh(z / rho), // Check because '0 / 0 = NaN'
        phi: Math.atan2(y, x), // Safer equivalent to 'Math.acos(x / rho) * Math.sign(y)'
        energy: rawCluster.energy,
      });
    });

    return clusters;
  }

  /** Return jets */
  private getJets(
    jetCollection: edm4hep.ReconstructedParticle[],
  ): edmPhoenix.Jet[] {
    const jets: edmPhoenix.Jet[] = [];

    jetCollection.forEach((rawJet) => {
      const px: number = rawJet.momentum.x;
      const py: number = rawJet.momentum.y;
      const pz: number = rawJet.momentum.z;
      const pt = Math.sqrt(Math.pow(px, 2) + Math.pow(py, 2));

      jets.push({
        eta: pt === 0 ? 0 : Math.asinh(pz / pt), // Check because '0 / 0 = NaN'
        phi: Math.atan2(py, px), // Safer equivalent to 'Math.acos(px / pt) * Math.sign(py)'
        energy: rawJet.energy,
      });
    });

    return jets;
  }

  /** Return missing energy */
  private getMissingEnergy(
    missingEnergyCollection: edm4hep.ReconstructedParticle[],
  ): edmPhoenix.MissingEnergy[] {
    const missingEnergies: edmPhoenix.MissingEnergy[] = [];

    missingEnergyCollection.forEach((rawMissingEnergy: any) => {
      const px: number = rawMissingEnergy.momentum.x;
      const py: number = rawMissingEnergy.momentum.y;
      const pz: number = rawMissingEnergy.momentum.z;
      const p = Math.sqrt(Math.pow(px, 2) + Math.pow(py, 2) + Math.pow(pz, 2));

      missingEnergies.push({
        etx: ((rawMissingEnergy.energy * px) / p) * 10, // @todo no apparent reason to multiply by 10
        ety: ((rawMissingEnergy.energy * py) / p) * 10,
        color: '#ff69b4',
      });
    });

    return missingEnergies;
  }

  /** Return a random colour */
  private randomColor() {
    return `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase()}`;
  }

  /** Get the required collection */
  private getCollByID(event: any, id: number) {
    const coll = Object.values(event).find((c: any) => c?.collID === id) as any;
    return coll?.collection;
  }
}
