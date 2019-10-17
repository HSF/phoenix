import {PresetView} from './preset-view.model';
import {EventDataLoader} from '../event-data-loader';
import {PhoenixLoader} from '../loaders/phoenix-loader';

export class Configuration {
  xClipPosition: number;
  yClipPosition: number;
  zClipPosition: number;
  maxPositionX: number;
  maxPositionY: number;
  maxPositionZ: number;
  allowShowAxes: boolean;
  allowSelecting: boolean;
  presetViews: PresetView[];
  eventDataLoader: EventDataLoader;
  darkBackground: boolean;
  detectorOpacity: number;
  colorScheme: MediaQueryList;

  constructor() {
    this.xClipPosition = 1200;
    this.yClipPosition = 1200;
    this.zClipPosition = 4000;
    this.maxPositionX = 4000;
    this.maxPositionY = 4000;
    this.maxPositionZ = 4000;
    this.allowShowAxes = true;
    this.allowSelecting = false;
    this.presetViews = [];
    this.eventDataLoader = new PhoenixLoader();
    this.colorScheme = matchMedia('(prefers-color-scheme: dark)');
    this.darkBackground = this.colorScheme.matches;
    this.detectorOpacity = 1;
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
