import { PresetView } from '../../../lib/models/preset-view.model';

describe('PresetView', () => {
  let model: PresetView;

  beforeEach(() => {
    model = new PresetView('test', [0, 0, 0], [0, 0, 0], 'test');
  });

  test('can be created', () => {
    expect(model).toBeTruthy();
  });

  test('get the url of the preset view icon', () => {
    expect(model.getIconURL()).toBe('assets/preset-views/test.svg#test');
  });
});
