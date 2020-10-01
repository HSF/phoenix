/**
 * Cut for specifying filters on event data attribute.
 */
export class Cut {
  /** Default minimum allowed value of the event data attribute. */
  private defaultMinValue: number;
  /** Default maximum allowed value of the event data attribute. */
  private defaultMaxValue: number;

  /**
   * Create the cut to filter an event data attribute.
   * @param field Name of the event data attribute to be filtered.
   * @param minValue Minimum allowed value of the event data attribute.
   * @param maxValue Maximum allowed value of the event data attribute.
   * @param step Step for each value change.
   */
  constructor(
    public field: string,
    public minValue: number,
    public maxValue: number,
    public step: number = 1
  ) {
    this.defaultMinValue = minValue;
    this.defaultMaxValue = maxValue;
  }

  /**
   * Reset the minimum and maximum value of the cut to default.
   */
  reset() {
    this.minValue = this.defaultMinValue;
    this.maxValue = this.defaultMaxValue;
  }
}
