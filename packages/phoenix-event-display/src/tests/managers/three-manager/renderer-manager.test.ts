/**
 * @jest-environment jsdom
 */
import createRenderer from '../../helpers/create-renderer';
import { RendererManager } from '../../../managers/three-manager/renderer-manager';
import { Camera, Scene, WebGLRenderer } from 'three';

jest.mock('../../../managers/three-manager/renderer-manager');

describe('RendererManager', () => {
  let rendererManager: RendererManager;
  const rendererManagerMock = new RendererManager() as unknown as jest.Mock;

  beforeEach(() => {
    rendererManager = new RendererManager();
  });

  it('should create a renderer manager', () => {
    expect(rendererManagerMock).toBeInstanceOf(RendererManager);
  });

  it('should initialize the renderer manager by setting up the main renderer', () => {
    const elementId = 'eventDisplay';
    jest.spyOn(rendererManager, 'init');
    rendererManager.init(elementId);
    expect(rendererManager.init).toHaveBeenCalledWith(elementId);
  });

  it('should render the overlay', () => {
    const scene = new Scene();
    const camera = new Camera();
    jest.spyOn(rendererManager, 'render');
    rendererManager.render(scene, camera);
    expect(rendererManager.render).toHaveBeenCalledWith(scene, camera);
  });

  it('should set if local clipping is to be enabled or disabled for all the available renderers', () => {
    jest.spyOn(rendererManager, 'setLocalClippingEnabled');
    rendererManager.setLocalClippingEnabled(true);
    expect(rendererManager.setLocalClippingEnabled).toHaveBeenCalledWith(true);
  });

  it('should get if the local clipping for the first renderer is enabled or disabled', () => {
    jest.spyOn(rendererManager, 'getLocalClipping');
    rendererManager.getLocalClipping();
    expect(rendererManager.getLocalClipping).toHaveBeenCalled();
  });

  it('should check if the overlay is fixed or not', () => {
    jest.spyOn(rendererManager, 'isFixedOverlay');
    rendererManager.isFixedOverlay();
    expect(rendererManager.isFixedOverlay).toHaveBeenCalled();
  });

  it('should set if the overlay is fixed or not', () => {
    jest.spyOn(rendererManager, 'setFixOverlay');
    rendererManager.setFixOverlay(true);
    expect(rendererManager.setFixOverlay).toHaveBeenCalledWith(true);
  });

  it('should swap any two renderers', () => {
    const config = {
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    };
    const webglRenderer1 = createRenderer(config);
    rendererManager.addRenderer(webglRenderer1);
    const webglRenderer2 = createRenderer(config);
    rendererManager.addRenderer(webglRenderer2);
    jest.spyOn(rendererManager, 'swapRenderers');
    rendererManager.swapRenderers(webglRenderer1, webglRenderer2);
    expect(rendererManager.swapRenderers).toHaveBeenCalledWith(
      webglRenderer1,
      webglRenderer2
    );
  });

  describe('WebGLRenderer specific', () => {
    let webglRenderer: WebGLRenderer;

    beforeEach(() => {
      const config = {
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      };
      webglRenderer = createRenderer(config);
    });

    it('should create a WebGLRenderer', () => {
      expect(webglRenderer).toBeInstanceOf(WebGLRenderer);
    });

    it('should add a renderer', () => {
      jest.spyOn(rendererManager, 'addRenderer');
      rendererManager.addRenderer(webglRenderer);
      expect(rendererManager.addRenderer).toHaveBeenCalledWith(webglRenderer);
    });

    it('should set the main renderer', () => {
      jest.spyOn(rendererManager, 'setMainRenderer');
      rendererManager.setMainRenderer(webglRenderer);
      expect(rendererManager.setMainRenderer).toHaveBeenCalledWith(
        webglRenderer
      );
    });

    it('should get the main renderer', () => {
      jest.spyOn(rendererManager, 'addRenderer');
      rendererManager.addRenderer(webglRenderer);
      expect(rendererManager.addRenderer).toHaveBeenCalledWith(webglRenderer);
      jest.spyOn(rendererManager, 'getMainRenderer');
      rendererManager.getMainRenderer();
      expect(rendererManager.getMainRenderer).toHaveBeenCalled();
    });

    it('should get the overlay renderer', () => {
      jest.spyOn(rendererManager, 'addRenderer');
      rendererManager.addRenderer(webglRenderer);
      expect(rendererManager.addRenderer).toHaveBeenCalledWith(webglRenderer);
      jest.spyOn(rendererManager, 'getOverlayRenderer');
      rendererManager.getOverlayRenderer();
      expect(rendererManager.getOverlayRenderer).toHaveBeenCalled();
    });

    it('should get all the available renderers', () => {
      rendererManager.addRenderer(webglRenderer);
      jest.spyOn(rendererManager, 'getRenderers');
      rendererManager.getRenderers();
      expect(rendererManager.getRenderers).toHaveBeenCalled();
    });

    it('should remove a renderer from the available renderers list', () => {
      rendererManager.addRenderer(webglRenderer);
      jest.spyOn(rendererManager, 'removeControls');
      rendererManager.removeControls(webglRenderer);
      expect(rendererManager.removeControls).toHaveBeenCalledWith(
        webglRenderer
      );
    });
  });
});
