import { PrettySymbols } from '../../helpers/pretty-symbols';
import { ConfigRangeSlider } from '../../managers/ui-manager/phoenix-menu/config-types';

/**
 * Plain-object representation of a Cut, safe for JSON serialization.
 * Used by StateManager to persist active cut state across sessions.
 */
export interface CutJSON {
  /** The event data attribute field name this cut applies to. */
  field: string;
  /** The active minimum bound value of the cut. */
  minValue: number;
  /** The active maximum bound value of the cut. */
  maxValue: number;
  /** Step size used by the range slider for this cut. */
  step: number;
  /** Whether the lower bound cut is currently active. */
  minCutActive: boolean;
  /** Whether the upper bound cut is currently active. */
  maxCutActive: boolean;
  /**
   * The bounds and flags "Reset cuts" restores, i.e. the collection's full
   * range rather than the narrowing the user saved. Optional so that state
   * files written before this was persisted still load; for those the active
   * values are used, which is the old behaviour.
   */
  defaults?: {
    minValue: number;
    maxValue: number;
    minCutActive: boolean;
    maxCutActive: boolean;
  };
}

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

  /** Range slider for Cut */
  public configRangeSlider?: ConfigRangeSlider;

  /**
   * Create the cut to filter an event data attribute.
   * @param field The event data attribute field name to filter on.
   * @param minValue The minimum allowed value of the attribute.
   * @param maxValue The maximum allowed value of the attribute.
   * @param step Step size for the range slider.
   * @param minCutActive Whether the lower bound cut is active by default.
   * @param maxCutActive Whether the upper bound cut is active by default.
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

    // Ensure all numeric values are actual numbers from the start
    this.ensureNumericValues();
  }

  /** Enable/disable upper cut */
  enableMaxCut(check: boolean) {
    this.maxCutActive = check;
  }

  /** Enable/disable lower cut */
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
   * Create a deep copy of this Cut with the same field, bounds, step,
   * and active flags.
   */
  clone(): Cut {
    // Build from the defaults so the copy resets to the collection's real
    // range, then apply the current state on top. Constructing from the
    // current values would make any narrowing the new default.
    const cut = new Cut(
      this.field,
      this.defaultMinValue,
      this.defaultMaxValue,
      this.step,
      this.defaultApplyMinValue,
      this.defaultApplyMaxValue,
    );
    cut.minValue = this.minValue;
    cut.maxValue = this.maxValue;
    cut.minCutActive = this.minCutActive;
    cut.maxCutActive = this.maxCutActive;
    return cut;
  }

  /**
   * Ensure minValue, maxValue and step are always real numbers
   * This prevents string values like "0.5" from being saved in JSON.
   */
  private ensureNumericValues() {
    this.minValue = Number(this.minValue);
    this.maxValue = Number(this.maxValue);
    this.step = Number(this.step);
  }

  /**
   * Serialize the current cut state to a plain object for JSON persistence.
   * Forces numbers to prevent string values like "0.5".
   */
  toJSON(): CutJSON {
    this.ensureNumericValues(); // Extra safety before serialization

    return {
      field: this.field,
      minValue: Number(this.minValue),
      maxValue: Number(this.maxValue),
      step: Number(this.step),
      minCutActive: Boolean(this.minCutActive),
      maxCutActive: Boolean(this.maxCutActive),
      defaults: {
        minValue: Number(this.defaultMinValue),
        maxValue: Number(this.defaultMaxValue),
        minCutActive: Boolean(this.defaultApplyMinValue),
        maxCutActive: Boolean(this.defaultApplyMaxValue),
      },
    };
  }

  /**
   * Reconstruct a Cut instance from a previously serialized CutJSON object.
   * Handles cases where values might come as strings from JSON.parse().
   */
  static fromJSON(json: CutJSON): Cut {
    // Construct from the saved defaults so "Reset cuts" still restores the
    // collection's full range. State files written before `defaults` was
    // persisted fall back to the active values, preserving the old behaviour.
    const defaults = json.defaults;
    const cut = new Cut(
      json.field,
      Number(defaults?.minValue ?? json.minValue),
      Number(defaults?.maxValue ?? json.maxValue),
      Number(json.step ?? 1),
      Boolean(defaults?.minCutActive ?? json.minCutActive ?? true),
      Boolean(defaults?.maxCutActive ?? json.maxCutActive ?? true),
    );

    // Then restore the state the user actually saved.
    cut.minValue = Number(json.minValue);
    cut.maxValue = Number(json.maxValue);
    cut.minCutActive = Boolean(json.minCutActive ?? true);
    cut.maxCutActive = Boolean(json.maxCutActive ?? true);
    return cut;
  }

  /**
   * Reset the minimum and maximum value of the cut to default.
   */
  reset() {
    this.minValue = this.defaultMinValue;
    this.maxValue = this.defaultMaxValue;
    this.minCutActive = this.defaultApplyMinValue;
    this.maxCutActive = this.defaultApplyMaxValue;

    this.ensureNumericValues();

    if (this.configRangeSlider != undefined) {
      this.configRangeSlider.enableMin = true;
      this.configRangeSlider.enableMax = true;
      this.configRangeSlider.value = this.minValue;
      this.configRangeSlider.highValue = this.maxValue;
    }
  }

  /**
   * Builds a config range slider for the cut to be used in Phoenix Menu
   */
  public getConfigRangeSlider(
    collectionFiltering: () => void,
  ): ConfigRangeSlider {
    if (this.configRangeSlider == undefined) {
      this.configRangeSlider = {
        type: 'rangeSlider',
        label: PrettySymbols.getPrettySymbol(this.field),
        min: this.minValue,
        max: this.maxValue,
        step: this.step,
        value: this.minValue,
        highValue: this.maxValue,
        enableMin: this.minCutActive,
        enableMax: this.maxCutActive,
        onChange: ({ value, highValue }) => {
          this.minValue = Number(value); // Force number
          this.maxValue = Number(highValue); // Force number
          this.ensureNumericValues();
          collectionFiltering();
        },
        setEnableMin: (checked: boolean) => {
          this.enableMinCut(checked);
          collectionFiltering();
        },
        setEnableMax: (checked: boolean) => {
          this.enableMaxCut(checked);
          collectionFiltering();
        },
      };
    }
    return this.configRangeSlider;
  }
}
