import { PhoenixLoader } from './phoenix-loader';

/*
 * Edm4hepJsonLoader for loading EDM4hep json dumps
 */
export class Edm4hepJsonLoader extends PhoenixLoader {
  /* Event data loaded from EDM4hep JSON file */
  private rawEventData: any;

  constructor() {
    super();
    this.eventData = {};
  }

  /* Put raw EDM4hep JSON event data into the loader */
  setRawEventData(rawEventData: any) {
    this.rawEventData = rawEventData;
  }

  /* Process raw EDM4hep JSON event data into the Phoenix format */
  processEventData(): boolean {
    Object.entries(this.rawEventData).forEach(([eventName, event]) => {
      const oneEventData = {
        Vertices: {},
        Tracks: {},
        Hits: {},
        CaloCells: {},
        CaloClusters: {},
        Jets: {},
        MissingEnergy: {},
        'event number': this.getEventNumber(event),
        'run number': this.getRunNumber(event),
      };

      this.colorTracks(event);

      oneEventData.Vertices = this.getVertices(event);
      oneEventData.Tracks = this.getTracks(event);
      oneEventData.Hits = this.getHits(event);
      oneEventData.CaloCells = this.getCells(event);
      oneEventData.CaloClusters = this.getCaloClusters(event);
      oneEventData.Jets = this.getJets(event);
      oneEventData.MissingEnergy = this.getMissingEnergy(event);

      this.eventData[eventName] = oneEventData;
    });

    return true;
  }

  /* Output event data in Phoenix compatible format */
  getEventData(): any {
    return this.eventData;
  }

  private getNumEvents(): number {
    return Object.keys(this.rawEventData).length;
  }

  private getRunNumber(event: any): number {
    if (!('EventHeader' in event)) {
      return 0;
    }

    const eventHeader = event['EventHeader']['collection'];

    if (!('runNumber' in eventHeader)) {
      return eventHeader[0]['runNumber'];
    }

    return 0;
  }

  private getEventNumber(event: any): number {
    if (!('EventHeader' in event)) {
      return 0;
    }

    const eventHeader = event['EventHeader']['collection'];

    if (!('eventNumber' in eventHeader)) {
      return eventHeader[0]['eventNumber'];
    }

    return 0;
  }

  private colorTracks(event: any) {
    let recoParticles: any[];
    if ('ReconstructedParticles' in event) {
      recoParticles = event['ReconstructedParticles']['collection'];
    } else {
      return;
    }

    let mcParticles: any[];
    if ('Particle' in event) {
      mcParticles = event['Particle']['collection'];
    } else {
      return;
    }

    let mcRecoAssocs: any[];
    if ('MCRecoAssociations' in event) {
      mcRecoAssocs = event['MCRecoAssociations']['collection'];
    } else {
      return;
    }

    let tracks: any[];
    if ('EFlowTrack' in event) {
      tracks = event['EFlowTrack']['collection'];
    } else {
      return;
    }

    mcRecoAssocs.forEach((mcRecoAssoc: any) => {
      const recoIndex = mcRecoAssoc['rec']['index'];
      const mcIndex = mcRecoAssoc['sim']['index'];

      const pdgid = mcParticles[mcIndex]['PDG'];
      const trackRefs = recoParticles[recoIndex]['tracks'];

      trackRefs.forEach((trackRef: any) => {
        const track = tracks[trackRef['index']];
        if (Math.abs(pdgid) === 11) {
          track['color'] = '00ff00';
          track['pid'] = 'electron';
        } else if (Math.abs(pdgid) === 22) {
          track['color'] = 'ff0000';
          track['pid'] = 'photon';
        } else if (Math.abs(pdgid) === 211 || Math.abs(pdgid) === 111) {
          track['color'] = 'a52a2a';
          track['pid'] = 'pion';
        } else if (Math.abs(pdgid) === 2212) {
          track['color'] = '778899';
          track['pid'] = 'proton';
        } else if (Math.abs(pdgid) === 321) {
          track['color'] = '5f9ea0';
          track['pid'] = 'kaon';
        } else {
          track['color'] = '0000cd';
          track['pid'] = 'other';
        }
        track['pdgid'] = pdgid;
      });
    });
  }

  private getVertices(event: any) {
    const allVertices: any[] = [];

    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collType' in collDict)) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      if (!(collDict['collType'] === 'edm4hep::VertexCollection')) {
        continue;
      }

      if (
        !(
          collName.includes('Vertices') ||
          collName.includes('vertices') ||
          collName.includes('Vertex') ||
          collName.includes('vertex')
        )
      ) {
        continue;
      }

      const vertices: any[] = [];
      const rawVertices = collDict['collection'];
      const vertexColor = this.randomColor();

      rawVertices.forEach((rawVertex: any) => {
        const position: any[] = [];
        if ('position' in rawVertex) {
          position.push(rawVertex['position']['x'] * 0.1);
          position.push(rawVertex['position']['y'] * 0.1);
          position.push(rawVertex['position']['z'] * 0.1);
        }

        const vertex = {
          pos: position,
          color: '#' + vertexColor,
        };
        vertices.push(vertex);
      });

      allVertices[collName] = vertices;
    }

    return allVertices;
  }

  private getTracks(event: any) {
    const allTracks: any[] = [];

    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collType' in collDict)) {
        continue;
      }

      if (!(collDict['collType'] === 'edm4hep::TrackCollection')) {
        continue;
      }

      if (!(collName.includes('Track') || collName.includes('track'))) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      const rawTracks = collDict['collection'];
      const electrons: any[] = [];
      const photons: any[] = [];
      const pions: any[] = [];
      const protons: any[] = [];
      const kaons: any[] = [];
      const other: any[] = [];

      rawTracks.forEach((rawTrack: any) => {
        const positions: any[] = [];
        if ('trackerHits' in rawTrack) {
          const trackerHitRefs = rawTrack['trackerHits'];
          trackerHitRefs.forEach((trackerHitRef: any) => {
            const trackerHits = this.getCollByID(
              event,
              trackerHitRef['collectionID']
            );
            const trackerHit = trackerHits[trackerHitRef['index']];
            positions.push([
              trackerHit['position']['x'] * 0.1,
              trackerHit['position']['y'] * 0.1,
              trackerHit['position']['z'] * 0.1,
            ]);
          });
        }
        if ('trackStates' in rawTrack && positions.length === 0) {
          const trackStates = rawTrack['trackStates'];
          trackStates.forEach((trackState: any) => {
            if ('referencePoint' in trackState) {
              positions.push([
                trackState['referencePoint']['x'] * 0.1,
                trackState['referencePoint']['y'] * 0.1,
                trackState['referencePoint']['z'] * 0.1,
              ]);
            }
          });
        }

        let trackColor = '0000cd';
        if ('color' in rawTrack) {
          trackColor = rawTrack['color'];
        }

        const track = {
          pos: positions,
          color: trackColor,
        };

        if ('pid' in rawTrack) {
          if (rawTrack['pid'] == 'electron') {
            electrons.push(track);
          } else if (rawTrack['pid'] == 'photon') {
            photons.push(track);
          } else if (rawTrack['pid'] == 'pion') {
            pions.push(track);
          } else if (rawTrack['pid'] == 'proton') {
            protons.push(track);
          } else if (rawTrack['pid'] == 'kaon') {
            kaons.push(track);
          } else {
            other.push(track);
          }
        } else {
          other.push(track);
        }
      });

      allTracks[collName + ' | Electrons'] = electrons;
      allTracks[collName + ' | Photons'] = photons;
      allTracks[collName + ' | Pions'] = pions;
      allTracks[collName + ' | Protons'] = protons;
      allTracks[collName + ' | Kaons'] = kaons;
      allTracks[collName + ' | Other'] = other;
    }

    return allTracks;
  }

  private getHits(event: any) {
    return {};
  }

  private getCells(event: any) {
    const allCells: any[] = [];

    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collType' in collDict)) {
        continue;
      }

      if (!(collDict['collType'] === 'edm4hep::CalorimeterHitCollection')) {
        continue;
      }

      if (!(collName.includes('Cell') || collName.includes('cell'))) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      const rawCells = collDict['collection'];
      const cells: any[] = [];

      // Find smallest distance between cell centers and use it as cell size
      let drmin = 1e9;
      for (let i = 0; i < rawCells.length; ++i) {
        for (let j = 0; j < rawCells.length; ++j) {
          if (i === j) {
            continue;
          }

          const dx2 = Math.pow(
            rawCells[i].position.x - rawCells[j].position.x,
            2
          );
          const dy2 = Math.pow(
            rawCells[i].position.y - rawCells[j].position.y,
            2
          );
          const dz2 = Math.pow(
            rawCells[i].position.z - rawCells[j].position.z,
            2
          );
          const dr = Math.sqrt(dx2 + dy2 + dz2);

          if (dr < drmin) {
            drmin = dr;
          }
        }
      }
      const cellSide = Math.floor(drmin) * 0.1;
      const cellsHue = Math.floor(Math.random() * 358);

      rawCells.forEach((rawCell: any) => {
        const x = rawCell.position.x * 0.1;
        const y = rawCell.position.y * 0.1;
        const z = rawCell.position.z * 0.1;

        const r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
        const rho = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        const eta = Math.asinh(z / rho);
        const phi = Math.acos(x / rho) * Math.sign(y);
        const cellLightness = this.valToLightness(rawCell.energy, 1e-3, 1);

        const cell = {
          eta: eta,
          phi: phi,
          energy: rawCell.energy,
          radius: r,
          side: cellSide,
          length: cellSide, // expecting cells in multiple layers
          color: '#' + this.convHSLtoHEX(cellsHue, 90, cellLightness),
        };
        cells.push(cell);
      });

      allCells[collName] = cells;
    }

    return allCells;
  }

  private getCaloClusters(event: any) {
    const allClusters: any[] = [];

    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collType' in collDict)) {
        continue;
      }

      if (!(collDict['collType'] === 'edm4hep::ClusterCollection')) {
        continue;
      }

      if (!(collName.includes('Cluster') || collName.includes('cluster'))) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      const rawClusters = collDict['collection'];
      const clusters: any[] = [];

      rawClusters.forEach((rawCluster: any) => {
        const x = rawCluster.position.x * 0.1;
        const y = rawCluster.position.y * 0.1;
        const z = rawCluster.position.z * 0.1;

        const r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
        const rho = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        const eta = Math.asinh(z / rho);
        const phi = Math.acos(x / rho) * Math.sign(y);

        const cluster = {
          eta: eta,
          phi: phi,
          energy: rawCluster.energy * 100,
          radius: r,
        };
        clusters.push(cluster);
      });

      allClusters[collName] = clusters;
    }

    return allClusters;
  }

  private getJets(event: any) {
    const allJets: any[] = [];

    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collType' in collDict)) {
        continue;
      }

      if (
        !(collDict['collType'] === 'edm4hep::ReconstructedParticleCollection')
      ) {
        continue;
      }

      if (!(collName.includes('Jet') || collName.includes('jet'))) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      const jets: any[] = [];
      const rawJets = collDict['collection'];

      rawJets.forEach((rawJet: any) => {
        if (!('momentum' in rawJet)) {
          return;
        }
        if (!('energy' in rawJet)) {
          return;
        }
        const px = rawJet['momentum']['x'];
        const py = rawJet['momentum']['y'];
        const pz = rawJet['momentum']['z'];

        const pt = Math.sqrt(Math.pow(px, 2) + Math.pow(py, 2));
        const eta = Math.asinh(pz / pt);
        const phi = Math.acos(px / pt) * Math.sign(py);

        const jet = {
          eta: eta,
          phi: phi,
          energy: 1000 * rawJet.energy,
        };
        jets.push(jet);
      });
      allJets[collName] = jets;
    }

    return allJets;
  }

  private getMissingEnergy(event: any) {
    const allMETs: any[] = [];

    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collType' in collDict)) {
        continue;
      }

      if (
        !(collDict['collType'] === 'edm4hep::ReconstructedParticleCollection')
      ) {
        continue;
      }

      if (!(collName.includes('Missing') || collName.includes('missing'))) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      const METs: any[] = [];
      const rawMETs = collDict['collection'];
      const METColor = '#ff69b4';

      rawMETs.forEach((rawMET: any) => {
        if (!('momentum' in rawMET)) {
          return;
        }
        if (!('energy' in rawMET)) {
          return;
        }
        const px = rawMET['momentum']['x'];
        const py = rawMET['momentum']['y'];
        const pz = rawMET['momentum']['z'];

        const p = Math.sqrt(
          Math.pow(px, 2) + Math.pow(py, 2) + Math.pow(pz, 2)
        );
        const etx = (rawMET['energy'] * px) / p;
        const ety = (rawMET['energy'] * py) / p;

        const MET = {
          etx: etx * 10,
          ety: ety * 10,
          color: '#ff69b4',
        };
        METs.push(MET);
      });
      allMETs[collName] = METs;
    }

    return allMETs;
  }

  private randomColor() {
    return Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase();
  }

  private convHSLtoHEX(h: number, s: number, l: number): string {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };

    return `${f(0)}${f(8)}${f(4)}`;
  }

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

  private getCollByID(event: any, id: number) {
    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collID' in collDict)) {
        continue;
      }

      if (collDict['collID'] === id) {
        return collDict['collection'];
      }
    }
  }
}
