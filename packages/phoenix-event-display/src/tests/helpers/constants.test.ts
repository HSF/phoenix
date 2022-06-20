import { EVENT_DATA_TYPE_COLORS } from '../../helpers/constants';

describe('Constants', () => {
  test('EVENT_DATA_TYPE_COLORS', () => {
    expect(EVENT_DATA_TYPE_COLORS).toHaveProperty('Hits');
    expect(EVENT_DATA_TYPE_COLORS).toHaveProperty('Tracks');
    expect(EVENT_DATA_TYPE_COLORS).toHaveProperty('Jets');
    expect(EVENT_DATA_TYPE_COLORS).toHaveProperty('CaloClusters');
    expect(EVENT_DATA_TYPE_COLORS).toHaveProperty('MuonChambers');
    expect(EVENT_DATA_TYPE_COLORS).toHaveProperty('Vertices');
    expect(EVENT_DATA_TYPE_COLORS).toHaveProperty('MissingEnergy');
    expect(EVENT_DATA_TYPE_COLORS).toHaveProperty('PlanarCaloCells');
  });
});
