import { PresetView } from './preset-view.model';
import { EventDataLoader } from '../event-data-loader';
import { PhoenixLoader } from '../loaders/phoenix-loader';

/**
 * Configuration for preset views and event data loader.
 */
export class Configuration {
  /** Preset views for switching event display camera. */
  presetViews: PresetView[];
  /** Event data loader responsible for processing and loading event data. */
  eventDataLoader: EventDataLoader;

  /**
   * Constructor for the Configuration.
   */
  constructor() {
    this.presetViews = [];
    this.eventDataLoader = new PhoenixLoader();
  }

  /**
   * Get if there are any preset views.
   * @returns If there are any preset views.
   */
  public anyPresetView(): boolean {
    return this.presetViews.length > 0;
  }

  /**
   * Set the event data loader to be used.
   * @param eventDataLoader Event data loader responsible for
   * processing and loading event data.
   */
  public setEventDataLoader(eventDataLoader: EventDataLoader) {
    this.eventDataLoader = eventDataLoader;
  }

  /**
   * Get the event data loader responsible for processing and loading event data.
   * @returns The event data loader.
   */
  public getEventDataLoader(): EventDataLoader {
    return this.eventDataLoader;
  }
}
