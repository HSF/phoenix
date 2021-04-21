import { PrettySymbols } from '../../helpers/pretty-symbols';
import { ThreeManager } from '../three-manager';
import { PhoenixMenuNode } from './phoenix-menu/phoenix-menu-node';

// Helper functions

/**
 * Color charge based on charge value.
 * @param objectParams Object parameters associated to the 3D object.
 * @param chargeValue Value of charge (-1, 0, 1).
 * @returns Whether the charge is equal to the value.
 */
const colorCharge = (objectParams: any, chargeValue: number) => {
  // For ATLAS data, the charge is calculated from dparams[4] otherwise it exists as an object's userData
  if (Math.sign(1 / parseInt(objectParams?.dparams?.[4])) === chargeValue) {
    return true;
  } else if (objectParams?.charge === chargeValue) {
    return true;
  }
};

/**
 * Get momentum from object parameters.
 * @param objectParams Parameters associated to the 3D object.
 * @returns THe momentum value.
 */
const getMomentum = (objectParams: any) =>
  objectParams?.dparams?.[4]
    ? Math.abs(1 / parseFloat(objectParams?.dparams?.[4]))
    : objectParams?.mom;

/**
 * Function to add coloring options to tracks.
 * @param threeManager Three manager for three.js operations.
 * @param collectionFolder Phoenix menu node of the collection to add the color options to.
 */
export const tracksColoringOptions = (
  threeManager: ThreeManager,
  collectionFolder: PhoenixMenuNode
) => {
  // Variables
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

  const momMidValue = (min: number, max: number) =>
    (momColors.min.value + momColors.max.value) / 2;

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
            threeManager
              .getColoringManager()
              .colorObjectsByProperty(
                chargeColors[chargeValue],
                collectionName,
                (objectUserData) => colorCharge(objectUserData, chargeValue)
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
          threeManager
            .getColoringManager()
            .colorObjectsByProperty(color, collectionName, (objectUserData) =>
              colorCharge(objectUserData, chargeValue)
            );
        }
      },
    });
  });

  // Momentum helper functions
  const colorByMomentum = (minOrMax: string, color: any) => {
    threeManager
      .getColoringManager()
      .colorObjectsByProperty(color, 'Tracks', (objectParams) => {
        const mom = getMomentum(objectParams);
        const mid = momMidValue(momColors.min.value, momColors.max.value);

        if (minOrMax === 'max' && mom > mid && mom < momColors.max.value) {
          return true;
        } else if (
          minOrMax === 'min' &&
          mom < mid &&
          mom > momColors.min.value
        ) {
          return true;
        }
      });
  };

  // Momentum configurations
  collectionFolder.addConfig('slider', {
    label: PrettySymbols.getPrettySymbol('mom') + ' min',
    min: momColors.min.value,
    max: momColors.max.value,
    value: momColors.min.value,
    step: 10,
    allowCustomValue: true,
    onChange: (value: number) => {
      momColors.min.value = value;
      if (selectedColorByOption === colorByOptions.mom) {
        colorByMomentum('min', momColors.min.color);
        colorByMomentum('max', momColors.max.color);
      }
    },
  });
  collectionFolder.addConfig('slider', {
    label: PrettySymbols.getPrettySymbol('mom') + ' max',
    min: momColors.min.value,
    max: momColors.max.value,
    value: momColors.max.value,
    step: 10,
    allowCustomValue: true,
    onChange: (value: number) => {
      momColors.max.value = value;
      if (selectedColorByOption === colorByOptions.mom) {
        colorByMomentum('min', momColors.min.color);
        colorByMomentum('max', momColors.max.color);
      }
    },
  });

  Object.entries(momColors).forEach(([key, value]) => {
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
};
