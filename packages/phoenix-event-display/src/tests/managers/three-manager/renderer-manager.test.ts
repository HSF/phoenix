/**
 * @jest-environment jsdom
 */
import { RendererManager } from '../../../managers/three-manager/renderer-manager';
import { WebGLRenderer } from 'three';

// Mock WebGLRenderer since jsdom doesn't support WebGL
jest.mock('three', () => {
  const actualThree = jest.requireActual('three');
  return {
    ...actualThree,
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setSize: jest.fn(),
      setPixelRatio: jest.fn(),
      setAnimationLoop: jest.fn(),
      render: jest.fn(),
      domElement: document.createElement('canvas'),
      localClippingEnabled: false,
    })),
  };
});

describe('RendererManager', () => {
  let rendererManager: RendererManager;

  beforeEach(() => {
    rendererManager = new RendererManager();
  });

  describe('swapRenderers', () => {
    it('should swap two renderers in the renderers list', () => {
      const rendererA = new WebGLRenderer();
      const rendererB = new WebGLRenderer();

      rendererManager.addRenderer(rendererA);
      rendererManager.addRenderer(rendererB);

      const renderers = rendererManager.getRenderers();
      const indexA = renderers.indexOf(rendererA);
      const indexB = renderers.indexOf(rendererB);

      rendererManager.swapRenderers(rendererA, rendererB);

      expect(renderers[indexA]).toBe(rendererB);
      expect(renderers[indexB]).toBe(rendererA);
    });

    it('should not modify the list if a renderer is not found', () => {
      const rendererA = new WebGLRenderer();
      const rendererB = new WebGLRenderer();

      rendererManager.addRenderer(rendererA);
      // rendererB is NOT added to the list

      const renderersBefore = [...rendererManager.getRenderers()];

      rendererManager.swapRenderers(rendererA, rendererB);

      expect(rendererManager.getRenderers()).toEqual(renderersBefore);
    });

    it('should update mainRenderer reference when swapping involves mainRenderer', () => {
      const mainRenderer = rendererManager.getMainRenderer();
      const otherRenderer = new WebGLRenderer();

      rendererManager.addRenderer(otherRenderer);

      rendererManager.swapRenderers(mainRenderer, otherRenderer);

      expect(rendererManager.getMainRenderer()).toBe(otherRenderer);
    });

    it('should update overlayRenderer reference when swapping involves overlayRenderer', () => {
      const overlayCanvas = document.createElement('canvas');
      rendererManager.setOverlayRenderer(overlayCanvas);

      const overlayRenderer = rendererManager.getOverlayRenderer();
      const otherRenderer = new WebGLRenderer();
      rendererManager.addRenderer(otherRenderer);

      rendererManager.swapRenderers(overlayRenderer, otherRenderer);

      expect(rendererManager.getOverlayRenderer()).toBe(otherRenderer);
    });

    it('should do nothing when both renderers are the same', () => {
      const renderer = rendererManager.getMainRenderer();
      const renderersBefore = [...rendererManager.getRenderers()];

      rendererManager.swapRenderers(renderer, renderer);

      expect(rendererManager.getRenderers()).toEqual(renderersBefore);
    });
  });
});
