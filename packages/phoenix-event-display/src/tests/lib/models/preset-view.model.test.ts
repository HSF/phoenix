import { PresetView } from '../../../lib/models/preset-view.model';

describe('PresetView', () => {
  let model: PresetView;

  beforeEach(() => {
    model = new PresetView('test', [0, 0, 0], [0, 0, 0], 'test');
  });

  it('should create an instance of PresetView', () => {
    expect(model).toBeTruthy();
  });

  it('should get the url of the preset view icon', () => {
    expect(model.getIconURL()).toBe('assets/preset-views/test.svg#test');
  });
});
