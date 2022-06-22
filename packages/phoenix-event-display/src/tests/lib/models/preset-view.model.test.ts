import { PresetView } from '../../../lib/models/preset-view.model';

describe('PresetView', () => {
  let model: PresetView;

  beforeEach(() => {
    model = new PresetView('test', [0, 0, 0], [0, 0, 0], 'test');
  });

  it('can be created', () => {
    expect(model).toBeTruthy();
  });

  it('get the url of the preset view icon', () => {
    expect(model.getIconURL()).toBe('assets/preset-views/test.svg#test');
  });
});
