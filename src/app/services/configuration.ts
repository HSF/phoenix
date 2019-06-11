export class Configuration {
  xClipPosition: number;
  yClipPosition: number;
  zClipPosition: number;
  eventFileUploader: string;
  geomFileUploader: string;
  allowShowAxes: boolean;
  customEventFileConvertor: any;

  constructor() {
    this.xClipPosition = 1200;
    this.yClipPosition = 1200;
    this.zClipPosition = 4000;
    this.eventFileUploader = 'offbydefault';
    this.geomFileUploader = 'offbydefault';
    this.allowShowAxes = true;
  }
}
