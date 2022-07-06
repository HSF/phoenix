/**
 * Preset view settings for clipping
 */
export enum ClippingSetting {
  NotForced,
  On,
  Off,
}

/**
 * Preset view for easily transforming/changing camera position to a specified position.
 * Also allows to point the camera to a given target and to define the default clipping for that view
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
  /** Whether clipping should be used. */
  public clipping: ClippingSetting;
  /** In case of clipping, value of the start angle. */
  public clippingStartAngle: number;
  /** In case of clipping, value of the opening angle. */
  public clippingOpeningAngle: number;

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
    icon: string,
    clipping: ClippingSetting = ClippingSetting.NotForced,
    clippingStartAngle: number = 0,
    clippingOpeningAngle: number = 0
  ) {
    this.name = name;
    this.cameraPos = cameraPos;
    this.cameraTarget = cameraTarget;
    this.icon = icon;
    this.clipping = clipping;
    this.clippingStartAngle = clippingStartAngle;
    this.clippingOpeningAngle = clippingOpeningAngle;
  }

  /**
   * Get the URL of the preset view icon.
   * @returns Icon URL.
   */
  getIconURL(): string {
    return 'assets/preset-views/' + this.icon + '.svg#' + this.icon;
  }
}
