import { InfoLogger } from '../helpers/info-logger';
import { ThreeManager } from '../managers/three-manager/index';
import { UIManager } from '../managers/ui-manager/index';
import type {
  PhoenixEventData,
  PhoenixEventsData,
} from '../lib/types/event-data';

/**
 * This file defines the interfaces used by event data loaders.
 *
 * Event data loaders are responsible for transforming raw event
 * data into graphical objects and UI elements that can be rendered
 * in the Phoenix event display.
 */

/**
 * Metadata associated with an event.
 * This information is typically shown in the UI to provide
 * context about the event such as run number, event number,
 * or time of recording.
 */
export interface EventMetadata {
  /** Label describing the metadata field (e.g. Run, Event). */
  label: string;

  /** Value associated with the metadata label. */
  value: string | number;

  /** Optional unit of the value (e.g. ns, GeV). */
  unit?: string;

  /** Optional time information in nanoseconds. */
  time?: number;
}

/**
 * Represents event-level timing information.
 * The time value is expressed in nanoseconds and can be used
 * by animation systems to synchronize event playback.
 */
export interface EventTime {
  /** Event time in nanoseconds. */
  time?: number;
}

/**
 * Interface describing the required functionality
 * of an event data loader.
 *
 * Implementations of this interface convert raw event data
 * into graphical objects that can be rendered by the Phoenix
 * event display.
 */
export interface EventDataLoader {
  /**
   * Load a single event into the graphics library and UI.
   *
   * @param eventData Raw event data object.
   * @param graphicsLibrary Manager responsible for rendering 3D objects.
   * @param ui Manager responsible for user interface elements.
   * @param infoLogger Logger used for displaying event information.
   */
  buildEventData(
    eventData: PhoenixEventData,
    graphicsLibrary: ThreeManager,
    ui: UIManager,
    infoLogger: InfoLogger,
  ): void;

  /**
   * Retrieve the list of available events from the provided container.
   *
   * @param eventsData Object containing multiple events.
   * @returns Array of event names.
   */
  getEventsList(eventsData: PhoenixEventsData): string[];

  /**
   * Get collections grouped by object type.
   *
   * @returns Map where the key is the object type
   * and the value is a list of collection names.
   */
  getCollections(): { [key: string]: string[] };

  /**
   * Retrieve objects belonging to a specific collection.
   *
   * @param collectionName Name of the collection.
   * @returns Collection data.
   */
  getCollection(collectionName: string): any;

  /**
   * Retrieve metadata associated with the currently loaded event.
   *
   * @returns List of event metadata objects.
   */
  getEventMetadata(): EventMetadata[];

  /**
   * Retrieve event-level time information if available.
   *
   * @returns Event time metadata or undefined if not present.
   */
  getEventTime?(): EventTime;

  /**
   * Attach a label to an event object.
   *
   * @param label Label text.
   * @param collection Collection name.
   * @param indexInCollection Index of the object in the collection.
   * @returns Unique label identifier.
   */
  addLabelToEventObject(
    label: string,
    collection: string,
    indexInCollection: number,
  ): string;

  /**
   * Retrieve all labels associated with event objects.
   *
   * @returns Object containing label data.
   */
  getLabelsObject(): { [key: string]: any };
}
