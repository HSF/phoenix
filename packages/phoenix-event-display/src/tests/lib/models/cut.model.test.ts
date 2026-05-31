import { Cut } from '../../../lib/models/cut.model';

describe('Cut', () => {
  let model: Cut;

  beforeEach(() => {
    model = new Cut('test', 0, 1, 1);
  });

  afterEach(() => {
    model = undefined;
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

  describe('clone', () => {
    it('should return a Cut instance with the same properties', () => {
      const original = new Cut('pT', 0, 50000, 0.1, true, false);
      const cloned = original.clone();

      expect(cloned).toBeInstanceOf(Cut);
      expect(cloned).not.toBe(original);
      expect(cloned.field).toBe('pT');
      expect(cloned.minValue).toBe(0);
      expect(cloned.maxValue).toBe(50000);
      expect(cloned.step).toBe(0.1);
      expect(cloned.minCutActive).toBe(true);
      expect(cloned.maxCutActive).toBe(false);
    });

    it('should produce an independent copy that does not share state', () => {
      const original = new Cut('eta', -4, 4, 0.1);
      const cloned = original.clone();

      cloned.minValue = -2;
      cloned.maxValue = 2;

      expect(original.minValue).toBe(-4);
      expect(original.maxValue).toBe(4);
    });

    it('should preserve cutPassed behaviour on the clone', () => {
      const original = new Cut('phi', -3.14, 3.14, 0.01);
      const cloned = original.clone();

      expect(cloned.cutPassed(0)).toBe(true);
      expect(cloned.cutPassed(99)).toBe(false);
    });
  });

  // NEW TESTS START HERE

  describe('toJSON', () => {
    it('should return a plain object with all serializable fields', () => {
      const cut = new Cut('eta', -1.0, 1.0, 0.1, true, false);
      expect(cut.toJSON()).toEqual({
        field: 'eta',
        minValue: -1.0,
        maxValue: 1.0,
        step: 0.1,
        minCutActive: true,
        maxCutActive: false,
      });
    });

    it('should capture the current slider position, not the original defaults', () => {
      const cut = new Cut('pt', 0, 100);
      cut.minValue = 20;
      cut.maxValue = 80;
      const json = cut.toJSON();
      expect(json.minValue).toBe(20);
      expect(json.maxValue).toBe(80);
    });

    it('should not include configRangeSlider or private default fields', () => {
      const cut = new Cut('phi', -3.14, 3.14);
      const json = cut.toJSON() as any;
      expect('configRangeSlider' in json).toBe(false);
      expect('defaultMinValue' in json).toBe(false);
      expect('defaultMaxValue' in json).toBe(false);
    });

    it('should produce output that is safely JSON.stringify-able', () => {
      const cut = new Cut('eta', -2.5, 2.5, 0.05, true, true);
      expect(() => JSON.stringify(cut.toJSON())).not.toThrow();
    });
  });

  describe('fromJSON', () => {
    it('should reconstruct a Cut with all matching field values', () => {
      const cut = Cut.fromJSON({
        field: 'phi',
        minValue: 0.5,
        maxValue: 2.5,
        step: 0.05,
        minCutActive: true,
        maxCutActive: false,
      });
      expect(cut.field).toBe('phi');
      expect(cut.minValue).toBe(0.5);
      expect(cut.maxValue).toBe(2.5);
      expect(cut.step).toBe(0.05);
      expect(cut.minCutActive).toBe(true);
      expect(cut.maxCutActive).toBe(false);
    });

    it('should return a proper Cut instance with working methods', () => {
      const cut = Cut.fromJSON({
        field: 'eta',
        minValue: -0.5,
        maxValue: 0.5,
        step: 0.1,
        minCutActive: true,
        maxCutActive: true,
      });
      expect(cut).toBeInstanceOf(Cut);
      expect(cut.cutPassed(0)).toBe(true);
      expect(cut.cutPassed(1)).toBe(false);
    });
  });

  describe('round-trip serialization', () => {
    it('should preserve all values through toJSON → stringify → parse → fromJSON', () => {
      const original = new Cut('eta', -1.2, 1.2, 0.1, true, true);
      original.minValue = -0.5;
      const restored = Cut.fromJSON(
        JSON.parse(JSON.stringify(original.toJSON())),
      );
      expect(restored.field).toBe('eta');
      expect(restored.minValue).toBe(-0.5);
      expect(restored.maxValue).toBe(1.2);
      expect(restored.step).toBe(0.1);
      expect(restored.minCutActive).toBe(true);
      expect(restored.maxCutActive).toBe(true);
    });

    it('should produce a Cut that filters values correctly after round-trip', () => {
      const original = new Cut('pt', 10, 50, 1, true, true);
      const restored = Cut.fromJSON(
        JSON.parse(JSON.stringify(original.toJSON())),
      );
      expect(restored.cutPassed(30)).toBe(true);
      expect(restored.cutPassed(5)).toBe(false);
      expect(restored.cutPassed(60)).toBe(false);
    });
  });
});
