import { ThreeService } from './three.service';
import { UIService } from './ui.service';

/**
 * Event data loader
 */
export interface EventDataLoader {

  /**
   * Takes an object that represents ONE event and takes care of adding
   * the different objects to the graphic library and the UI controls.
   * @param eventData Object representing the event.
   * @param graphicsLibrary Service containing functionality to draw the 3D objects.
   * @param ui Service for showing menus and controls to manipulate the geometries.
   */
  buildEventData(eventData: any, graphicsLibrary: ThreeService, ui: UIService): void;

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
  getEventMetadata(): string[];

}
