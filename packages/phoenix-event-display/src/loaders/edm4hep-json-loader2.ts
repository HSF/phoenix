import { PhoenixLoader } from './phoenix-loader';
import { edmPhoenix } from 'src/lib/types/edmPhoenix';
import { edm4hep } from 'src/lib/types/edm4hep';
import { ObjectID, Vector3d } from 'src/lib/types/edm4hep-schemas/utils';

export class Edm4hepJsonLoader extends PhoenixLoader {
  private rawEventData: any;

  constructor() {
    super();
    this.eventData = {};
  }

  setRawEventData(rawEventData: any) {
    this.rawEventData = rawEventData;
  }

  processEventData(): void {
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
        };

        this.assignPID(rawEvent);

        // Iterate over event items
        Object.entries(rawEvent).forEach(
          ([collName, item]: [string, edm4hep.Item]) => {
            switch (item.collType) {
              case 'edm4hep::EventHeaderCollection':
                newEvent['event number'] = Number(
                  item.collection[0].eventNumber ?? 0,
                );
                newEvent['run number'] = Number(
                  item.collection[0].runNumber ?? 0,
                );
                break;
              case 'edm4hep::VertexCollection':
                newEvent.Vertices[collName] = this.getVertices(item.collection);
                break;
              case 'edm4hep::TrackCollection':
                this.getTracks(
                  rawEvent,
                  item.collection as edm4hep.TrackCollection,
                )
                  .filter(([, arr]) => arr.length > 0)
                  .forEach(([label, arr]) => {
                    newEvent.Tracks[`${collName} | ${label}`] = arr;
                  });
                break;
              case 'edm4hep::TrackerHitCollection':
              case 'edm4hep::TrackerHit3DCollection':
              case 'edm4hep::TrackerHitPlaneCollection':
              case 'edm4hep::SenseWireHitCollection':
              case 'edm4hep::SimTrackerHitCollection':
                this.getHits(rawEvent, item.collection)
                  .filter(([, arr]) => arr.length > 0)
                  .forEach(([label, arr]) => {
                    newEvent.Hits[`${collName} | ${label}`] = arr;
                  });
                break;
              case 'edm4hep::CalorimeterHitCollection':
              case 'edm4hep::SimCalorimeterHitCollection':
                newEvent.CaloCells[collName] = this.getCaloCells(
                  item.collection,
                );
                break;
              case 'edm4hep::ClusterCollection':
                // @todo highlight optional members in edm4hep
                newEvent.CaloClusters[collName] = this.getCaloClusters(
                  item.collection,
                );
                break;
              case 'edm4hep::ReconstructedParticleCollection':
                if (collName === 'Jet')
                  newEvent.Jets[collName] = this.getJets(item.collection);
                // @todo 'missing' is never present
                else if (collName.toLowerCase().includes('missing'))
                  newEvent.MissingEnergy[collName] = this.getMissingEnergy(
                    item.collection,
                  );
                break;
            }
          },
        );
      },
    );
  }

  /* Define particle PID based on link */
  private assignPID(rawEvent: any) {
    // Link collection name and type vary by schema:
    // - Schema 1: MCRecoAssociations
    // - Schema 2: MCRecoAssociations or RecoMCLink
    // - Schema 3: RecoMCLink
    let linkCollection = (rawEvent.MCRecoAssociations ?? rawEvent.RecoMCLink)
      ?.collection as
      | edm4hep.AssociationCollection // Schema 1
      | edm4hep.LinkCollection; // From Schema 2 Onwards

    if (!linkCollection) return;

    let reconstructedParticleCollection = rawEvent.ReconstructedParticles
      ?.collection as edm4hep.ReconstructedParticleCollection;

    if (!reconstructedParticleCollection) return;

    let mcParticleCollection = rawEvent.Particle
      ?.collection as edm4hep.MCParticleCollection;

    if (!mcParticleCollection) return;

    let trackCollection = rawEvent.EFlowTrack
      ?.collection as edm4hep.TrackCollection;

    if (!trackCollection) return;

    linkCollection.forEach((link: edm4hep.Association | edm4hep.Link) => {
      const recIndex = 'rec' in link ? link.rec.index : link.from.index;
      const simIndex = 'sim' in link ? link.sim.index : link.to.index;
      const pdgid = mcParticleCollection[simIndex].PDG;
      const trackRefs = reconstructedParticleCollection[recIndex].tracks;

      let color: string, pid: string;

      switch (Math.abs(pdgid)) {
        case 11:
          color = '00ff00';
          pid = 'electron';
          break;
        case 22:
          color = 'ff0000';
          pid = 'photon';
          break;
        case 111:
        case 211:
          color = 'a52a2a';
          pid = 'pion';
          break;
        case 2212:
          color = '778899';
          pid = 'proton';
          break;
        case 321:
          color = '5f9ea0';
          pid = 'kaon';
          break;
        default:
          color = '0000cd';
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

  /** Return a random colour */
  private randomColor() {
    return Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase();
  }

  /** Return vertices */
  private getVertices(
    vertexCollection: edm4hep.VertexCollection,
  ): edmPhoenix.Vertex[] {
    return vertexCollection.map((vertex: edm4hep.Vertex) => ({
      pos: {
        x: vertex.position.x * 0.1,
        y: vertex.position.y * 0.1,
        z: vertex.position.z * 0.1,
      },
      color: `#${this.randomColor()}`,
    }));
  }

  /** Get the required collection */
  private getCollByID(event: any, id: number) {
    const coll = Object.values(event).find((c: any) => c?.collID === id) as any;
    return coll?.collection;
  }

  private getTracks(
    rawEvent: any,
    trackCollection: edm4hep.TrackCollection,
  ): { [name: string]: edmPhoenix.Hit[] } {
    const categories: { [name: string]: edmPhoenix.Hit[] } = {
      other: [],
      electron: [],
      photon: [],
      pion: [],
      proton: [],
      kaon: [],
    };

    trackCollection.forEach((track: edm4hep.Track) => {
      let newTrack: edmPhoenix.Track[] = [];

      if ('trackerHits' in track) {
        track.trackerHits.forEach((trackerHitRef: ObjectID) => {
          // @todo always assumes getCollById will return a collection
          const trackerHits: edm4hep.HitCollection = this.getCollByID(
            rawEvent,
            trackerHitRef.collectionID,
          );

          // @todo change the structure

          newTrack.pos.x = trackerHits[trackerHitRef.index].position.x * 0.1;
          newTrack.pos.y = trackerHits[trackerHitRef.index].position.y * 0.1;
          newTrack.pos.z = trackerHits[trackerHitRef.index].position.z * 0.1;
          newTrack.color = track.color ?? '0000cd';
        });
      }

      if (newTrack === null && 'trackStates' in track) {
        track.trackStates.forEach((trackState: edm4hep.TrackState) => {
          // @todo 'trackState' might always be present
          newTrack.pos.x = trackState.referencePoint.x * 0.1;
          newTrack.pos.y = trackState.referencePoint.y * 0.1;
          newTrack.pos.z = trackState.referencePoint.z * 0.1;
          newTrack.color = track.color ?? '0000cd';
        });
      }

      // @todo if none of those two properties exist definition will be invalid

      const category = track.pid ?? 'other';

      categories[category].push(newTrack);
    });

    return categories;
  }

  /** Find PDG of the particle associated with the hit */
  private getHits(
    rawEvent: any,
    hitCollection: edm4hep.Hit[],
  ): { [name: string]: edmPhoenix.Hit[] } {
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
      // @todo 'position' might always be present
      const pos: Vector3d = {
        x: rawHit.position.x * 0.1,
        y: rawHit.position.y * 0.1,
        z: rawHit.position.z * 0.1,
      };

      if ((rawHit.quality & (1 << 31)) !== 0) {
        /* BITOverlay = 31
         * https://github.com/key4hep/EDM4hep/blob/fe5a54046a91a7e648d0b588960db7841aebc670/edm4hep.yaml#L349
         */
        categories.overlay.push({
          type: 'Point',
          pos,
          color: `#${colorOverlay}`,
        });
      } else if ((rawHit.quality & (1 << 30)) !== 0) {
        /* BITProducedBySecondary = 30
         * https://github.com/key4hep/EDM4hep/blob/fe5a54046a91a7e648d0b588960db7841aebc670/edm4hep.yaml#L350
         */
        categories.secondary.push({
          type: 'Point',
          pos,
          color: `#${colorSecondary}`,
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
                color: `#${colorElectron}`,
              });
              break;
            case 13:
              categories.muon.push({
                type: 'Point',
                pos,
                color: `#${colorMuon}`,
              });
              break;
            case 211:
              categories.pion.push({
                type: 'Point',
                pos,
                color: `#${colorPion}`,
              });
              break;
            case 321:
              categories.kaon.push({
                type: 'Point',
                pos,
                color: `#${colorKaon}`,
              });
              break;
            case 2212:
              categories.proton.push({
                type: 'Point',
                pos,
                color: `#${colorProton}`,
              });
              break;
            default:
              categories.other.push({
                type: 'Point',
                pos,
                color: `#${colorOther}`,
              });
              break;
          }
        } else {
          categories.other.push({
            type: 'Point',
            pos,
            color: `#${colorOther}`,
          });
        }
      }
    });

    return categories;
  }

  /** Returns the cells */
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
        eta: Math.asinh(z / rho),
        phi: Math.acos(x / rho) * Math.sign(y),
        energy: rawCell.energy,
      });
    });

    return cells;
  }

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
        eta: Math.asinh(z / rho),
        phi: Math.acos(x / rho) * Math.sign(y),
        energy: rawCluster.energy * 100, // @todo no apparent reason to multiply by 10
      });
    });

    return clusters;
  }

  private getJets(
    jetCollection: edm4hep.ReconstructedParticle[],
  ): edmPhoenix.Jet[] {
    const jets: edmPhoenix.Jet[] = [];

    jetCollection.forEach((rawJet) => {
      const px = rawJet.momentum.x;
      const py = rawJet.momentum.y;
      const pz = rawJet.momentum.z;
      const pt = Math.sqrt(Math.pow(px, 2) + Math.pow(py, 2));

      jets.push({
        eta: Math.asinh(pz / pt),
        phi: Math.acos(px / pt) * Math.sign(py),
        energy: rawJet.energy * 1000, // @todo this currently converts GeV -> MeV
      });
    });

    return jets;
  }

  private getMissingEnergy(
    missingEnergyCollection: edm4hep.ReconstructedParticle[],
  ): edmPhoenix.MissingEnergy[] {
    const missingEnergies: edmPhoenix.MissingEnergy[] = [];

    missingEnergyCollection.forEach((rawMissingEnergy: any) => {
      const px = rawMissingEnergy.momentum.x;
      const py = rawMissingEnergy.momentum.y;
      const pz = rawMissingEnergy.momentum.z;
      const p = Math.sqrt(Math.pow(px, 2) + Math.pow(py, 2) + Math.pow(pz, 2));

      missingEnergies.push({
        etx: ((rawMissingEnergy.energy * px) / p) * 10, // @todo no apparent reason to multiply by 10
        ety: ((rawMissingEnergy.energy * py) / p) * 10,
        color: '#ff69b4',
      });
    });

    return missingEnergies;
  }
}
