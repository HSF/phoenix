import { ThreeManager } from '../managers/three-manager';
import { UIManager } from '../managers/ui-manager';
import { InfoLogger } from '../helpers/info-logger';

/**
 * Event data loader for implementing different event data loaders.
 */
export interface EventDataLoader {
  /**
   * Takes an object that represents ONE event and takes care of adding
   * the different objects to the graphic library and the UI controls.
   * @param eventData Object representing the event.
   * @param graphicsLibrary Manager containing functionality to draw the 3D objects.
   * @param ui Manager for showing menus and controls to manipulate the geometries.
   * @param infoLogger Logger for logging event display data..
   */
  buildEventData(
    eventData: any,
    graphicsLibrary: ThreeManager,
    ui: UIManager,
    infoLogger: InfoLogger
  ): void;

  /**
   * Takes an object containing multiple events and returns the keys of these events.
   * @param eventsData Object that contains the different events.
   * @returns List of keys of the different events.
   */
  getEventsList(eventsData: any): string[];

  /**
   * Get the different collections for the current stored event.
   * @returns List of strings, each representing a collection of the event displayed.
   */
  getCollections(): string[];

  /**
   * Get all the objects inside a collection.
   * @param collectionName Key of the collection that will be retrieved.
   * @returns Object containing all physics objects from the desired collection.
   */
  getCollection(collectionName: string): any;

  /**
   * Get metadata associated to the displayed event (experiment info, time, run, event...).
   * @returns Metadata of the displayed event.
   */
  getEventMetadata(): any[];

  /**
   * Add label of event object to the labels object.
   * @param label Label to add to the event object.
   * @param collection Collection the event object is a part of.
   * @param indexInCollection Event object's index in collection.
   * @returns A unique label ID string.
   */
  addLabelToEventObject(
    label: string,
    collection: string,
    indexInCollection: number
  ): string;

  /**
   * Get the object containing labels.
   * @returns The labels object.
   */
  getLabelsObject(): { [key: string]: any };
}
