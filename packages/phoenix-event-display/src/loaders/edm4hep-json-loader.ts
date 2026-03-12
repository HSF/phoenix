import { PhoenixLoader } from './phoenix-loader';
import {
  PhoenixEventData,
  VertexParams,
  TrackParams,
  HitParams,
  CaloCellParams,
  CaloClusterParams,
  JetParams,
  MissingEnergyParams,
} from 'src/lib/types/event-data';
import { edm4hep } from 'src/lib/types/edm4hep';
import { ObjectID, Vector3d } from 'src/lib/types/edm4hep-schemas/utils';

/**
 * Edm4hepJsonLoader for loading EDM4hep json dumps
 */
export class Edm4hepJsonLoader extends PhoenixLoader {
  /** PDG ID to particle type name */
  private static readonly pidNames: Record<number, edm4hep.ParticleType> = {
    11: edm4hep.ParticleType.Electron,
    13: edm4hep.ParticleType.Muon,
    22: edm4hep.ParticleType.Photon,
    111: edm4hep.ParticleType.Pion,
    211: edm4hep.ParticleType.Pion,
    2212: edm4hep.ParticleType.Proton,
    321: edm4hep.ParticleType.Kaon,
  };

  /** Colors per particle type, shared between tracks and hits */
  private static readonly pidColors: Record<edm4hep.ParticleType, string> = {
    [edm4hep.ParticleType.Electron]: '#00ff00',
    [edm4hep.ParticleType.Muon]: '#ff00ff',
    [edm4hep.ParticleType.Photon]: '#ff0000',
    [edm4hep.ParticleType.Pion]: '#a52a2a',
    [edm4hep.ParticleType.Proton]: '#778899',
    [edm4hep.ParticleType.Kaon]: '#5f9ea0',
    [edm4hep.ParticleType.Other]: '#0000cd',
  };

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
    // Iterate over events
    Object.entries(this.rawEventData).forEach(
      ([eventName, rawEvent]: [string, edm4hep.Event]) => {
        const newEvent: PhoenixEventData = {
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

    const reconstructedParticleCollection = rawEvent.ReconstructedParticles
      ?.collection as edm4hep.ReconstructedParticle[];

    const mcParticleCollection = rawEvent.Particle
      ?.collection as edm4hep.MCParticle[];

    const eFlowTrackCollection = rawEvent.EFlowTrack
      ?.collection as edm4hep.Track[];

    if (
      linkCollection &&
      reconstructedParticleCollection &&
      mcParticleCollection &&
      eFlowTrackCollection
    )
      return;

    linkCollection.forEach((link: edm4hep.Association | edm4hep.Link) => {
      const recIndex = 'rec' in link ? link.rec.index : link.from.index;
      const simIndex = 'sim' in link ? link.sim.index : link.to.index;
      const pdgid = mcParticleCollection[simIndex].PDG;

      reconstructedParticleCollection[recIndex].tracks.forEach(({ index }) => {
        eFlowTrackCollection[index].pid =
          Edm4hepJsonLoader.pidNames[pdgid] ?? edm4hep.ParticleType.Other;
      });
    });
  }

  /** Return vertices */
  private getVertices(vertexCollection: edm4hep.Vertex[]): VertexParams[] {
    const color = this.randomColor();

    return vertexCollection.map((rawVertex: edm4hep.Vertex) => ({
      pos: [
        rawVertex.position.x * 0.1,
        rawVertex.position.y * 0.1,
        rawVertex.position.z * 0.1,
      ],
      size: 1,
      vertexType: 'type' in rawVertex ? rawVertex.type : null,
      color,
    }));
  }

  /** Return tracks */
  private getTracks(
    rawEvent: any,
    trackCollection: edm4hep.Track[],
  ): [string, TrackParams[]][] {
    const categories = Object.fromEntries(
      Object.keys(Edm4hepJsonLoader.pidColors).map((type) => [
        type,
        [] as TrackParams[],
      ]),
    ) as Record<string, TrackParams[]>;

    trackCollection.forEach((rawTrack: edm4hep.Track) => {
      const pos: number[][] = []; // An array of positions is needed to render the tracks as bars

      if ('trackerHits' in rawTrack && rawTrack.trackerHits.length > 0) {
        rawTrack.trackerHits.forEach((trackerHitRef: ObjectID) => {
          const trackerHits: edm4hep.Hit[] = this.getCollByID(
            rawEvent,
            trackerHitRef.collectionID,
          );

          pos.push([
            trackerHits[trackerHitRef.index].position.x * 0.1,
            trackerHits[trackerHitRef.index].position.y * 0.1,
            trackerHits[trackerHitRef.index].position.z * 0.1,
          ]);
        });
      } else {
        rawTrack.trackStates.forEach((trackState: edm4hep.TrackState) => {
          pos.push([
            trackState.referencePoint.x * 0.1,
            trackState.referencePoint.y * 0.1,
            trackState.referencePoint.z * 0.1,
          ]);
        });
      }

      const category = rawTrack.pid ?? 'other';

      categories[category].push({
        pos,
        // @todo dparams (helix parameters for Runge-Kutta extrapolation: qOverP requires the magnetic field)
        // @todo phi (aimuthal angle)
        // @todo eta (peudorapidity)
        // @todo d0 (tansverse impact parameter)
        // @todo z0 (lngitudinal impact parameter)
        // @todo pt (transverse momentum requires the magnetic field)
        chi2: rawTrack.chi2, // no use by phoenix-object.ts
        dof: rawTrack.ndf, // no use by phoenix-object.ts
        color: Edm4hepJsonLoader.pidColors[rawTrack.pid ?? 'other'],
        linewidth: 2,
      });
    });

    return Object.entries(categories).filter(([, arr]) => arr.length !== 0) as [
      string,
      TrackParams[],
    ][];
  }

  /** Return tracker hits */
  private getHits(
    rawEvent: any,
    hitCollection: edm4hep.Hit[],
  ): [string, HitParams[]][] {
    const categories = Object.fromEntries([
      ...Object.keys(Edm4hepJsonLoader.pidColors).map((type) => [
        type,
        [] as HitParams[],
      ]),
      ['overlay', [] as HitParams[]],
      ['secondary', [] as HitParams[]],
    ]) as Record<string, HitParams[]>;

    const colorOverlay = this.randomColor();
    const colorSecondary = this.randomColor();

    hitCollection.forEach((rawHit) => {
      const pos: [number, number, number] = [
        rawHit.position.x * 0.1,
        rawHit.position.y * 0.1,
        rawHit.position.z * 0.1,
      ];

      if ((rawHit.quality & (1 << 31)) !== 0) {
        /* BITOverlay = 31
         * https://github.com/key4hep/EDM4hep/blob/fe5a54046a91a7e648d0b588960db7841aebc670/edm4hep.yaml#L349
         */
        categories.overlay.push({
          type: 'CircularPoint',
          pos,
          color: colorOverlay,
        });
      } else if ((rawHit.quality & (1 << 30)) !== 0) {
        /* BITProducedBySecondary = 30
         * https://github.com/key4hep/EDM4hep/blob/fe5a54046a91a7e648d0b588960db7841aebc670/edm4hep.yaml#L350
         */
        categories.secondary.push({
          type: 'CircularPoint',
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

        const pdg =
          ref !== null
            ? (this.getCollByID(rawEvent, ref.collectionID)?.[ref.index]?.PDG ??
              null)
            : null;

        const particleType =
          Edm4hepJsonLoader.pidNames[pdg] ?? edm4hep.ParticleType.Other;

        categories[particleType].push({
          type: 'CircularPoint',
          pos,
          color: Edm4hepJsonLoader.pidColors[particleType],
        });
      }
    });

    return Object.entries(categories).filter(([, arr]) => arr.length !== 0);
  }

  /** Returns Calo cells */
  private getCaloCells(
    caloCellCollection: edm4hep.CaloCell[],
  ): CaloCellParams[] {
    const cells: Omit<CaloCellParams, 'uuid'>[] = [];
    const hue = Math.floor(Math.random() * 358);

    // Find smallest distance between cell centers and use it as cell size
    let drmin = 1e9;
    for (let i = 0; i < 1e4; ++i) {
      const j = Math.floor(Math.random() * caloCellCollection.length);
      const k = Math.floor(Math.random() * caloCellCollection.length);
      if (j === k) {
        continue;
      }

      const dx2 = Math.pow(
        caloCellCollection[j].position.x - caloCellCollection[k].position.x,
        2,
      );
      const dy2 = Math.pow(
        caloCellCollection[j].position.y - caloCellCollection[k].position.y,
        2,
      );
      const dz2 = Math.pow(
        caloCellCollection[j].position.z - caloCellCollection[k].position.z,
        2,
      );
      const dr = Math.sqrt(dx2 + dy2 + dz2);

      if (dr < drmin) {
        drmin = dr;
      }
    }

    const side = Math.floor(drmin) * 0.1 > 1 ? Math.floor(drmin) * 0.1 : 1;

    caloCellCollection.forEach((rawCell) => {
      const x = rawCell.position.x * 0.1;
      const y = rawCell.position.y * 0.1;
      const z = rawCell.position.z * 0.1;
      const rho = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

      cells.push({
        eta: rho === 0 ? 0 : Math.asinh(z / rho), // Check because '0 / 0 = NaN'
        phi: Math.atan2(y, x), // Safer equivalent to 'Math.acos(x / rho) * Math.sign(y)'
        energy: rawCell.energy,
        radius: Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2)),
        z,
        color: this.convHSLtoHEX(hue, rawCell.energy),
        opacity: this.valToOpacity(rawCell.energy, 1e-3, 1),
        side: side,
        length: side, // expecting cells in multiple layers
      });
    });

    return cells as CaloCellParams[];
  }

  /** Return Calo clusters */
  private getCaloClusters(
    caloClusterCollection: edm4hep.CaloCluster[],
  ): CaloClusterParams[] {
    const clusters: CaloClusterParams[] = [];
    const hue = Math.floor(Math.random() * 361);

    caloClusterCollection.forEach((rawCluster) => {
      const x = rawCluster.position.x * 0.1;
      const y = rawCluster.position.y * 0.1;
      const z = rawCluster.position.z * 0.1;
      const rho = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

      clusters.push({
        eta: rho === 0 ? 0 : Math.asinh(z / rho), // Check because '0 / 0 = NaN'
        phi: Math.atan2(y, x), // Safer equivalent to 'Math.acos(x / rho) * Math.sign(y)'
        energy: rawCluster.energy,
        radius: Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2)),
        z,
        color: this.convHSLtoHEX(hue, rawCluster.energy),
        theta: rawCluster.iTheta,
        opacity: this.valToOpacity(rawCluster.energy, 1e-3, 1),
        // side (overrides side width of the cluster box)
        // length (overrides length (depth) of the cluster box)
      });
    });

    return clusters;
  }

  /** Return jets */
  private getJets(jetCollection: edm4hep.ReconstructedParticle[]): JetParams[] {
    const jets: JetParams[] = [];
    const hue = Math.floor(Math.random() * 358);

    jetCollection.forEach((rawJet) => {
      const px: number = rawJet.momentum.x;
      const py: number = rawJet.momentum.y;
      const pz: number = rawJet.momentum.z;
      const p = Math.sqrt(px * px + py * py + pz * pz);
      const pt = Math.sqrt(Math.pow(px, 2) + Math.pow(py, 2));
      const eta = pt === 0 ? 0 : Math.asinh(pz / pt);

      jets.push({
        eta,
        phi: Math.atan2(py, px), // Safer equivalent to 'Math.acos(px / pt) * Math.sign(py)'
        theta: 2 * Math.atan(Math.exp(-eta)),
        energy: rawJet.energy,
        et: p === 0 ? 0 : (rawJet.energy * pt) / p,
        // coneR (overrides the cone radius for visualization width)
        origin_X: rawJet.referencePoint.x,
        origin_Y: rawJet.referencePoint.y,
        origin_Z: rawJet.referencePoint.z,
        color: this.convHSLtoHEX(hue, rawJet.energy),
      });
    });

    return jets;
  }

  /** Return missing energy */
  private getMissingEnergy(
    missingEnergyCollection: edm4hep.ReconstructedParticle[],
  ): MissingEnergyParams[] {
    const missingEnergies: MissingEnergyParams[] = [];

    missingEnergyCollection.forEach((rawMissingEnergy: any) => {
      const px: number = rawMissingEnergy.momentum.x;
      const py: number = rawMissingEnergy.momentum.y;
      const pz: number = rawMissingEnergy.momentum.z;
      const p = Math.sqrt(Math.pow(px, 2) + Math.pow(py, 2) + Math.pow(pz, 2));

      missingEnergies.push({
        etx: ((rawMissingEnergy.energy * px) / p) * 10,
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

  /** Return a lightness value from the passed number and range */
  private valToLightness(v: number, min: number, max: number): number {
    let lightness = 80 - ((v - min) * 65) / (max - min);
    if (lightness < 20) {
      lightness = 20;
    }
    if (lightness > 85) {
      lightness = 85;
    }

    return lightness;
  }

  /** Return a opacity value from the passed number and range */
  private valToOpacity(v: number, min: number, max: number): number {
    let opacity = 0.2 + ((v - min) * 0.65) / (max - min);
    if (opacity < 0.2) {
      opacity = 0.2;
    }
    if (opacity > 0.8) {
      opacity = 0.8;
    }

    return opacity;
  }

  /** Helper conversion of HSL to hexadecimal */
  private convHSLtoHEX(h: number, energy: number): string {
    const s = Math.floor(Math.random() * 101);
    const l = this.valToLightness(energy, 1e-3, 1) / 100;

    const a = (s * Math.min(l, 1 - l)) / 100;

    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };

    return `#${f(0)}${f(8)}${f(4)}`;
  }
}
