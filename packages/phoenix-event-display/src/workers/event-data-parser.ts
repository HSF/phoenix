import type { WorkerRequest, WorkerResponse } from './event-data-parser.worker';

/**
 * Wrapper around the event-data-parser Web Worker.
 * Falls back to synchronous parsing when Workers are unavailable.
 */
export class EventDataParserWorker {
  private worker: Worker | null = null;

  constructor() {
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(
          new URL('./event-data-parser.worker', import.meta.url),
          { type: 'module' },
        );
      } catch {
        this.worker = null;
      }
    }
  }

  /**
   * Parse a JSON string off the main thread.
   * Falls back to JSON.parse synchronously if Workers are unavailable.
   */
  parseJSON(jsonString: string): Promise<any> {
    if (!this.worker) {
      return Promise.resolve(JSON.parse(jsonString));
    }
    return this.postMessage({ type: 'json', payload: jsonString });
  }

  /**
   * Parse a JiveXML string off the main thread.
   * Falls back to synchronous DOMParser if Workers are unavailable.
   */
  parseJiveXML(xmlString: string): Promise<any> {
    if (!this.worker) {
      return Promise.resolve(this.parseJiveXMLSync(xmlString));
    }
    return this.postMessage({ type: 'jivexml', payload: xmlString });
  }

  terminate() {
    this.worker?.terminate();
    this.worker = null;
  }

  private postMessage(request: WorkerRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent<WorkerResponse>) => {
        this.worker!.removeEventListener('message', handler);
        if (event.data.type === 'error') {
          reject(new Error(event.data.message));
        } else {
          resolve((event.data as any).result);
        }
      };
      this.worker!.addEventListener('message', handler);
      this.worker!.postMessage(request);
    });
  }

  private parseJiveXMLSync(xmlString: string): any {
    // Inline fallback — mirrors extractJiveXMLData in the worker
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    return xmlDoc.getElementsByTagName('Event')[0] ?? null;
  }
}
