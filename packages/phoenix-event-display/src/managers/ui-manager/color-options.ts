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
  RANDOM = 'random',
  CHARGE = 'charge',
  MOM = 'mom',
  VERTEX = 'vertex',
}

/**
 * Type for the "Color by" select. It carries the seed of the random colors, so
 * that the seed is saved and restored with the rest of the menu state - the
 * seed has to be back in place before the select is applied, and every property
 * of a config is restored before that config is applied.
 */
type ConfigColorBySelect = ConfigSelect & { seed?: number };

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
  /** The single color the whole collection is drawn in. */
  private collectionColor?: string;
  /** Configuration holding the selected option to color by. */
  private colorByConfig: ConfigColorBySelect;

  /** All color by options possible. */
  private allColorByOptions: ColorByOption[] = [
    {
      key: ColorByOptionKeys.COLLECTION,
      name: 'Collection color',
      initialize: this.initCollectionColorOptions.bind(this),
      apply: this.applyCollectionColor.bind(this),
    },
    {
      key: ColorByOptionKeys.RANDOM,
      name: 'Random',
      initialize: this.initRandomColorOptions.bind(this),
      apply: this.applyRandomColorOptions.bind(this),
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

    this.collectionColor = collectionColor
      ? `#${collectionColor?.getHexString()}`
      : undefined;

    // Check which color by options are to be included. The collection color
    // and a random one need nothing of the event data, so every collection can
    // be colored by them: without the first there is no way back to a single
    // color, or to express one in a saved state. The collection color comes
    // first, as it is what a collection is drawn with to begin with.
    const alwaysIncluded = [
      ColorByOptionKeys.COLLECTION,
      ColorByOptionKeys.RANDOM,
    ];
    this.colorByOptions = this.allColorByOptions.filter(
      (colorByOption) =>
        alwaysIncluded.includes(colorByOption.key) ||
        colorByOptionsToInclude?.includes(colorByOption.key),
    );

    // The selector is added before the configs of any option, so that the
    // choice sits above the settings it governs.
    this.initColorByOptions();
    this.colorByOptions.forEach((colorByOption) =>
      colorByOption.initialize?.(),
    );
    this.onlySelectedColorByOption();
  }

  /**
   * Initialize the color options.
   */
  private initColorByOptions() {
    this.selectedColorByOption = this.colorByOptions[0].key;

    // Configurations
    const colorByConfig: ConfigColorBySelect = {
      type: 'select',
      label: 'Color by',
      seed: ColorOptions.newRandomSeed(),
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

  // Collection color options.

  /**
   * Initialize the options for coloring the whole collection in one color.
   */
  private initCollectionColorOptions() {
    this.colorConfig = {
      type: 'color',
      label: 'Color',
      group: ColorByOptionKeys.COLLECTION,
      color: this.collectionColor,
      onChange: (value) => {
        this.collectionColor = value;

        // A saved state applies every color it holds, including this one when
        // the collection is colored by something else - which would repaint
        // over that. The swatch is hidden unless it is the selected option, so
        // the user cannot reach it out of turn either.
        if (this.selectedColorByOption === ColorByOptionKeys.COLLECTION) {
          this.colorManager.collectionColor(this.collectionName, value);
        }
      },
    };
    this.colorOptionsFolder.addConfig(this.colorConfig);
  }

  /**
   * Apply the single color of the whole collection.
   */
  private applyCollectionColor() {
    if (this.collectionColor === undefined) {
      return;
    }

    this.colorManager.collectionColor(
      this.collectionName,
      this.collectionColor,
    );
  }

  // Random options.

  /**
   * Initialize random color options.
   */
  private initRandomColorOptions() {
    this.colorOptionsFolder.addConfig({
      type: 'button',
      label: 'Random',
      group: ColorByOptionKeys.RANDOM,
      onClick: () => {
        this.colorByConfig.seed = ColorOptions.newRandomSeed();
        this.applyRandomColorOptions();
      },
    });
  }

  /**
   * Apply random color options, giving each object of the collection its own
   * color so that objects drawn on top of each other can be told apart.
   */
  private applyRandomColorOptions() {
    // The objects of a collection are always built in the same order, so their
    // position in it identifies them well enough to color them from the seed.
    let objectIndex = 0;
    this.colorManager.colorObjectsByComputedColor(this.collectionName, () =>
      this.randomColor(objectIndex++),
    );
  }

  /**
   * Get a new seed for the random colors.
   * @returns A seed for the random colors.
   */
  private static newRandomSeed(): number {
    return Math.floor(Math.random() * 0xffffffff);
  }

  /**
   * Get the random color of an object from the seed and the object's position
   * in the collection, so that the same seed always gives the same colors and
   * a saved state is restored as it was.
   * @param objectIndex Position of the object in the collection.
   * @returns The color for the object.
   */
  private randomColor(objectIndex: number): Color {
    let hash = (this.colorByConfig.seed ?? 0) + objectIndex * 0x9e3779b1;
    hash = Math.imul(hash ^ (hash >>> 16), 0x21f0aaad);
    hash = Math.imul(hash ^ (hash >>> 15), 0x735a2d97);
    hash = (hash ^ (hash >>> 15)) >>> 0;

    // Picking a hue rather than a color keeps every object clearly visible and
    // clearly different, which coloring at random in RGB does not - that can
    // land on colors close to the background, or close to each other.
    return new Color().setHSL((hash % 360) / 360, 0.7, 0.55);
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
