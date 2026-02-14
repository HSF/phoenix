import { PhoenixLoader } from './phoenix-loader';
import { openFile } from 'jsroot';

/**
 * Decompresses raw data from a ROOT file.
 * This is exported to allow for utility usage and testing.
 * @param data The raw data buffer to decompress.
 * @returns The decompressed data.
 */
export const decompress = (data: any) => data;

/**
 * PhoenixLoader for processing and loading an event from ".root".
 */
export class JSRootEventLoader extends PhoenixLoader {
  /**
   * Event data inside the file.
   */
  private fileEventData: any;

  /**
   * URL of the ".root" file to be processed.
   */
  private rootFileURL: any;

  /**
   * Constructor for the JSRoot event loader.
   * @param rootFileURL URL of the ".root" file to be processed.
   */
  constructor(rootFileURL: string) {
    super();
    this.rootFileURL = rootFileURL;
    this.fileEventData = {
      Hits: {},
      Tracks: {},
      Jets: {},
      CaloClusters: {},
    };
  }

  /**
   * Processes and loads event data from the specified ROOT objects.
   * @param objects List of object names to be loaded.
   * @param onEventData Callback function executed when event data is ready.
   * @returns A promise that resolves when the event data is processed.
   */
  public async getEventData(
    objects: string[],
    onEventData: (eventData: any) => void,
  ): Promise<void> {
    return openFile(this.rootFileURL)
      .then((file: any) => {
        const readPromises = objects.map((objectName) =>
          file
            .readObject(objectName)
            .then((object: any) => {
              if (object) {
                this.processItemsList(object);
              }
            })
            .catch((error: any) => {
              const errorString = String(error);

              if (
                errorString.includes('unsupported compression') ||
                errorString.includes('readObject')
              ) {
                // IMPORTANT: return fallback promise
                return this.handleUnsupportedCompression(objects, onEventData);
              }

              console.error('Error reading object:', error);
              onEventData(undefined);
            }),
        );

        return Promise.all(readPromises).then(() => {
          this.finalizeEventData(onEventData);
        });
      })
      .catch((error: any) => {
        const errorString = String(error);

        if (
          errorString.includes('unsupported compression') ||
          errorString.includes('readObject')
        ) {
          return this.handleUnsupportedCompression(objects, onEventData);
        }

        console.error('Error opening file:', error);
        onEventData(undefined);
      });
  }

  /**
   * Handles unsupported compression by fetching and decompressing the file manually.
   * @param objects List of object names to be loaded.
   * @param onEventData Callback function executed when event data is ready.
   * @returns A promise that resolves when the event data is processed.
   */
  private async handleUnsupportedCompression(
    objects: string[],
    onEventData: (eventData: any) => void,
  ): Promise<void> {
    return fetch(this.rootFileURL)
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        const decompressedData = decompress(buffer);
        return openFile(decompressedData);
      })
      .then((file: any) => {
        const readPromises = objects.map((objectName) =>
          file.readObject(objectName).then((object: any) => {
            if (object) {
              this.processItemsList(object);
            }
          }),
        );

        return Promise.all(readPromises).then(() => {
          this.finalizeEventData(onEventData);
        });
      })
      .catch((error) => {
        console.error('Error opening file:', error);
        onEventData(undefined);
      });
  }

  /**
   * Finalizes the event data by cleaning up empty object types and calling the callback.
   * @param onEventData Callback function executed when event data is ready.
   */
  private finalizeEventData(onEventData: (eventData: any) => void) {
    for (const objectType of ['Hits', 'Tracks', 'Jets', 'CaloClusters']) {
      if (Object.keys(this.fileEventData[objectType]).length === 0) {
        this.fileEventData[objectType] = undefined;
      }
    }
    onEventData(this.fileEventData);
  }

  /**
   * Processes the list of items inside the JSROOT files for relevant event data.
   * @param obj Object containing the event data in the form of JSROOT classes.
   */
  private processItemsList(obj: any) {
    if (obj._typename === 'TObjArray' || obj._typename === 'TList') {
      if (!obj.arr) return;
      for (let n = 0; n < obj.arr.length; ++n) {
        this.processItemsList(obj.arr[n]);
      }
    } else if (obj._typename === 'TGeoTrack') {
      if (!this.fileEventData.Tracks['TGeoTracks']) {
        this.fileEventData.Tracks['TGeoTracks'] = [];
      }
      const tGeoTrack = this.getTGeoTrack(obj);
      if (tGeoTrack) {
        this.fileEventData.Tracks['TGeoTracks'].push(tGeoTrack);
      }
    } else if (obj._typename?.includes('TEveTrack')) {
      const typeName = obj._typename + '(s)';
      if (!this.fileEventData.Tracks[typeName]) {
        this.fileEventData.Tracks[typeName] = [];
      }
      const tEveTrack = this.getTEveTrack(obj);
      if (tEveTrack) {
        this.fileEventData.Tracks[typeName].push(tEveTrack);
      }
    } else if (
      obj._typename?.includes('TEvePointSet') ||
      obj._typename === 'TPolyMarker3D'
    ) {
      const typeName = obj._typename + '(s)';
      if (!this.fileEventData.Hits[typeName]) {
        this.fileEventData.Hits[typeName] = [];
      }
      const hit = this.getHit(obj);
      if (hit) {
        this.fileEventData.Hits[typeName].push(hit);
      }
    }
  }

  /**
   * Extracts track data from a TGeoTrack object.
   * @param track The TGeoTrack object to process.
   * @returns The extracted track positions or false if invalid.
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
    return { pos: positions };
  }

  /**
   * Extracts track data from a TEveTrack object.
   * @param track The TEveTrack object to process.
   * @returns The extracted track data or false if invalid.
   */
  private getTEveTrack(track: any): any {
    if (!track || track.fN <= 0) return false;
    const trackObj: { [key: string]: any } = {};
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
   * Extracts hit data from a hit object.
   * @param hit The hit object to process.
   * @returns The extracted hit positions or false if invalid.
   */
  private getHit(hit: any): any {
    if (!hit || !hit.fN || hit.fN < 0) return false;
    const hitArray = [];
    for (let i = 0; i < hit.fN; i += 3) {
      hitArray.push([hit.fP[i], hit.fP[i + 1], hit.fP[i + 2]]);
    }
    return hitArray;
  }
}
