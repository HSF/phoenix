import { PhoenixLoader } from './phoenix-loader';

/**
 * PhoenixLoader for processing and loading an LHCb event.
 */
export class LHCbLoader extends PhoenixLoader {
  /** Event data to be processed. */
  private data: any;

  /**
   * Constructor for the LHCb loader.
   */
  constructor() {
    super();
    this.data = {};
  }

  /**
   * Set the event data for the loader.
   * @param data Event data as JSON.
   */
  public process(data: any) {
    console.log('Processing event data');
    this.data = data;
  }

  /**
   * Process and get the event data.
   * @returns The processed event data.
   */
  public getEventData(): any {

    const eventData = {
      eventNumber: this.data.eventNumber,
      runNumber: this.data.runNumber,
      Hits: {},
      Tracks: {}
    };

    let part_list = [];
    const pdata_list = this.data.PARTICLES;
    if (pdata_list) {
      for (let j = 0; j < pdata_list.length; j++) {
        let pdata = pdata_list[j];
        let mom = Math.pow(pdata.px, 2) + Math.pow(pdata.py, 2) + Math.pow(pdata.pz, 2);
        let part = {
          particle_id: pdata.name,
          pos: pdata.track,
          mom
        };
        part_list.push(part);
      }
    }
    eventData.Tracks = { Particles: part_list };
    return eventData;
  }

  /**
   * Get LHCb specific metadata associated to the event (experiment info, time, run, event...).
   * @returns Metadata of the event.
   */
  getEventMetadata(): any[] {
    let metadata = super.getEventMetadata();
    if (this.data['time']) {
      metadata.push({
        label: 'Data recorded',
        value: this.data['time']
      });
    }
    return metadata;
  }
}
