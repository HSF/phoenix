import {ThreeService} from '../three.service';
import {UIService} from '../ui.service';

export interface EventDataLoader {
  buildEventData(eventData: any, graphicsLibrary: ThreeService, ui: UIService): void;
}
