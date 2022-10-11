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
        Cells: {},
        CaloClusters: {},
        Jets: {},
        'event number': this.getEventNumber(event),
        'run number': this.getRunNumber(event)
      };

      oneEventData.Vertices = this.getVertices(event);
      oneEventData.Tracks = this.getTracks(event);
      oneEventData.Hits = this.getHits(event);
      oneEventData.Cells = this.getCells(event);
      oneEventData.CaloClusters = this.getCaloClusters(event);
      oneEventData.Jets = this.getJets(event);

      this.eventData[eventName] = oneEventData;
    });

    return true;
  }


  /* Output event data in Phoenix compatible format */
  getEventData(): any {
    return this.eventData;
  }


  private getNumEvents(): number {
    return Object.keys(this.rawEventData).length
  }


  private getRunNumber(event: any): number {
    if ('runNum' in event) {
      return Number(event['runNum']);
    } else {
      return 0;
    }
  }


  private getEventNumber(event: any): number {
    if ('eventNum' in event) {
      return Number(event['eventNum']);
    } else {
      return 0;
    }
  }


  private getVertices(event: any) {
    let vertices: any[] = [];
    const vertexCollections = ['BuildUpVertices'];

    vertexCollections.forEach((vertexCollection: any) => {
      if (!(vertexCollection in event)) {
        return;
      }

      const rawVertices = event[vertexCollection];
      const vertexColor = this.randomColor();

      rawVertices.forEach((rawVertex: any) => {
        let position: any[] = [];
        if ('position' in rawVertex) {
          position.push(rawVertex['position']['x']);
          position.push(rawVertex['position']['y']);
          position.push(rawVertex['position']['z']);
        }

        let vertex = {
          pos: position,
          color: '#' + vertexColor,
        }
        vertices.push(vertex);
      });
    });

    return { 'Vertices': vertices };
  }


  private getTracks(event: any) {
    let tracks: any[] = [];
    // const trackCollections = ['SiTracks', 'SiTracksCT', 'SiTracks_Refitted'];
    const trackCollections = ['SiTracks'];

    trackCollections.forEach((trackCollection: any) => {
      if (!(trackCollection in event)) {
        return;
      }

      const rawTracks = event[trackCollection];
      const trackColor = this.randomColor();

      rawTracks.forEach((rawTrack: any) => {
        let positions: any[] = [];
        if ('trackStates' in rawTrack) {
          const trackStates = rawTrack['trackStates'];
          trackStates.forEach((trackState: any) => {
            if ('referencePoint' in trackState) {
              positions.push([
                trackState['referencePoint']['x'],
                trackState['referencePoint']['y'],
                trackState['referencePoint']['z'],
              ]);
            }
          });
        }

        let track = {
          pos: positions,
          color: trackColor,
        }
        tracks.push(track);
      });
    });

    return { 'Tracks': tracks };
  }


  private getHits(event: any) {
    return {};
  }


  private getCells(event: any) {
    return {};
  }


  private getCaloClusters(event: any) {
    if (!('PandoraClusters' in event)) {
      console.log('No clusters!');
      return {};
    }

    const rawClusters = event['PandoraClusters'];

    let clusters: any[] = [];
    rawClusters.forEach((rawCluster: any) => {
      const px = rawCluster.position.x;
      const py = rawCluster.position.y;
      const pz = rawCluster.position.z;

      const pt = Math.sqrt(Math.pow(px, 2) + Math.pow(py, 2));
      const eta = Math.asinh(pz / pt);
      const phi = Math.acos(px / pt);

      const cluster = {
        eta: eta,
        phi: phi,
        energy: 3000*rawCluster.energy
      }
      clusters.push(cluster);
    });

    console.log(clusters);

    return { "Calo Clusters": clusters};
  }


  private getJets(event: any) {
    if (!('VertexJets' in event)) {
      return {};
    }

    const rawJets = event['VertexJets'];

    let jets: any[] = [];
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
      const phi = Math.acos(px / pt);

      const jet = {
        eta: eta,
        phi: phi,
        energy: 2400*rawJet.energy
      }
      jets.push(jet);
    });

    return { "Jets": jets};
  }

  private randomColor() {
    return Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase();
  }
}
