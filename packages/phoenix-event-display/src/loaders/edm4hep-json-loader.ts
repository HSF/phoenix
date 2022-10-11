import { PhoenixLoader } from './phoenix-loader';

/*
 * Edm4hepJsonLoader for loading EDM4hep json dumps
 */
export class Edm4hepJsonLoader extends PhoenixLoader {
  /* Event data loaded from EDM4hep JSON file */
  private rawEventData: any;
  // eventData: any;


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
        Tracks: {},
        Hits: {},
        Cells: {},
        Jets: {},
        'event number': this.getEventNumber(event),
        'run number': this.getRunNumber(event)
      };

      oneEventData.Tracks = this.getTracks(event);
      oneEventData.Hits = this.getHits(event);
      oneEventData.Cells = this.getCells(event);
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

  private getTracks(event: any) {

    const randColor = () =>  {
      return Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase();
    }

    let tracks: any[] = [];
    // const trackCollections = ['SiTracks', 'SiTracksCT', 'SiTracks_Refitted'];
    const trackCollections = ['SiTracks'];

    trackCollections.forEach((trackCollection: any) => {
      if (!(trackCollection in event)) {
        return;
      }

      const rawTracks = event[trackCollection];
      const trackColor = randColor();

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


  private getJets(event: any) {
    if (!('calo_clusters' in event)) {
      return {};
    }

    const rawClusters = event['calo_clusters'];

    let jets: any[] = [];
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
        energy: 2500*rawCluster.energy
      }
      jets.push(cluster);
    });

    return { "Calo Clusters": jets};
  }
}
