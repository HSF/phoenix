import { PrettySymbols } from '../../helpers/pretty-symbols';
import { ColoringManager } from '../three-manager/coloring-manager';
import { PhoenixMenuNode } from './phoenix-menu/phoenix-menu-node';

/**
 * Color options with functions to color event data.
 */
export class ColorOptions {
  /**
   * Create the color options.
   * @param coloringManager Coloring manager for three.js functions related to coloring of objects.
   */
  constructor(private coloringManager: ColoringManager) {}

  /**
   * Add color options for tracks.
   * @param collectionFolder Phoenix menu node of a collection.
   */
  public trackColorOptions(collectionFolder: PhoenixMenuNode) {
    const collectionName = collectionFolder.name;

    const colorByOptions = {
      charge: 'Charge ' + PrettySymbols.getPrettySymbol('charge'),
      mom: 'Momentum ' + PrettySymbols.getPrettySymbol('charge'),
    };

    const chargeColors = {
      '-1': '#ff0000',
      '0': '#ff0000',
      '1': '#ff0000',
    };

    const momColors = {
      min: {
        value: 0,
        color: '#ff0000',
      },
      max: {
        value: 50000,
        color: '#ff0000',
      },
    };

    const momMidValue = () => (momColors.min.value + momColors.max.value) / 2;

    let selectedColorByOption = colorByOptions.charge;

    // Configurations
    collectionFolder.addConfig('label', {
      label: 'Color options',
    });

    collectionFolder.addConfig('select', {
      label: 'Color by',
      options: Object.values(colorByOptions),
      onChange: (updatedColorByOption: string) => {
        selectedColorByOption = updatedColorByOption;

        switch (updatedColorByOption) {
          case colorByOptions.charge:
            [-1, 0, 1].forEach((chargeValue) => {
              this.coloringManager.colorObjectsByProperty(
                chargeColors[chargeValue],
                collectionName,
                (objectUserData) =>
                  this.shouldColorByCharge(objectUserData, chargeValue)
              );
            });
            break;
          case colorByOptions.mom:
            colorByMomentum('min', momColors.min.color);
            colorByMomentum('max', momColors.max.color);
            break;
        }
      },
    });

    // Charge configurations
    [-1, 0, 1].forEach((chargeValue) => {
      collectionFolder.addConfig('color', {
        label: `${PrettySymbols.getPrettySymbol('charge')}=${chargeValue}`,
        color: chargeColors[chargeValue],
        onChange: (color: any) => {
          chargeColors[chargeValue] = color;

          if (selectedColorByOption === colorByOptions.charge) {
            this.coloringManager.colorObjectsByProperty(
              color,
              collectionName,
              (objectUserData) =>
                this.shouldColorByCharge(objectUserData, chargeValue)
            );
          }
        },
      });
    });

    // Momentum helper functions
    const colorByMomentum = (minOrMax: string, color: any) => {
      this.coloringManager.colorObjectsByProperty(
        color,
        'Tracks',
        (objectParams) => {
          const mom = this.getMomentum(objectParams);
          const mid = momMidValue();

          if (minOrMax === 'max' && mom > mid && mom < momColors.max.value) {
            return true;
          } else if (
            minOrMax === 'min' &&
            mom < mid &&
            mom > momColors.min.value
          ) {
            return true;
          }
        }
      );
    };

    // Momentum configurations
    Object.entries(momColors).forEach(([key, value]) => {
      collectionFolder.addConfig('slider', {
        label: PrettySymbols.getPrettySymbol('mom') + ' ' + key,
        min: momColors.min.value,
        max: momColors.max.value,
        value: momColors[key].value,
        step: 10,
        allowCustomValue: true,
        onChange: (value: number) => {
          momColors[key].value = value;
          if (selectedColorByOption === colorByOptions.mom) {
            colorByMomentum('min', momColors.min.color);
            colorByMomentum('max', momColors.max.color);
          }
        },
      });

      collectionFolder.addConfig('color', {
        label: PrettySymbols.getPrettySymbol('mom') + ' ' + key + ' color',
        color: value.color,
        onChange: (color: any) => {
          value.color = color;

          if (selectedColorByOption === colorByOptions.mom) {
            colorByMomentum(key, color);
          }
        },
      });
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
