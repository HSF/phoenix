import { Color } from 'three';
import { PrettySymbols } from '../../helpers/pretty-symbols';
import { ColorManager } from '../three-manager/color-manager';
import { PhoenixMenuNode } from './phoenix-menu/phoenix-menu-node';

/** Keys for options available for coloring event data by. */
export enum ColorByOptionKeys {
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

  /** All color by options possible. */
  private allColorByOptions: ColorByOption[] = [
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
    '-1': '#ff0000',
    '0': '#ff0000',
    '1': '#ff0000',
  };

  // Momentum options.
  /** Default values for colors and min/max for color by momentum. */
  private momColors = {
    min: {
      value: 0,
      color: '#ff0000',
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
   * @param colorByOptionsToInclude Options to include for this collection to color event data by.
   */
  constructor(
    private colorManager: ColorManager,
    collectionFolder: PhoenixMenuNode,
    collectionColor: Color,
    colorByOptionsToInclude?: ColorByOptionKeys[]
  ) {
    this.collectionName = collectionFolder.name;
    this.colorOptionsFolder = collectionFolder.addChild('Color Options');

    this.colorOptionsFolder.addConfig('color', {
      label: 'Color',
      color: collectionColor
        ? `#${collectionColor?.getHexString()}`
        : undefined,
      onChange: (value) =>
        this.colorManager.collectionColor(this.collectionName, value),
    });

    this.colorOptionsFolder.addConfig('button', {
      label: 'Random',
      onClick: () =>
        this.colorManager.collectionColorRandom(this.collectionName),
    });

    // Check which color by options are to be included.

    if (colorByOptionsToInclude?.length > 0) {
      this.colorByOptions = this.allColorByOptions.filter((colorByOption) =>
        colorByOptionsToInclude.includes(colorByOption.key)
      );

      this.initColorByOptions();
      this.colorByOptions.forEach((colorByOption) =>
        colorByOption.initialize?.()
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

    this.colorOptionsFolder.addConfig('select', {
      label: 'Color by',
      options: this.colorByOptions.map((colorByOption) => colorByOption.name),
      onChange: (updatedColorByOption) => {
        const newColorByOption = this.colorByOptions.find(
          (colorByOption) => colorByOption.name === updatedColorByOption
        );

        this.selectedColorByOption = newColorByOption?.key;
        newColorByOption?.apply?.();

        this.onlySelectedColorByOption();
      },
    });
  }

  // Charge options.

  /**
   * Initialize charge color options.
   */
  private initChargeColorOptions() {
    // Charge configurations
    [-1, 0, 1].forEach((chargeValue) => {
      this.colorOptionsFolder.addConfig('color', {
        label: `${PrettySymbols.getPrettySymbol('charge')}=${chargeValue}`,
        group: ColorByOptionKeys.CHARGE,
        color: this.chargeColors[chargeValue],
        onChange: (color) => {
          this.chargeColors[chargeValue] = color;

          if (this.selectedColorByOption === ColorByOptionKeys.CHARGE) {
            this.colorManager.colorObjectsByProperty(
              color,
              this.collectionName,
              (objectUserData) =>
                this.shouldColorByCharge(objectUserData, chargeValue)
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
        this.chargeColors[chargeValue],
        this.collectionName,
        (objectUserData) =>
          this.shouldColorByCharge(objectUserData, chargeValue)
      );
    });
  }

  /**
   * Check if object should be colored based on charge value.
   * @param objectParams Object parameters associated to the 3D object.
   * @param chargeValue Value of charge (-1, 0, 1).
   * @returns Whether the charge is equal to the value.
   */
  private shouldColorByCharge(objectParams: any, chargeValue: number) {
    // For ATLAS data, the charge is calculated from dparams[4] otherwise it exists as an object's userData
    if (Math.sign(1 / parseInt(objectParams?.dparams?.[4])) === chargeValue) {
      return true;
    } else if (objectParams?.charge === chargeValue) {
      return true;
    }
  }

  // Momentum options.

  /**
   * Initialize momentum color options.
   */
  private initMomColorOptions() {
    // Momentum configurations
    Object.entries(this.momColors).forEach(([key, momValue]) => {
      this.colorOptionsFolder.addConfig('slider', {
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
            this.colorByMomentum('min');
            this.colorByMomentum('max');
          }
        },
      });

      this.colorOptionsFolder.addConfig('color', {
        label: PrettySymbols.getPrettySymbol('mom') + ' ' + key + ' color',
        group: ColorByOptionKeys.MOM,
        color: momValue.color,
        onChange: (color) => {
          this.momColors[key].color = color;

          if (this.selectedColorByOption === ColorByOptionKeys.MOM) {
            this.colorByMomentum(key);
          }
        },
      });
    });
  }

  /**
   * Apply momentum color options.
   */
  private applyMomColorOptions() {
    this.colorByMomentum('min');
    this.colorByMomentum('max');
  }

  /**
   * Color event data based on the momentum property of each object.
   * @param minOrMax If the momentum to color objects by is minimum or maximum momentum.
   * This is to apply the stored momentum colors for minimum and maximum separated at the mid value.
   */
  private colorByMomentum(minOrMax: string) {
    this.colorManager.colorObjectsByProperty(
      this.momColors[minOrMax].color,
      this.collectionName,
      (objectParams) => {
        const mom = this.getMomentum(objectParams);
        const mid = (this.momColors.min.value + this.momColors.max.value) / 2;

        if (minOrMax === 'max' && mom > mid && mom < this.momColors.max.value) {
          return true;
        } else if (
          minOrMax === 'min' &&
          mom < mid &&
          mom > this.momColors.min.value
        ) {
          return true;
        }
      }
    );
  }

  /**
   * Get momentum from object parameters.
   * @param objectParams Parameters associated to the 3D object.
   * @returns THe momentum value.
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
    this.colorManager.colorTracksByVertex(this.collectionName);
  }

  /**
   * Show configs of only the currently selected color by option.
   */
  private onlySelectedColorByOption() {
    this.colorOptionsFolder.configs.forEach((config) => {
      const groupNotSelected =
        config.group !== undefined &&
        config.group !== this.selectedColorByOption;

      config.hidden = groupNotSelected ? true : false;
    });
  }
}
