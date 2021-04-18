import { GUI } from 'dat.gui';
import { PrettySymbols } from '../../helpers/pretty-symbols';
import { ThreeManager } from '../three-manager';
import { PhoenixMenuNode } from './phoenix-menu/phoenix-menu-node';

/**
 * Function to add coloring options to tracks.
 * @param threeManager Three manager for three.js operations.
 * @returns Function to add configuration options for tracks coloring.
 */
export const tracksColoringOptions = (threeManager: ThreeManager) => (
  eventTypeFolder: GUI,
  eventTypeFolderPM: PhoenixMenuNode
) => {
  if (eventTypeFolder) {
  }

  if (eventTypeFolderPM) {
    eventTypeFolderPM.addConfig('label', {
      label: 'Color by ' + PrettySymbols.getPrettySymbol('charge'),
    });

    const colorCharge = (objectParams: any, chargeValue: number) => {
      if (Math.sign(1 / parseInt(objectParams?.dparams?.[4])) === chargeValue) {
        return true;
      } else if (objectParams?.charge === chargeValue) {
        return true;
      }
    };

    [-1, 0, 1].forEach((chargeValue) => {
      eventTypeFolderPM.addConfig('color', {
        label: `${PrettySymbols.getPrettySymbol('charge')}=${chargeValue}`,
        onChange: (color: any) => {
          threeManager
            .getColoringManager()
            .colorObjectsByProperty(
              color,
              'Tracks',
              undefined,
              undefined,
              (objectUserData) => colorCharge(objectUserData, chargeValue)
            );
        },
      });
    });
  }
};
