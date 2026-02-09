import { ThreeManager } from '../managers/three-manager/index';
import { UIManager } from '../managers/ui-manager/index';
import { InfoLogger } from '../helpers/info-logger';

/**
 * Event metadata information.
 * All fields are optional for backward compatibility.
 * Time unit: nanoseconds (ns)
 */
export interface EventMetadata {
  label: string;
  value: string | number;
  unit?: string;
  time?: number; // ns
}

/**
 * Event-level timing information.
 * Time unit: nanoseconds (ns)
 */
export interface EventTime {
  time?: number; // ns
}

/**
 * Event data loader for implementing different event data loaders.
 */
export interface EventDataLoader {
  buildEventData(
    eventData: any,
    graphicsLibrary: ThreeManager,
    ui: UIManager,
    infoLogger: InfoLogger,
  ): void;

  getEventsList(eventsData: any): string[];

  getCollections(): string[];

  getCollection(collectionName: string): any;

  getEventMetadata(): EventMetadata[];

  /**
   * THIS is what completes EDM time support
   */
  getEventTime?(): EventTime;

  addLabelToEventObject(
    label: string,
    collection: string,
    indexInCollection: number,
  ): string;

  getLabelsObject(): { [key: string]: any };
}
