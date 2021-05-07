/** Type for Phoenix menu node "label" config. */
export type ConfigLabel = {
  type: keyof PhoenixMenuConfigs;
  label: string;
};

/** Type for Phoenix menu node "checkbox" config. */
export type ConfigCheckbox = ConfigLabel & {
  isChecked: boolean;
  onChange: (value: boolean) => void;
};

/** Type for Phoenix menu node "slider" config. */
export type ConfigSlider = ConfigLabel & {
  value: number;
  min: number;
  max: number;
  step: number;
  allowCustomValue: boolean;
  onChange: (value: number) => void;
};

/** Type for Phoenix menu node "button" config. */
export type ConfigButton = ConfigLabel & {
  onClick: () => void;
};

/** Type for Phoenix menu node "color" config. */
export type ConfigColor = ConfigLabel & {
  color: string;
  onChange: (value: string) => void;
};

/** Type for Phoenix menu node "rangeSlider" config. */
export type ConfigRangeSlider = ConfigLabel & {
  value: number;
  highValue: number;
  min: number;
  max: number;
  step: number;
  onChange: (valueRange: { value: number; highValue: number }) => void;
};

/** Type for Phoenix menu node "select" config. */
export type ConfigSelect = ConfigLabel & {
  options: string[];
  onChange: (selectedOption: string) => void;
};

/** Type for all Phoenix menu mode configuration options. */
export type PhoenixMenuConfigs = {
  label: Partial<ConfigLabel>;
  checkbox: Partial<ConfigCheckbox>;
  slider: Partial<ConfigSlider>;
  button: Partial<ConfigButton>;
  color: Partial<ConfigColor>;
  rangeSlider: Partial<ConfigRangeSlider>;
  select: Partial<ConfigSelect>;
};

/** Type for a single Phoenix menu config option. */
export type PhoenixMenuConfig = PhoenixMenuConfigs[keyof PhoenixMenuConfigs];
