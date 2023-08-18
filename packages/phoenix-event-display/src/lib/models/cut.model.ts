/**
 * Cut for specifying filters on event data attribute.
 */
export class Cut {
  /** Default minimum allowed value of the event data attribute. */
  private defaultMinValue: number;
  /** Default maximum allowed value of the event data attribute. */
  private defaultMaxValue: number;
  /** Default if upper bound applied */
  private defaultApplyMaxValue: boolean;
  /** Default if lower bound applied */
  private defaultApplyMinValue: boolean;
  /**
   * Create the cut to filter an event data attribute.
   * @param field Name of the event data attribute to be filtered.
   * @param minValue Minimum allowed value of the event data attribute.
   * @param maxValue Maximum allowed value of the event data attribute.
   * @param step Size of increment when using slider.
   * @param minCutActive If true, the minimum cut is appled. Can be overriden later with enableMinCut.
   * @param maxCutActive If true, the maximum cut is appled. Can be overriden later with enableMaxCut.
   *
   */
  constructor(
    public field: string,
    public minValue: number,
    public maxValue: number,
    public step: number = 1,
    public minCutActive: boolean = true,
    public maxCutActive: boolean = true,
  ) {
    this.defaultMinValue = minValue;
    this.defaultMaxValue = maxValue;
    this.defaultApplyMinValue = minCutActive;
    this.defaultApplyMaxValue = maxCutActive;
  }

  /** Returns true if upper cut is valid. */
  enableMaxCut(check: boolean) {
    this.maxCutActive = check;
  }

  /** Returns true if upper cut is valid. */
  enableMinCut(check: boolean) {
    this.minCutActive = check;
  }

  /** Returns true if the passed value is within the active cut range. */
  cutPassed(value: number): boolean {
    return (
      (!this.maxCutActive || value <= this.maxValue) &&
      (!this.minCutActive || value > this.minValue)
    );
  }

  /**
   * Reset the minimum and maximum value of the cut to default.
   */
  reset() {
    this.minValue = this.defaultMinValue;
    this.maxValue = this.defaultMaxValue;
    this.minCutActive = this.defaultApplyMinValue;
    this.maxCutActive = this.defaultApplyMaxValue;
  }
}
