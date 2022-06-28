/**
 * @jest-environment jsdom
 */
import { RendererManager } from '../../../managers/three-manager/renderer-manager';
import createRenderer from 'jest-three';

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
