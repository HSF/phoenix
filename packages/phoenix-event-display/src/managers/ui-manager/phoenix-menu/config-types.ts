/** Type for Phoenix menu "label" config. */
export type ConfigLabel = {
  label: string;
};

/** Type for Phoenix menu "checkbox" config. */
export type ConfigCheckbox = ConfigLabel & {
  isChecked: boolean;
  onChange: (value: boolean) => void;
};

/** Type for Phoenix menu "slider" config. */
export type ConfigConfigSlider = ConfigLabel & {
  value: number;
  min: number;
  max: number;
  step: number;
  allowCustomValue: boolean;
  onChange: (value: number) => void;
};

/** Type for Phoenix menu "button" config. */
export type ConfigButton = ConfigLabel & {
  onClick: () => void;
};

/** Type for Phoenix menu "color" config. */
export type ConfigColor = ConfigLabel & {
  color: string;
  onChange: (value: string) => void;
};

/** Type for Phoenix menu "rangeSlider" config. */
export type ConfigRangeSlider = ConfigLabel & {
  value: number;
  highValue: number;
  min: number;
  max: number;
  step: number;
  onChange: (valueRange: { value: number; highValue: number }) => void;
};

/** Type for Phoenix menu "select" config. */
export type ConfigSelect = ConfigLabel & {
  options: string[];
  onChange: (selectedOption: string) => void;
};
