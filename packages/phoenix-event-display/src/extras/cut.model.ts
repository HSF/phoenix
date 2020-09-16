/**
 * Cut for specifying filters on event data attribute.
 */
export class Cut {
  /** Name of the event data attribute to be filtered. */
  field: string;
  /** Minimum allowed value of the event data attribute. */
  minValue: number;
  /** Maximum allowed value of the event data attribute. */
  maxValue: number;

  /**
   * Create the cut to filter an event data attribute.
   * @param field Name of the event data attribute to be filtered.
   * @param minValue Minimum allowed value of the event data attribute.
   * @param maxValue Maximum allowed value of the event data attribute.
   */
  constructor(field: string, minValue: number, maxValue: number) {
    this.field = field;
    this.minValue = minValue;
    this.maxValue = maxValue;
  }
}
