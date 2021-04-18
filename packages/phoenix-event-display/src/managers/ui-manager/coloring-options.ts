import { PrettySymbols } from '../../helpers/pretty-symbols';
import { ThreeManager } from '../three-manager';
import { PhoenixMenuNode } from './phoenix-menu/phoenix-menu-node';

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
      value: 15 * Math.pow(10, 9),
      color: '#ff0000',
    },
  };
  let selectedColorByOption = colorByOptions.charge;

  // Helper functions
  const colorCharge = (objectParams: any, chargeValue: number) => {
    // For ATLAS data, the charge is calculated from dparams[4] otherwise it exists as an object's userData
    if (Math.sign(1 / parseInt(objectParams?.dparams?.[4])) === chargeValue) {
      return true;
    } else if (objectParams?.charge === chargeValue) {
      return true;
    }
  };

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
                undefined,
                undefined,
                (objectUserData) => colorCharge(objectUserData, chargeValue)
              );
          });
          break;
        case colorByOptions.mom:
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
            .colorObjectsByProperty(
              color,
              collectionName,
              undefined,
              undefined,
              (objectUserData) => colorCharge(objectUserData, chargeValue)
            );
        }
      },
    });
  });

  // Momentum configurations
  collectionFolder.addConfig('rangeSlider', {
    label: PrettySymbols.getPrettySymbol('mom') + ' color range',
    min: momColors.min.value,
    max: momColors.max.value,
    step: 10,
    value: momColors.min.value,
    highValue: momColors.max.value,
    onChange: ({ value, highValue }) => {
      momColors.min.value = value;
      momColors.max.value = highValue;
    },
  });

  Object.entries(momColors).forEach(([key, value]) => {
    collectionFolder.addConfig('color', {
      label: PrettySymbols.getPrettySymbol('mom') + ' ' + key,
      color: value.color,
      onChange: (color: any) => {
        value.color = color;
      },
    });
  });
};
