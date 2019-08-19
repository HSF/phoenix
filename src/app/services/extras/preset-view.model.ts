export class PresetView {
  public icon: string;
  public cameraPos: number[];
  public name: string;
  setView: () => void;

  constructor(name: string, cameraPos: number[], icon: string) {
    this.name = name;
    this.cameraPos = cameraPos;
    this.icon = icon;
  }

  getIconURL() {
    return '/assets/preset-views/' + this.icon + '.svg#' + this.icon;
  }
}
