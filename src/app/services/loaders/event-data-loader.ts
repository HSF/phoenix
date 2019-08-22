import {ThreeService} from '../three.service';
import {UIService} from '../ui.service';

export interface EventDataLoader {
  buildEventsList(eventsData: any): string[];

  buildEventData(eventData: any, graphicsLibrary: ThreeService, ui: UIService): void;

  getCollection(value: string): any;

  getCollections(): string[];
}
