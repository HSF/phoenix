import { PrettySymbols } from '../../helpers/pretty-symbols';
import { ConfigRangeSlider } from 'src/managers/ui-manager/phoenix-menu/config-types';

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
    // Reset the config range slider
    if (this.configRangeSlider != undefined) {
      this.configRangeSlider.enableMin = true;
      this.configRangeSlider.enableMax = true;
      this.configRangeSlider.value = this.minValue;
      this.configRangeSlider.highValue = this.maxValue;
    }
  }

  /**
   * Builds a config range slider for the cut to be used in Phoenix Menu
   * @param collectionFiltering callback function to apply to all objects inside a collection, filtering them given a parameter
   * @returns config range slider for the cut to be used in Phoenix Menu
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
          this.minValue = value;
          this.maxValue = highValue;
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
