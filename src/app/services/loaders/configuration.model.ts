import {PresetView} from '../extras/preset-view.model';
import {EventDataLoader} from './event-data-loader';
import {PhoenixLoader} from './phoenix-loader';

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
    this.darkBackground = matchMedia('(prefers-color-scheme: dark)').matches;
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
