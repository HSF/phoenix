import { Color } from 'three';
import {
  ColorByOptionKeys,
  ColorOptions,
} from '../../../managers/ui-manager/color-options';
import { ColorManager } from '../../../managers/three-manager/color-manager';
import { PhoenixMenuNode } from '../../../managers/ui-manager/phoenix-menu/phoenix-menu-node';

/** The color by options a track collection is created with. */
const TRACK_COLOR_BY_OPTIONS = [
  ColorByOptionKeys.CHARGE,
  ColorByOptionKeys.MOM,
  ColorByOptionKeys.VERTEX,
];

describe('ColorOptions', () => {
  let colorManager: ColorManager;
  let collectionFolder: PhoenixMenuNode;

  /** Get a config of the collection's "Color Options" node by label. */
  const getConfig = (label: string) =>
    collectionFolder
      .findInTree('Color Options')
      ?.configs.find((config) => config.label === label);

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

    expect(getConfig('Color')?.['color']).toBe('#ff0000');
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

  describe('color by', () => {
    /** Create color options for a track collection colored `color`. */
    const createTrackColorOptions = (color = 0xff8000) =>
      new ColorOptions(
        colorManager,
        collectionFolder,
        new Color(color),
        TRACK_COLOR_BY_OPTIONS,
      );

    /** Select an option to color by, as the menu does. */
    const selectColorBy = (option: string) =>
      (getConfig('Color by') as any).onChange(option);

    /**
     * Save the state of the collection the way the state manager does, through
     * JSON, so that loading it back cannot be affected by the live configs.
     */
    const saveState = () =>
      JSON.parse(JSON.stringify(collectionFolder.getNodeState()));

    it('should offer the collection color as the option selected to begin with', () => {
      createTrackColorOptions();

      const colorByConfig = getConfig('Color by');

      expect(colorByConfig?.['options'][0]).toBe('Collection color');
      expect(colorByConfig?.['value']).toBe('Collection color');
    });

    it('should not color the collection when the options are created', () => {
      createTrackColorOptions();

      expect(colorManager.collectionColor).not.toHaveBeenCalled();
      expect(colorManager.colorObjectsByProperty).not.toHaveBeenCalled();
    });

    it('should put the selector above the configs of the selected option', () => {
      createTrackColorOptions();

      const configs = collectionFolder.findInTree('Color Options')?.configs;

      expect(configs?.[0].label).toBe('Color by');
      expect(
        configs
          ?.filter((config) => !config.hidden)
          .map((config) => config.label),
      ).toEqual(['Color by', 'Color']);
    });

    it('should hide the collection color when coloring by something else', () => {
      createTrackColorOptions();
      selectColorBy('Charge q');

      expect(getConfig('Color')?.hidden).toBe(true);
      expect(
        collectionFolder
          .findInTree('Color Options')
          ?.configs.filter((config) => !config.hidden)
          .map((config) => config.label),
      ).toEqual(['Color by', 'q=-1', 'q=0', 'q=1']);
    });

    it('should not repaint the collection while coloring by something else', () => {
      // A saved state applies every color it holds, this one included, and the
      // selector is restored before it.
      createTrackColorOptions();
      selectColorBy('Charge q');
      jest.clearAllMocks();

      (getConfig('Color') as any).onChange('#0adb2d');

      expect(colorManager.collectionColor).not.toHaveBeenCalled();
      expect(getConfig('Color by')?.['value']).toBe('Charge q');
    });

    it('should go back to the collection color when it is selected again', () => {
      createTrackColorOptions();
      selectColorBy('Charge q');
      selectColorBy('Collection color');

      expect(colorManager.collectionColor).toHaveBeenLastCalledWith(
        'CombinedMuonTracks',
        '#ff8000',
      );
    });

    it('should keep the collection color over a save and load', () => {
      createTrackColorOptions();
      (getConfig('Color') as any).onChange('#0adb2d');

      const state = saveState();
      jest.clearAllMocks();
      collectionFolder.loadStateFromJSON(state);

      // The charge colors are still in the state, but they are not the way
      // this collection is colored, so they must not be applied.
      expect(colorManager.collectionColor).toHaveBeenCalledWith(
        'CombinedMuonTracks',
        '#0adb2d',
      );
      expect(colorManager.colorObjectsByProperty).not.toHaveBeenCalled();
    });

    it('should keep the color by option over a save and load', () => {
      createTrackColorOptions();
      selectColorBy('Charge q');

      const state = saveState();
      jest.clearAllMocks();
      collectionFolder.loadStateFromJSON(state);

      expect(getConfig('Color by')?.['value']).toBe('Charge q');
      expect(colorManager.colorObjectsByProperty).toHaveBeenCalled();
    });

    it('should use the collection color of a state saved without one selected', () => {
      // States saved before there was an option for the collection color hold
      // the color of the collection, but no option to color by.
      createTrackColorOptions();

      const state = saveState();
      const colorOptionsState = state['children'].find(
        (child: any) => child.name === 'Color Options',
      );
      colorOptionsState.configs.find(
        (config: any) => config.label === 'Color',
      ).color = '#0adb2d';
      delete colorOptionsState.configs.find(
        (config: any) => config.label === 'Color by',
      ).value;

      collectionFolder.loadStateFromJSON(state);

      expect(colorManager.collectionColor).toHaveBeenCalledWith(
        'CombinedMuonTracks',
        '#0adb2d',
      );
      expect(colorManager.colorObjectsByProperty).not.toHaveBeenCalled();
    });

    it('should offer the collection color and a random one to any collection', () => {
      // Neither needs anything of the event data, so a collection with no
      // other option - hits, jets - can still be colored by them.
      new ColorOptions(colorManager, collectionFolder, new Color(0xff8000));

      expect(getConfig('Color by')?.['options']).toEqual([
        'Collection color',
        'Random',
      ]);
    });

    it('should give each object its own color when coloring at random', () => {
      createTrackColorOptions();
      selectColorBy('Random');

      expect(colorManager.colorObjectsByComputedColor).toHaveBeenCalled();
      expect(
        collectionFolder
          .findInTree('Color Options')
          ?.configs.filter((config) => !config.hidden)
          .map((config) => config.label),
      ).toEqual(['Color by', 'Random']);
    });

    /** Color the first few objects of the collection at random. */
    const randomColors = () => {
      (colorManager.colorObjectsByComputedColor as jest.Mock).mockClear();
      selectColorBy('Random');
      const getColor = (colorManager.colorObjectsByComputedColor as jest.Mock)
        .mock.calls[0][1];
      return [0, 1, 2, 3].map(() => getColor({}).getHexString());
    };

    it('should give every object a different random color', () => {
      createTrackColorOptions();

      const colors = randomColors();

      expect(new Set(colors).size).toBe(colors.length);
    });

    it('should give new random colors only when they are asked for', () => {
      createTrackColorOptions();

      const colors = randomColors();
      expect(randomColors()).toEqual(colors);

      (getConfig('Random') as any).onClick();
      expect(randomColors()).not.toEqual(colors);
    });

    it('should keep a random coloring over a save and load', () => {
      createTrackColorOptions();
      const colors = randomColors();

      const state = saveState();
      collectionFolder = new PhoenixMenuNode('CombinedMuonTracks');
      createTrackColorOptions();
      collectionFolder.loadStateFromJSON(state);

      expect(randomColors()).toEqual(colors);
    });

    it('should only show the configs of the selected option after a load', () => {
      createTrackColorOptions();
      selectColorBy('Charge q');
      const state = saveState();

      // Whether a config is hidden is derived from the selected option, so a
      // state saved with another one selected must not bring its own back.
      selectColorBy('Collection color');
      collectionFolder.loadStateFromJSON(state);

      expect(getConfig('q=1')?.hidden).toBe(false);
      expect(getConfig('|p| min')?.hidden).toBe(true);
    });

    it('should group its configs itself rather than take the grouping from a state', () => {
      // States saved before the collection color and the random one were
      // options hold a "Color" and a "Random" which belonged to no group.
      createTrackColorOptions();

      const state = saveState();
      const colorOptionsState = state['children'].find(
        (child: any) => child.name === 'Color Options',
      );
      for (const label of ['Color', 'Random']) {
        delete colorOptionsState.configs.find(
          (config: any) => config.label === label,
        ).group;
      }
      delete colorOptionsState.configs.find(
        (config: any) => config.label === 'Color by',
      ).value;

      collectionFolder.loadStateFromJSON(state);

      expect(getConfig('Color')?.group).toBe(ColorByOptionKeys.COLLECTION);
      expect(getConfig('Random')?.group).toBe(ColorByOptionKeys.RANDOM);
      expect(getConfig('Color')?.hidden).toBe(false);
      expect(getConfig('Random')?.hidden).toBe(true);
    });
  });
});
