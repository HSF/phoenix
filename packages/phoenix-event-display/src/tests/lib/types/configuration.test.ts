import { Configuration } from '../../../lib/types/configuration';
import { PresetView } from '../../../lib/models/preset-view.model';

describe('Configuration', () => {
  let configuration: Configuration;
  const presetView = new PresetView('test', [0, 0, 0], [0, 0, 0], 'test');

  beforeEach(() => {
    configuration = {
      defaultView: [0, 0, 0],
      presetViews: presetView[2],
      eventDataLoader: null,
      phoenixMenuRoot: null,
      enableDatGUIMenu: false,
      elementId: '',
      defaultEventFile: { eventFile: '', eventType: '' },
      allowUrlOptions: true,
    };
  });

  test('should exist', () => {
    expect(configuration.defaultView).toEqual([0, 0, 0]);
    expect(configuration.presetViews).toEqual(presetView[2]);
    expect(configuration.eventDataLoader).toBeNull();
    expect(configuration.phoenixMenuRoot).toBeNull();
    expect(configuration.enableDatGUIMenu).toBeFalsy();
    expect(configuration.elementId).toBe('');
    expect(configuration.defaultEventFile).toEqual({
      eventFile: '',
      eventType: '',
    });
    expect(configuration.allowUrlOptions).toBeTruthy();
  });
});
