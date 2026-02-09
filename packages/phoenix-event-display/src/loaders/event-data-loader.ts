import { InfoLogger } from '../helpers/info-logger';
import { ThreeManager } from '../managers/three-manager/index';
import { UIManager } from '../managers/ui-manager/index';

/**
 * Event metadata information.
 * All fields are optional for backward compatibility.
 * Time unit: nanoseconds (ns)
 */
export interface EventMetadata {
  label: string;
  value: string | number;
  unit?: string;
}

/**
 * Event-level timing information.
 * Time unit: nanoseconds (ns)
 */
export interface EventTime {
  time: number; // ns
  unit: 'ns';
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

  /**
   * Get list of available event names.
   */
  getEventsList(eventsData: any): string[];

  /**
   * Get the different collections for the current stored event.
   * @returns Object mapping collection groups to collection names.
   */
  getCollections(): { [key: string]: string[] };

  /**
   * Get a specific collection by name.
   */
  getCollection(collectionName: string): any;

  /**
   * Get metadata associated with the event.
   */
  getEventMetadata(): EventMetadata[];

  /**
   * Optional event-level time support (EDM time).
   */
  getEventTime?(): EventTime;

  /**
   * Add label to an event object.
   */
  addLabelToEventObject(
    label: string,
    collection: string,
    indexInCollection: number,
  ): string;

  /**
   * Get all labels for the event.
   */
  getLabelsObject(): { [key: string]: any };
}
