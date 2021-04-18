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
    onChange: (updatedColorByOption: ColorByOptions) => {
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
};
