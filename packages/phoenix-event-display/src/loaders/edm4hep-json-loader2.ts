import { PhoenixLoader } from './phoenix-loader';
import { edmPhoenix } from 'src/lib/types/edmPhoenix';
import { edm4hep } from 'src/lib/types/edm4hep';
import { ObjectID } from 'src/lib/types/edm4hep-schemas/utils';

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
          Jets: {},
          CaloClusters: {},
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
                this.getTracks(rawEvent, item.collection as edm4hep.TrackCollection)
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
                newEvent.Hits[collName] = this.getHits(item.collection);
                break;
              case 'edm4hep::CalorimeterHitCollection':
              case 'edm4hep::SimCalorimeterHitCollection':
                newEvent.Jets[collName] = this.getCaloCells(item.collection);
                break;
              case 'edm4hep::ClusterCollection':
                newEvent.CaloClusters[collName] = this.getCaloClusters(
                  item.collection,
                );
                break;
              case 'edm4hep::ReconstructedParticleCollection':
                newEvent.Jets[collName] = this.getJets(item.collection);
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
  ): [string, edmPhoenix.Track[]][] {
    const electrons: any[] = [];
    const photons: any[] = [];
    const pions: any[] = [];
    const protons: any[] = [];
    const kaons: any[] = [];
    const other: any[] = [];

    trackCollection.forEach((track: edm4hep.Track) => {
      let newTrack: edmPhoenix.Track = null;

      if ('trackerHits' in track) {
        track.trackerHits.forEach((trackerHitRef: ObjectID) => {
          const trackerHits: edm4hep.HitCollection = this.getCollByID(
            rawEvent,
            trackerHitRef.collectionID,
          );

          newTrack.pos.x = trackerHits[trackerHitRef.index].position.x * 0.1;
          newTrack.pos.y = trackerHits[trackerHitRef.index].position.y * 0.1;
          newTrack.pos.z = trackerHits[trackerHitRef.index].position.z * 0.1;
        });
      }

      if (newTrack === null && 'trackStates' in track) {
        track.trackStates.forEach((trackState: any) => {
          if ('referencePoint' in trackState) {
            newTrack.pos.x = trackState.referencePoint.x * 0.1;
            newTrack.pos.y = trackState.referencePoint.y * 0.1;
            newTrack.pos.z = trackState.referencePoint.z * 0.1;
          }
        });
      }

      // @todo if none of those two properties exist definition will be invalid

      newTrack.color = track.color ?? '0000cd';

      if ('pid' in track) {
        if (track.pid == 'electron') {
          electrons.push(track);
        } else if (track.pid == 'photon') {
          photons.push(track);
        } else if (track.pid == 'pion') {
          pions.push(track);
        } else if (track.pid == 'proton') {
          protons.push(track);
        } else if (track.pid == 'kaon') {
          kaons.push(track);
        } else {
          other.push(track);
        }
      } else {
        other.push(track);
      }
    });

    return [
      ['Electrons', electrons],
      ['Photons', photons],
      ['Pions', pions],
      ['Protons', protons],
      ['Kaons', kaons],
      ['Other', other],
    ];
  }

  private getHits(
    hitCollection:
      | edm4hep.TrackerHitCollection
      | edm4hep.TrackerHit3DCollection
      | edm4hep.TrackerHitPlaneCollection
      | edm4hep.SenseWireHitCollection
      | edm4hep.SimTrackerHitCollection,
  ): edmPhoenix.Hit[] {}

  private getCaloCells(
    caloCellCollection:
      | edm4hep.CalorimeterHitCollection
      | edm4hep.SimCalorimeterHitCollection,
  ): edmPhoenix.CaloCell[] {}

  private getCaloClusters(
    caloClusterCollection: edm4hep.ClusterCollection,
  ): edmPhoenix.CaloCluster[] {}

  private getJets(
    jetCollection: edm4hep.ReconstructedParticleCollection,
  ): edmPhoenix.Jet[] {}

  private getMissingEnergy(
    missingEnergyCollection: edm4hep.ReconstructedParticleCollection,
  ): edmPhoenix.MissingEnergy[] {}
}
