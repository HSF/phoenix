import { PrettySymbols } from '../../helpers/pretty-symbols';
import { ColoringManager } from '../three-manager/coloring-manager';
import { PhoenixMenuNode } from './phoenix-menu/phoenix-menu-node';

export enum ColorByOptionKeys {
  CHARGE = 'charge',
  MOM = 'mom',
}

type ColorByOption = {
  key: ColorByOptionKeys;
  name: string;
  initialize: () => void;
  apply: () => void;
};

/**
 * Color options with functions to color event data.
 */
export class ColorOptions {
  private collectionName: string;
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
  ];
  private colorByOptions: ColorByOption[];
  private selectedColorByOption: ColorByOptionKeys;

  // Charge options.
  private chargeColors = {
    '-1': '#ff0000',
    '0': '#ff0000',
    '1': '#ff0000',
  };

  // Momentum options.
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
   * @param coloringManager Coloring manager for three.js functions related to coloring of objects.
   */
  constructor(
    private coloringManager: ColoringManager,
    private collectionFolder: PhoenixMenuNode,
    colorByOptionsToInclude: ColorByOptionKeys[]
  ) {
    this.collectionName = collectionFolder.name;

    this.colorByOptions = this.allColorByOptions.filter((colorByOption) =>
      colorByOptionsToInclude.includes(colorByOption.key)
    );

    if (this.colorByOptions?.length > 0) {
      this.init();
      this.colorByOptions.forEach((colorByOption) =>
        colorByOption.initialize()
      );
    }
  }

  private init() {
    this.selectedColorByOption = this.colorByOptions[0].key;

    // Configurations
    this.collectionFolder.addConfig('label', {
      label: 'Color options',
    });

    this.collectionFolder.addConfig('select', {
      label: 'Color by',
      options: this.colorByOptions.map((colorByOption) => colorByOption.name),
      onChange: (updatedColorByOption: string) => {
        const newColorByOption = this.colorByOptions.find(
          (colorByOption) => colorByOption.name === updatedColorByOption
        );

        this.selectedColorByOption = newColorByOption?.key;
        newColorByOption?.apply();
      },
    });
  }

  // Charge options.

  private initChargeColorOptions() {
    // Charge configurations
    [-1, 0, 1].forEach((chargeValue) => {
      this.collectionFolder.addConfig('color', {
        label: `${PrettySymbols.getPrettySymbol('charge')}=${chargeValue}`,
        color: this.chargeColors[chargeValue],
        onChange: (color: any) => {
          this.chargeColors[chargeValue] = color;

          if (this.selectedColorByOption === ColorByOptionKeys.CHARGE) {
            this.coloringManager.colorObjectsByProperty(
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

  private applyChargeColorOptions() {
    [-1, 0, 1].forEach((chargeValue) => {
      this.coloringManager.colorObjectsByProperty(
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

  private initMomColorOptions() {
    // Momentum configurations
    Object.entries(this.momColors).forEach(([key, momValue]) => {
      this.collectionFolder.addConfig('slider', {
        label: PrettySymbols.getPrettySymbol('mom') + ' ' + key,
        min: this.momColors.min.value,
        max: this.momColors.max.value,
        value: this.momColors[key].value,
        step: 10,
        allowCustomValue: true,
        onChange: (sliderValue: number) => {
          this.momColors[key].value = sliderValue;

          if (this.selectedColorByOption === ColorByOptionKeys.MOM) {
            this.colorByMomentum('min');
            this.colorByMomentum('max');
          }
        },
      });

      this.collectionFolder.addConfig('color', {
        label: PrettySymbols.getPrettySymbol('mom') + ' ' + key + ' color',
        color: momValue.color,
        onChange: (color: any) => {
          this.momColors[key].color = color;

          if (this.selectedColorByOption === ColorByOptionKeys.MOM) {
            this.colorByMomentum(key);
          }
        },
      });
    });
  }

  private applyMomColorOptions() {
    this.colorByMomentum('min');
    this.colorByMomentum('max');
  }

  private colorByMomentum(minOrMax: string) {
    this.coloringManager.colorObjectsByProperty(
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
}
