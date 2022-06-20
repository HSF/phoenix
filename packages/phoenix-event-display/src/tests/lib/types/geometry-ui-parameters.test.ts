import THREE from 'three';
import { GeometryUIParameters } from '../../../lib/types/geometry-ui-parameters';

describe('GeometryUIParameters', () => {
  let geometryUIParameters: GeometryUIParameters;

  beforeEach(() => {
    geometryUIParameters = {
      object: null,
      menuNodeName: '',
    };
  });

  test('should exist', () => {
    expect(geometryUIParameters.object).toBeNull();
    expect(geometryUIParameters.menuNodeName).toBe('');
  });
});
