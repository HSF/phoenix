/**
 * Preset view for easily transforming/changing camera position to a specified position.
 */
export class PresetView {
  /** Icon of the preset view (to describe the view angle). */
  public icon: string;
  /** Position to which the camera is to be set. */
  public cameraPos: number[];
  /** Target to which the camera is pointing. */
  public cameraTarget: number[];
  /** Name of the preset view. */
  public name: string;

  /**
   * Create a preset view.
   * @param name Name of the preset view.
   * @param cameraPos Position to which the camera is to be set.
   * @param cameraTarget Target to which the camera is pointing.
   * @param icon Icon of the preset view (to describe the view angle).
   */
  constructor(
    name: string,
    cameraPos: number[],
    cameraTarget: number[],
    icon: string
  ) {
    this.name = name;
    this.cameraPos = cameraPos;
    this.cameraTarget = cameraTarget;
    this.icon = icon;
  }

  /**
   * Get the URL of the preset view icon.
   * @returns Icon URL.
   */
  getIconURL(): string {
    return 'assets/preset-views/' + this.icon + '.svg#' + this.icon;
  }
}
