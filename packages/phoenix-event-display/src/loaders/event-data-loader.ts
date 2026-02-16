import { InfoLogger } from '../helpers/info-logger';
import { ThreeManager } from '../managers/three-manager/index';
import { UIManager } from '../managers/ui-manager/index';

/**
 * Metadata describing event information.
 * All fields are optional for backward compatibility.
 * Time unit: nanoseconds (ns)
 */
export interface EventMetadata {
  /** Name or label of the metadata field */
  label: string;

  /** Value associated with the metadata */
  value: string | number;

  /** Optional unit of the metadata value */
  unit?: string;
}

/**
 * Represents time information of an event.
 * Time unit: nanoseconds (ns)
 */
export interface EventTime {
  /** Time value in nanoseconds */
  time: number;

  /** Unit of time (nanoseconds) */
  unit: 'ns';
}

/**
 * Interface describing behaviour of event data loaders.
 */
export interface EventDataLoader {
  /**
   * Builds event data using provided graphics and UI managers.
   *
   * @param eventData Raw event data input
   * @param graphicsLibrary Three.js manager instance
   * @param ui UI manager instance
   * @param infoLogger Logger for event information
   */
  buildEventData(
    eventData: any,
    graphicsLibrary: ThreeManager,
    ui: UIManager,
    infoLogger: InfoLogger,
  ): void;

  /**
   * Get list of available event names.
   *
   * @param eventsData Raw events data
   * @returns Array of event names
   */
  getEventsList(eventsData: any): string[];

  /**
   * Get the different collections for the current stored event.
   *
   * @returns Object mapping collection groups to collection names.
   */
  getCollections(): { [key: string]: string[] };

  /**
   * Get a specific collection by name.
   *
   * @param collectionName Name of the collection
   * @returns Collection data
   */
  getCollection(collectionName: string): any;

  /**
   * Get metadata associated with the event.
   *
   * @returns Array of event metadata
   */
  getEventMetadata(): EventMetadata[];

  /**
   * Optional event-level time support (EDM time).
   *
   * @returns Event time information
   */
  getEventTime?(): EventTime;

  /**
   * Add label to an event object.
   *
   * @param label Label to add
   * @param collection Collection name
   * @param indexInCollection Index of object in collection
   * @returns Generated label string
   */
  addLabelToEventObject(
    label: string,
    collection: string,
    indexInCollection: number,
  ): string;

  /**
   * Get all labels for the event.
   *
   * @returns Object containing labels
   */
  getLabelsObject(): { [key: string]: any };
}
