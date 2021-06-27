import { PhoenixLoader } from './phoenix-loader';

/**
 * PhoenixLoader for processing and loading an event from TrackML.
 */
export class TrackmlLoader extends PhoenixLoader {
  /** Data containing Hits. */
  private hitData: any;
  /** Data containing Particles. */
  private particleData: any;
  /** Data containing truthy Particles. */
  private truthData: any;

  /**
   * Instiantiate the TrackML loader.
   */
  constructor() {
    super();
    this.hitData = [];
    this.particleData = [];
    this.truthData = {};
  }

  /**
   * Process Hits to format and store them.
   * @param hits Hits to be processed.
   */
  public processHits(hits: any) {
    const data = hits.split('\n');
    console.log('Event has this many hits:', data.length);

    let values;
    // format is: hit_id,x,y,z,volume_id,layer_id,module_id
    for (let line = 1; line < data.length; line++) {
      values = data[line].split(',');
      this.hitData[values[0]] = [
        parseFloat(values[1]),
        parseFloat(values[2]),
        parseFloat(values[3]),
      ];
    }
  }

  /**
   * Process Particles to format and store them.
   * @param particles Particles to be processed.
   */
  public processParticles(particles: any) {
    const data = particles.split('\n');
    console.log('Event has this many particles:', data.length);

    let values;
    // format is: particle_id,vx,vy,vz,px,py,pz,q,nhits
    for (let line = 1; line < data.length; line++) {
      values = data[line].split(',');
      this.particleData.push({
        particle_id: parseInt(values[0]),
        vertex_pos: [
          parseFloat(values[1]),
          parseFloat(values[2]),
          parseFloat(values[3]),
        ],
        mom: [
          parseFloat(values[4]),
          parseFloat(values[5]),
          parseFloat(values[6]),
        ],
      });
    }
  }

  /**
   * Process Truth data to format and store it.
   * @param truth Truth data to be processed.
   */
  public processTruth(truth: any) {
    const data = truth.split('\n');
    console.log('Event has this many truth: ', data.length);

    let values;
    // format is: hit_id,particle_id,tx,ty,tz,tpx,tpy,tpz,weight
    for (let line = 1; line < data.length; line++) {
      values = data[line].split(',');
      this.truthData[values[0]] = [
        values[1],
        values[2],
        values[3],
        values[4],
        values[5],
        values[6],
        values[7],
        values[8],
      ];
    }
  }

  /**
   * Get structured event data from the processed Hits, Truth data and Particles.
   * @param eventNum Event number.
   */
  public getEventData(eventNum: string): any {
    const eventData = {
      eventNumber: eventNum,
      runNumber: 0,
      Hits: undefined,
      Tracks: undefined,
    };

    if (this.hitData) {
      eventData.Hits = {};
      eventData.Hits.Reconstructed = [];
      let mod = Math.round(this.hitData.length / 5000);
      if (mod < 1) {
        mod = 1;
      }
      let count = 0;
      for (let i = 1; i < this.hitData.length; i++) {
        if (i % mod) {
          continue;
        }
        eventData.Hits.Reconstructed[count++] = [
          [this.hitData[i][0], this.hitData[i][1], this.hitData[i][2]],
        ];
      }
    }
    console.log(
      'Will show this many hits',
      eventData.Hits.Reconstructed.length
    );

    if (this.truthData) {
      eventData.Tracks = { Particles: [] };
      if (this.particleData) {
        for (let i = 0; i < this.particleData.length; i++) {
          // Add the relevant data from particle, such as first hit position - we'll add the particle_id because we need it later.
          eventData.Tracks.Particles[i] = {
            particle_id: this.particleData[i].particle_id,
            pos: [this.particleData[i].vertex_pos],
            mom: this.particleData[i].mom,
          };
          // console.log('Just added: ', event_data.Tracks.Particles[i-1]);
        }
      }
      let hitId;
      let particleId;
      const stepSize = parseInt(String(this.truthData.length / 10));
      for (let i = 1; i < this.truthData.length; i++) {
        // Now add the truth data - i.e. add the truth hits which match a particle to the particle (unsorted for the moment)
        hitId = i;
        particleId = parseInt(this.truthData[i][0]);
        for (let j = 0; j < eventData.Tracks.Particles.length; j++) {
          // console.log(event_data.Tracks.Particles[j]);
          if (eventData.Tracks.Particles[j].particle_id === particleId) {
            // Found matching particle - add the truth hit position to the particles positions
            eventData.Tracks.Particles[j].pos.push([
              parseFloat(this.truthData[i][1]),
              parseFloat(this.truthData[i][2]),
              parseFloat(this.truthData[i][3]),
            ]);
          }
        }
        if (i % stepSize === 0) {
          document.getElementById('info').innerHTML =
            'Processed ' +
            (100 * i) / this.truthData.length +
            '% of event data.';
        }
      }
    }

    let numParticleStubs = 0;
    for (let j = 0; j < eventData.Tracks.Particles.length; j++) {
      if (eventData.Tracks.Particles[j].pos.length < 3) {
        // console.log ('Track has less than 3 positions');
        // console.log(event_data.Tracks.Particles[j]);
        numParticleStubs++;
      }
    }
    const events = {};
    events[eventNum] = eventData;
    return eventData;
  }
}
