import { Injectable, OnDestroy } from '@angular/core';
import { EventAutoloader, type AutoloadSource } from 'phoenix-event-display';
import { EventDisplayService } from './event-display.service';
import { FileLoaderService } from './file-loader.service';

/**
 * Angular service for auto-loading events from a directory or endpoint.
 *
 * Supports three source types:
 * - `apache-listing`: polls an Apache/nginx directory index (e.g. JSROOT-style)
 * - `rest-endpoint`: polls a REST API that returns the next event URL or data
 * - `sse`: connects to a Server-Sent Events stream for push-based delivery
 *
 * @example — Apache directory (JSROOT-style):
 * ```ts
 * this.autoloaderService.start({
 *   type: 'apache-listing',
 *   url: 'https://my-server/events/',
 *   intervalMs: 5000,
 * });
 * ```
 *
 * @example — AWS Lambda / REST endpoint:
 * ```ts
 * this.autoloaderService.start({
 *   type: 'rest-endpoint',
 *   url: 'https://lambda-url.amazonaws.com/latest-event',
 *   intervalMs: 3000,
 * });
 * ```
 *
 * @example — Server-Sent Events (push):
 * ```ts
 * this.autoloaderService.start({ type: 'sse', url: '/api/events/stream' });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EventAutoloaderService implements OnDestroy {
  private autoloader: EventAutoloader | null = null;

  constructor(
    private eventDisplay: EventDisplayService,
    private fileLoader: FileLoaderService,
  ) {}

  /**
   * Start auto-loading events from the given source.
   * Stops any previously running autoloader first.
   * @param source Source configuration.
   * @param onError Optional error callback.
   */
  start(source: AutoloadSource, onError?: (err: Error) => void) {
    this.stop();

    this.autoloader = new EventAutoloader({
      source,
      onEvent: (data) => this.handleEvent(data),
      onError: onError ?? ((err) => console.error('[EventAutoloader]', err)),
    });

    this.autoloader.start();
  }

  /** Stop the autoloader. */
  stop() {
    this.autoloader?.stop();
    this.autoloader = null;
  }

  get isRunning() {
    return this.autoloader?.isRunning ?? false;
  }

  ngOnDestroy() {
    this.stop();
  }

  /**
   * Routes incoming event data to the correct loader based on its shape.
   * - `{ __jivexml__: string }` → JiveXMLLoader
   * - plain object → buildEventDataFromJSON (Phoenix/JSON format)
   */
  private handleEvent(data: any) {
    if (data?.__jivexml__) {
      this.fileLoader.loadJiveXMLEvent(data.__jivexml__, this.eventDisplay);
    } else {
      // Phoenix JSON format: may be a single event or a multi-event object
      if (this.isMultiEventObject(data)) {
        this.eventDisplay.parsePhoenixEvents(data);
      } else {
        this.eventDisplay.buildEventDataFromJSON(data);
      }
    }
  }

  /**
   * Heuristic: if the object's values are all objects (not arrays of physics
   * objects), treat it as a multi-event Phoenix format.
   */
  private isMultiEventObject(data: any): boolean {
    if (typeof data !== 'object' || Array.isArray(data)) return false;
    const values = Object.values(data);
    return (
      values.length > 0 &&
      values.every((v) => typeof v === 'object' && !Array.isArray(v))
    );
  }
}
