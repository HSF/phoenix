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
    const runNumber = this.getRunNumber();

    Object.entries(this.rawEventData).forEach(([eventName, event]) => {
      const oneEventData = {
        Tracks: {},
        Hits: {},
        Cells: {},
        Jets: {},
        'event number': this.getEventNumber(eventName),
        'run number': runNumber
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


  private getRunNumber(): number {
    if (this.rawEventData['Run number']) {
      return Number(this.rawEventData['Run number']);
    } else {
      return 0;
    }
  }


  private getEventNumber(eventName: string): number {
    return Number(eventName.replace('Event ', ''));
  }

  private getTracks(event: any) {
    return {};
  }


  private getHits(event: any) {
    return {};
  }


  private getCells(event: any) {
    return {};
  }


  private getJets(event: any) {
    const rawClusters = event['calo_clusters'];

    let jets: any[] = []
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
