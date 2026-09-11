import { Color } from 'three';
import { ColorOptions } from '../../../managers/ui-manager/color-options';
import { ColorManager } from '../../../managers/three-manager/color-manager';
import { PhoenixMenuNode } from '../../../managers/ui-manager/phoenix-menu/phoenix-menu-node';

describe('ColorOptions', () => {
  let colorManager: ColorManager;
  let collectionFolder: PhoenixMenuNode;

  beforeEach(() => {
    colorManager = {
      collectionColor: jest.fn(),
      collectionColorRandom: jest.fn(),
      colorObjectsByProperty: jest.fn(),
      colorObjectsByComputedColor: jest.fn(),
      colorTracksByVertex: jest.fn().mockReturnValue(1),
    } as unknown as ColorManager;

    collectionFolder = new PhoenixMenuNode('CombinedMuonTracks');
  });

  it('should show the color the collection was built with', () => {
    new ColorOptions(colorManager, collectionFolder, new Color(0xff0000));

    const colorConfig = collectionFolder
      .findInTree('Color Options')
      ?.configs.find((config) => config.label === 'Color');

    expect(colorConfig?.['color']).toBe('#ff0000');
  });

  it('should not color the collection when the options are created', () => {
    // The collection is already drawn in this color, so re-applying it would
    // only risk overriding it with a stale value.
    new ColorOptions(colorManager, collectionFolder, new Color(0xff0000));

    expect(colorManager.collectionColor).not.toHaveBeenCalled();
  });

  it('should color the collection with the color restored from a saved state', () => {
    // This is what happens on the ATLAS demo: the saved state holds a color
    // which used to be shown in the menu without ever reaching the scene.
    new ColorOptions(colorManager, collectionFolder, new Color(0xff0000));

    const state = collectionFolder.getNodeState();
    const colorOptionsState = state['children'].find(
      (child: any) => child.name === 'Color Options',
    );
    colorOptionsState.configs.find(
      (config: any) => config.label === 'Color',
    ).color = '#0adb2d';

    collectionFolder.loadStateFromJSON(state);

    expect(colorManager.collectionColor).toHaveBeenCalledWith(
      'CombinedMuonTracks',
      '#0adb2d',
    );
  });
});
