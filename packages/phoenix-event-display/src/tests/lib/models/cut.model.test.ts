import { Cut } from '../../../lib/models/cut.model';

describe('Cut', () => {
  let model: Cut;

  beforeEach(() => {
    model = new Cut('test', 0, 1, 1);
  });

  it('should create an instance of Cut model', () => {
    expect(model).toBeTruthy();
  });

  it('should reset the values', () => {
    model.minValue = 10;
    model.maxValue = 20;

    model.reset();

    expect(model.minValue).toBe(0);
    expect(model.maxValue).toBe(1);
  });
});
