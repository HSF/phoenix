/** Type for Phoenix menu node "label" config. */
export type ConfigLabel = {
  type: keyof PhoenixMenuConfigs;
  label: string;
  group?: string;
  hidden?: boolean;
};

/** Type for Phoenix menu node "checkbox" config. */
export type ConfigCheckbox = ConfigLabel & {
  isChecked?: boolean;
  onChange: (value: boolean) => void;
};

/** Type for Phoenix menu node "slider" config. */
export type ConfigSlider = ConfigLabel & {
  value?: number;
  min: number;
  max: number;
  step?: number;
  allowCustomValue?: boolean;
  onChange: (value: number) => void;
};

/** Type for Phoenix menu node "button" config. */
export type ConfigButton = ConfigLabel & {
  onClick: () => void;
};

/** Type for Phoenix menu node "color" config. */
export type ConfigColor = ConfigLabel & {
  color?: string;
  onChange: (value: string) => void;
};

/** Type for Phoenix menu node "rangeSlider" config. */
export type ConfigRangeSlider = ConfigLabel & {
  value?: number; //Bottom of cut range
  highValue?: number; //Top of cut range
  min: number; // Minimum value possible for slider
  max: number; // Maximum value possible for slider
  step: number;
  enableMin: boolean; // Do we use value when cutting (i.e. open-ended range or not?)
  enableMax: boolean; // Do we use highValue when cutting (i.e. open-ended range or not?)
  onChange: (valueRange: { value: number; highValue: number }) => void;
  setEnableMin: (checked: boolean) => void;
  setEnableMax: (checked: boolean) => void;
};

/** Type for Phoenix menu node "select" config. */
export type ConfigSelect = ConfigLabel & {
  options: string[];
  onChange: (selectedOption: string) => void;
};

/** Type for all Phoenix menu mode configuration options. */
export type PhoenixMenuConfigs = {
  label: ConfigLabel;
  checkbox: ConfigCheckbox;
  slider: ConfigSlider;
  button: ConfigButton;
  color: ConfigColor;
  rangeSlider: ConfigRangeSlider;
  select: ConfigSelect;
};
