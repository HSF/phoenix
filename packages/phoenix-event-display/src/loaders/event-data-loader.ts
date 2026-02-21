import { InfoLogger } from '../helpers/info-logger';
import { ThreeManager } from '../managers/three-manager/index';
import { UIManager } from '../managers/ui-manager/index';
import type {
  PhoenixEventData,
  PhoenixEventsData,
} from '../lib/types/event-data';

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
  /** Load one event into the graphics library and UI. */
  buildEventData(
    eventData: PhoenixEventData,
    graphicsLibrary: ThreeManager,
    ui: UIManager,
    infoLogger: InfoLogger,
  ): void;

  /** Get keys of all events in the container. */
  getEventsList(eventsData: PhoenixEventsData): string[];

  /** Get collection names grouped by object type. */
  getCollections(): { [key: string]: string[] };

  /** Get all objects in a collection by name. */
  getCollection(collectionName: string): any;

  /** Get metadata for the current event. */
  getEventMetadata(): EventMetadata[]; // Using your interface instead of any[]

  /** Optional event-level time support (EDM time). */
  getEventTime?(): EventTime; // REQUIRED for your feature!

  /** Add a label to an event object. Returns a unique label ID. */
  addLabelToEventObject(
    label: string,
    collection: string,
    indexInCollection: number,
  ): string;

  /** Get the labels object. */
  getLabelsObject(): { [key: string]: any };
}
