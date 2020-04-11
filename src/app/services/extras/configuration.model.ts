import { PresetView } from './preset-view.model';
import { EventDataLoader } from '../event-data-loader';
import { PhoenixLoader } from '../loaders/phoenix-loader';

export class Configuration {
  presetViews: PresetView[];
  eventDataLoader: EventDataLoader;

  constructor() {
    this.presetViews = [];
    this.eventDataLoader = new PhoenixLoader();
  }

  public anyPresetView(): boolean {
    return this.presetViews.length > 0;
  }

  public setEventDataLoader(eventDataLoader: EventDataLoader) {
    this.eventDataLoader = eventDataLoader;
  }

  public getEventDataLoader(): EventDataLoader {
    return this.eventDataLoader;
  }
}
