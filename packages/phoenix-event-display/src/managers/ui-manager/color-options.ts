import { Color } from 'three';
import { PrettySymbols } from '../../helpers/pretty-symbols';
import { ColorManager } from '../three-manager/color-manager';
import { PhoenixMenuNode } from './phoenix-menu/phoenix-menu-node';
import {
  type ConfigColor,
  type ConfigSelect,
} from './phoenix-menu/config-types';

/** Keys for options available for coloring event data by. */
export enum ColorByOptionKeys {
  COLLECTION = 'collection',
  CHARGE = 'charge',
  MOM = 'mom',
  VERTEX = 'vertex',
}

/** Type for a single color by option. */
type ColorByOption = {
  key: ColorByOptionKeys;
  name: string;
  initialize?: () => void;
  apply?: () => void;
};

/**
 * Color options with functions to color event data.
 */
export class ColorOptions {
  /** Collection name of the event data type. */
  private collectionName: string;
  /** Available options to color by in this instance of color options. */
  private colorByOptions: ColorByOption[];
  /** Currently selected option to color by. */
  private selectedColorByOption: ColorByOptionKeys;
  /** Phoenix menu node containing color configurations. */
  private colorOptionsFolder: PhoenixMenuNode;
  /** Configuration holding the single color of the whole collection. */
  private colorConfig: ConfigColor;
  /** Configuration holding the selected option to color by. */
  private colorByConfig?: ConfigSelect;

  /** All color by options possible. */
  private allColorByOptions: ColorByOption[] = [
    {
      key: ColorByOptionKeys.COLLECTION,
      name: 'Collection color',
      apply: this.applyCollectionColor.bind(this),
    },
    {
      key: ColorByOptionKeys.CHARGE,
      name: 'Charge ' + PrettySymbols.getPrettySymbol('charge'),
      initialize: this.initChargeColorOptions.bind(this),
      apply: this.applyChargeColorOptions.bind(this),
    },
    {
      key: ColorByOptionKeys.MOM,
      name: 'Momentum ' + PrettySymbols.getPrettySymbol('mom'),
      initialize: this.initMomColorOptions.bind(this),
      apply: this.applyMomColorOptions.bind(this),
    },
    {
      key: ColorByOptionKeys.VERTEX,
      name: 'Vertex',
      apply: this.applyVertexColorOptions.bind(this),
    },
  ];

  // Charge options.
  /** Default values for colors for color by charge. */
  private chargeColors = {
    '-1': '#0000ff',
    '0': '#d3d3d3',
    '1': '#ff0000',
  };

  // Momentum options.
  /** Default values for colors and min/max for color by momentum. */
  private momColors: { [key: string]: { value: number; color: string } } = {
    min: {
      value: 0,
      color: '#0000ff',
    },
    max: {
      value: 50000,
      color: '#ff0000',
    },
  };

  /**
   * Create the color options.
   * @param colorManager Color manager for three.js functions related to coloring of objects.
   * @param collectionFolder Collection folder to add the color by options to.
   * @param collectionColor Initial collection color.
   * @param colorByOptionsToInclude Options to include for this collection to color event data by.
   */
  constructor(
    private colorManager: ColorManager,
    collectionFolder: PhoenixMenuNode,
    collectionColor: Color,
    colorByOptionsToInclude?: ColorByOptionKeys[],
  ) {
    this.collectionName = collectionFolder.name;
    this.colorOptionsFolder = collectionFolder.addChild(
      'Color Options',
      undefined,
      'color-options',
    );

    this.colorConfig = {
      type: 'color',
      label: 'Color',
      color: collectionColor
        ? `#${collectionColor?.getHexString()}`
        : undefined,
      onChange: (value) => {
        this.colorConfig.color = value;
        // Giving the collection a single color is itself a choice of how to
        // color it. Recording it keeps the menu honest, and stops the color
        // being overwritten by another option when the state is loaded back.
        this.selectColorByOption(ColorByOptionKeys.COLLECTION);
        this.colorManager.collectionColor(this.collectionName, value);
      },
    };
    this.colorOptionsFolder.addConfig(this.colorConfig);

    this.colorOptionsFolder.addConfig({
      type: 'button',
      label: 'Random',
      onClick: () =>
        this.colorManager.collectionColorRandom(
          this.collectionName,
          this.colorOptionsFolder,
        ),
    });

    // Check which color by options are to be included.

    if (
      colorByOptionsToInclude?.length &&
      colorByOptionsToInclude?.length > 0
    ) {
      // The collection color is always an option: without it there is no way
      // to go back to a single color, or to express one in a saved state.
      this.colorByOptions = this.allColorByOptions.filter(
        (colorByOption) =>
          colorByOption.key === ColorByOptionKeys.COLLECTION ||
          colorByOptionsToInclude.includes(colorByOption.key),
      );

      this.initColorByOptions();
      this.colorByOptions.forEach((colorByOption) =>
        colorByOption.initialize?.(),
      );
      this.onlySelectedColorByOption();
    }
  }

  /**
   * Initialize the color options.
   */
  private initColorByOptions() {
    this.selectedColorByOption = this.colorByOptions[0].key;

    // Configurations
    const colorByConfig: ConfigSelect = {
      type: 'select',
      label: 'Color by',
      options: this.colorByOptions.map((colorByOption) => colorByOption.name),
      onChange: (updatedColorByOption) => {
        const newColorByOption = this.colorByOptions.find(
          (colorByOption) => colorByOption.name === updatedColorByOption,
        );

        if (newColorByOption?.key) {
          this.selectedColorByOption = newColorByOption.key;
          colorByConfig.value = newColorByOption.name;
        }
        newColorByOption?.apply?.();

        this.onlySelectedColorByOption();
      },
    };

    this.colorByConfig = colorByConfig;
    this.colorOptionsFolder.addConfig(colorByConfig);

    // The value is set after the config has been added, as adding it would
    // otherwise apply the option and re-color a collection which is already
    // drawn correctly. It is set at all so that the selected option is always
    // part of the saved state, even if the user never changes it.
    colorByConfig.value = this.colorByOptions[0].name;
  }

  /**
   * Select an option to color by, without applying it. Used for choices which
   * are made through another config, such as picking a color for the whole
   * collection.
   * @param key Key of the option to select.
   */
  private selectColorByOption(key: ColorByOptionKeys) {
    const colorByOption = this.colorByOptions?.find(
      (option) => option.key === key,
    );
    if (!colorByOption) {
      // This collection has no color by options, so there is nothing to select.
      return;
    }

    this.selectedColorByOption = colorByOption.key;
    if (this.colorByConfig) {
      this.colorByConfig.value = colorByOption.name;
    }
    this.onlySelectedColorByOption();
  }

  // Collection color options.

  /**
   * Apply the single color of the whole collection.
   */
  private applyCollectionColor() {
    if (this.colorConfig.color === undefined) {
      return;
    }

    this.colorManager.collectionColor(
      this.collectionName,
      this.colorConfig.color,
    );
  }

  // Charge options.

  /**
   * Initialize charge color options.
   */
  private initChargeColorOptions() {
    // Charge configurations
    [-1, 0, 1].forEach((chargeValue) => {
      const chargeValueIndex =
        chargeValue.toString() as keyof typeof this.chargeColors;
      this.colorOptionsFolder.addConfig({
        type: 'color',
        label: `${PrettySymbols.getPrettySymbol('charge')}=${chargeValue}`,
        group: ColorByOptionKeys.CHARGE,
        color: this.chargeColors[chargeValueIndex],
        onChange: (color) => {
          this.chargeColors[chargeValueIndex] = color;

          if (this.selectedColorByOption === ColorByOptionKeys.CHARGE) {
            this.colorManager.colorObjectsByProperty(
              color,
              this.collectionName,
              (objectUserData) =>
                this.shouldColorByCharge(objectUserData, chargeValue),
            );
          }
        },
      });
    });
  }

  /**
   * Apply charge color options.
   */
  private applyChargeColorOptions() {
    [-1, 0, 1].forEach((chargeValue) => {
      this.colorManager.colorObjectsByProperty(
        this.chargeColors[
          chargeValue.toString() as keyof typeof this.chargeColors
        ],
        this.collectionName,
        (objectUserData) =>
          this.shouldColorByCharge(objectUserData, chargeValue),
      );
    });
  }

  /**
   * Check if object should be colored based on charge value.
   * @param objectParams Object parameters associated to the 3D object.
   * @param chargeValue Value of charge (-1, 0, 1).
   * @returns Whether the charge is equal to the value.
   */
  private shouldColorByCharge(objectParams: any, chargeValue: number): boolean {
    // For ATLAS data, the charge is calculated from dparams[4] otherwise it exists as an object's userData
    if (Math.sign(1 / parseInt(objectParams?.dparams?.[4])) === chargeValue) {
      return true;
    } else if (objectParams?.charge === chargeValue) {
      return true;
    }
    return false;
  }

  // Momentum options.

  /**
   * Initialize momentum color options.
   */
  private initMomColorOptions() {
    // Momentum configurations
    Object.entries(this.momColors).forEach(([key, momValue]) => {
      this.colorOptionsFolder.addConfig({
        type: 'slider',
        label: PrettySymbols.getPrettySymbol('mom') + ' ' + key,
        group: ColorByOptionKeys.MOM,
        min: this.momColors.min.value,
        max: this.momColors.max.value,
        value: this.momColors[key].value,
        step: 10,
        allowCustomValue: true,
        onChange: (sliderValue) => {
          this.momColors[key].value = sliderValue;

          if (this.selectedColorByOption === ColorByOptionKeys.MOM) {
            this.colorByMomentum();
          }
        },
      });

      this.colorOptionsFolder.addConfig({
        type: 'color',
        label: PrettySymbols.getPrettySymbol('mom') + ' ' + key + ' color',
        group: ColorByOptionKeys.MOM,
        color: momValue.color,
        onChange: (color) => {
          this.momColors[key].color = color;

          if (this.selectedColorByOption === ColorByOptionKeys.MOM) {
            this.colorByMomentum();
          }
        },
      });
    });
  }

  /**
   * Apply momentum color options.
   */
  private applyMomColorOptions() {
    this.colorByMomentum();
  }

  /**
   * Color event data with a gradient based on the momentum property of each object.
   * Objects are colored by interpolating between the min and max colors according
   * to where their momentum lies in the min/max range (clamped at the ends).
   */
  private colorByMomentum() {
    const minColor = new Color(this.momColors.min.color);
    const maxColor = new Color(this.momColors.max.color);
    const range = this.momColors.max.value - this.momColors.min.value;

    this.colorManager.colorObjectsByComputedColor(
      this.collectionName,
      (objectParams) => {
        const mom = this.getMomentum(objectParams);
        if (mom === undefined || range <= 0) {
          return undefined;
        }

        const lerpFactor = Math.min(
          Math.max((mom - this.momColors.min.value) / range, 0),
          1,
        );
        return minColor.clone().lerp(maxColor, lerpFactor);
      },
    );
  }

  /**
   * Get momentum from object parameters.
   * @param objectParams Parameters associated to the 3D object.
   * @returns The momentum value.
   */
  private getMomentum(objectParams: any) {
    return objectParams?.dparams?.[4]
      ? Math.abs(1 / parseFloat(objectParams?.dparams?.[4]))
      : objectParams?.mom;
  }

  // Vertex options.

  /**
   * Apply color by vertex to tracks.
   */
  private applyVertexColorOptions() {
    const coloredTracks = this.colorManager.colorTracksByVertex(
      this.collectionName,
    );
    if (coloredTracks === 0) {
      console.warn(
        `No tracks in "${this.collectionName}" could be colored by vertex. ` +
          'This requires vertices with "linkedTracks" and "linkedTrackCollection" data.',
      );
    }
  }

  /**
   * Show configs of only the currently selected color by option.
   */
  private onlySelectedColorByOption() {
    this.colorOptionsFolder.configs.forEach((config) => {
      const groupNotSelected =
        config.group !== undefined &&
        config.group !== this.selectedColorByOption;

      config.hidden = groupNotSelected;
    });
  }
}
