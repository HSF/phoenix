import { InfoLogger } from '../helpers/info-logger';
import { ThreeManager } from '../managers/three-manager/index';
import { UIManager } from '../managers/ui-manager/index';
import type {
  PhoenixEventData,
  PhoenixEventsData,
} from '../lib/types/event-data';

/**
 * Event data loader for implementing different event data loaders.
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
  getEventMetadata(): any[];

  /** Add a label to an event object. Returns a unique label ID. */
  addLabelToEventObject(
    label: string,
    collection: string,
    indexInCollection: number,
  ): string;

  /** Get the labels object. */
  getLabelsObject(): { [key: string]: any };
}
