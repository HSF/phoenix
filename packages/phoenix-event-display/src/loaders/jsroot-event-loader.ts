import { PhoenixLoader } from './phoenix-loader';

/**
 * PhoenixLoader for processing and loading an event from ".root".
 */
export class JSRootEventLoader extends PhoenixLoader {
  /** JSROOT object containing all JSROOT functions. */
  private JSROOT: any;
  /** Event data inside the file. */
  private fileEventData: any;
  /** URL of the ".root" file to be processed. */
  private rootFileURL: any;

  /**
   * Constructor for the JSRoot event loader.
   * @param JSROOT JSROOT object containing all JSROOT functions.
   * @param rootFileURL URL of the ".root" file to be processed.
   */
  constructor(JSROOT: any, rootFileURL: string) {
    super();

    this.JSROOT = JSROOT;
    this.rootFileURL = rootFileURL;

    this.fileEventData = {
      Hits: {},
      Tracks: {},
      Jets: {},
      CaloClusters: {},
    };
  }

  /**
   * Get event data of the given objects (e.g ['tracks;1', 'hits;1'])
   * from the currently loaded ".root" file.
   * @param objects An array identifying objects inside the ".root" file.
   * @param onEventData Callback when event data is extracted and available for use.
   */
  public getEventData(
    objects: string[],
    onEventData: (eventData: any) => void
  ) {
    this.JSROOT.openFile(this.rootFileURL).then((file: any) => {
      let i = 0;
      for (const objectName of objects) {
        file.readObject(objectName).then((object: any) => {
          i++;
          if (object) {
            this.processItemsList(object);
          }
          if (i === objects.length) {
            for (const objectType of [
              'Hits',
              'Tracks',
              'Jets',
              'CaloClusters',
            ]) {
              if (Object.keys(this.fileEventData[objectType]).length === 0) {
                this.fileEventData[objectType] = undefined;
              }
            }
            onEventData(this.fileEventData);
          }
        });
      }
    });
  }

  /**
   * Process the list of items inside the JSROOT files for relevant event data.
   * @param obj Object containing the event data in the form of JSROOT classes.
   */
  private processItemsList(obj: any) {
    if (obj._typename === 'TObjArray' || obj._typename === 'TList') {
      if (!obj.arr) return;
      for (let n = 0; n < obj.arr.length; ++n) {
        const sobj = obj.arr[n];
        this.processItemsList(sobj);
      }
    } else if (obj._typename === 'THREE.Mesh') {
      // Three.js object - we only want event data
    } else if (obj._typename === 'TGeoTrack') {
      if (!this.fileEventData.Tracks['TGeoTracks']) {
        this.fileEventData.Tracks['TGeoTracks'] = [];
      }
      const tGeoTrack = this.getTGeoTrack(obj);
      if (tGeoTrack) {
        this.fileEventData.Tracks['TGeoTracks'].push(tGeoTrack);
      }
    } else if (
      obj._typename === 'TEveTrack' ||
      obj._typename === 'ROOT::Experimental::TEveTrack'
    ) {
      if (!this.fileEventData.Tracks[obj._typename + '(s)']) {
        this.fileEventData.Tracks[obj._typename + '(s)'] = [];
      }
      const tEveTrack = this.getTEveTrack(obj);
      if (tEveTrack) {
        this.fileEventData.Tracks[obj._typename + '(s)'].push(tEveTrack);
      }
    } else if (
      obj._typename === 'TEvePointSet' ||
      obj._typename === 'ROOT::Experimental::TEvePointSet' ||
      obj._typename === 'TPolyMarker3D'
    ) {
      if (!this.fileEventData.Hits[obj._typename + '(s)']) {
        this.fileEventData.Hits[obj._typename + '(s)'] = [];
      }
      const hit = this.getHit(obj);
      if (hit) {
        this.fileEventData.Hits[obj._typename + '(s)'].push(hit);
      }
    } else if (
      obj._typename === 'TEveGeoShapeExtract' ||
      obj._typename === 'ROOT::Experimental::TEveGeoShapeExtract'
    ) {
      // Some extra shape - we only want event data
    }
  }

  /**
   * Process and get the TGeoTrack in phoenix format.
   * @param track Track object containing the track information.
   * @returns Track object in the phoenix format.
   */
  private getTGeoTrack(track: any): any {
    if (!track || !track.fNpoints) return false;

    const npoints = Math.round(track.fNpoints / 4);
    const positions = [];
    for (let k = 0; k < npoints - 1; ++k) {
      positions.push([
        track.fPoints[k * 4],
        track.fPoints[k * 4 + 1],
        track.fPoints[k * 4 + 2],
      ]);
    }

    return {
      pos: positions,
    };
  }

  /**
   * Process and get the TEveTrack in phoenix format.
   * @param track Track object containing the track information.
   * @returns Track object in the phoenix format.
   */
  private getTEveTrack(track: any): any {
    if (!track || track.fN <= 0) return false;

    const trackObj = {};

    const positions = [];
    for (let i = 0; i < track.fN - 1; i++) {
      positions.push([
        track.fP[i * 3],
        track.fP[i * 3 + 1],
        track.fP[i * 3 + 2],
      ]);
    }

    for (const trackParamLine of track.fTitle.split('\n')) {
      for (const trackParam of trackParamLine.split(/(?!\(.*), (?!.*\))/g)) {
        const trackParamData = trackParam.split('=');
        trackObj[trackParamData[0]] = trackParamData[1];
      }
    }

    trackObj['pos'] = positions;

    return trackObj;
  }

  /**
   * Process and get the Hit in phoenix format.
   * @param hit Hit object containing the hit information.
   * @returns Hit in phoenix format.
   */
  private getHit(hit: any): any {
    if (!hit || !hit.fN || hit.fN < 0) return false;

    const hitArray = [];

    for (let i = 0; i < hit.fN; i += 3) {
      hitArray.push([hit.fP[i * 3], hit.fP[i * 3 + 1], hit.fP[i * 3 + 2]]);
    }

    return hitArray;
  }
}
