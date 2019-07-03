import {PresetView} from './preset-view';

export class Configuration {
  xClipPosition: number;
  yClipPosition: number;
  zClipPosition: number;
  maxPositionX: number;
  maxPositionY: number;
  maxPositionZ: number;
  allowShowAxes: boolean;
  presetViews: PresetView[];

  constructor() {
    this.xClipPosition = 1200;
    this.yClipPosition = 1200;
    this.zClipPosition = 4000;
    this.maxPositionX = 4000;
    this.maxPositionY = 4000;
    this.maxPositionZ = 4000;
    this.allowShowAxes = true;
    this.presetViews = [];
  }

  public anyPresetView(): boolean {
    return this.presetViews.length > 0;
  }
}
