import {PresetView} from './preset-view';
import {EventDataLoader} from './loaders/event-data-loader';
import {PhoenixLoader} from './loaders/phoenix-loader';

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
  }

  public anyPresetView(): boolean {
    return this.presetViews.length > 0;
  }

  addTrack() {
    return this.eventDataLoader.addTrack;
  }

  addJet() {
    return this.eventDataLoader.addJet;
  }
}
