/**
 * @jest-environment jsdom
 */
import createRenderer from '../../helpers/create-renderer';
import { RendererManager } from '../../../managers/three-manager/renderer-manager';

describe('RendererManager', () => {
  let rendererManager: RendererManager;

  it('should set the main renderer', () => {
    const config = {
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    };
    const webglRenderer = createRenderer(config);
    rendererManager.setMainRenderer(webglRenderer);
    expect(rendererManager.getMainRenderer()).toBe(webglRenderer);
  });
});
