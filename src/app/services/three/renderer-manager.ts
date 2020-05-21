import { WebGLRenderer, Scene, WebGLRendererParameters } from 'three';
import { ControlsManager } from './controls-manager';

/**
 * Manager for managing event display's renderer related functions.
 */
export class RendererManager {
  /** Main renderer to be used by the event display. */
  private mainRenderer: WebGLRenderer = null;
  /** Overlay renderer for rendering a secondary overlay canvas. */
  private overlayRenderer: WebGLRenderer = null;
  /** A list of all available/created renderers. */
  private renderers: WebGLRenderer[] = [];
  /** If the overlay is fixed or not. */
  private fixedOverlay: boolean;


  /**
   * Instantiate the renderer manager by setting up the main renderer.
   */
  constructor() {
    // Main renderer for current browsers
    this.setRenderer();
  }

  /**
   * Render the overlay.
   * @param scene The event display scene.
   * @param controlsManager Manager for managing controls.
   */
  public render(scene: Scene, controlsManager: ControlsManager) {
    if (this.getOverlayRenderer()) {
      if (!this.getOverlayRenderer().domElement.hidden) {
        const sceneColor = scene.background;
        scene.background = null;

        if (!this.isFixedOverlay()) {
          this.getOverlayRenderer().render(
            scene,
            controlsManager.getOverlayCamera()
          );
        }
        scene.background = sceneColor;
      }
    }
  }

  /**
   * Set the initial renderer.
   */
  private setRenderer() {
    const renderer: WebGLRenderer = new WebGLRenderer();

    this.addRenderer(renderer);
    this.setMainRenderer(renderer);
    this.getMainRenderer().setSize(
      window.innerWidth,
      window.innerHeight,
      false
    );
    this.getMainRenderer().domElement.className = 'ui-element';
    this.getMainRenderer().domElement.id = 'three-canvas';
    let canvas = document.getElementById('eventDisplay');
    if (canvas == null) {
      canvas = document.body;
    }
    canvas.appendChild(this.getMainRenderer().domElement);
  }

  // SET/GET

  /**
   * Set the main renderer.
   * @param renderer Three.js WebGLRenderer.
   */
  setMainRenderer(renderer: WebGLRenderer) {
    this.mainRenderer = renderer;
  }

  /**
   * Set the renderer for overlay event display view.
   * @param overlayCanvas Canvas on which the overlay is to be rendered.
   */
  public setOverlayRenderer(overlayCanvas: HTMLCanvasElement): void {
    const parameters: WebGLRendererParameters = {
      canvas: overlayCanvas,
      antialias: false,
      alpha: true
    };
    const overlayRenderer: WebGLRenderer = new WebGLRenderer(parameters);
    this.addRenderer(overlayRenderer);
    this.overlayRenderer = overlayRenderer;
  }

  /**
   * Set the available renderers.
   * @param renderers List of three.js WebGLRenderers.
   */
  setRenderers(renderers: WebGLRenderer[]) {
    this.renderers = renderers;
  }

  /**
   * Get the main renderer.
   * @returns The main renderer.
   */
  getMainRenderer(): WebGLRenderer {
    return this.mainRenderer;
  }

  /**
   * Get the renderer used for overlay.
   * @returns The overlay renderer.
   */
  getOverlayRenderer(): WebGLRenderer {
    return this.overlayRenderer;
  }

  /**
   * Get all the available renderers.
   * @returns A list of three.js WebGLRenderers
   */
  getRenderers(): WebGLRenderer[] {
    return this.renderers;
  }


  // FUNCTIONS

  /**
   * Add a renderer to the available renderers list.
   * @param renderer Three.js WebGLRenderer to be added.
   */
  public addRenderer(renderer: WebGLRenderer) {
    if (!this.containsObject(renderer, this.renderers)) {
      this.renderers.push(renderer);
    }
  }

  /**
   * Remove a renderer from the available renderers list.
   * @param renderer Three,js WebGLRenderer to be removed.
   */
  public removeControls(renderer: WebGLRenderer) {
    const index: number = this.renderers.indexOf(renderer);
    if (index > -1) {
      this.renderers.splice(index, 1);
    }
  }

  /**
   * Swap any two renderers.
   * @param rendererA Renderer A to be swapped with renderer B.
   * @param rendererB Renderer B to be swapped with renderer A.
   */
  public swapRenderers(rendererA: WebGLRenderer, rendererB: WebGLRenderer) {
    const temp: WebGLRenderer = rendererA;
    rendererA = rendererB;
    rendererB = temp;
  }

  /**
   * Check if the list of available renderers contains a renderer.
   * @param obj The renderer to be checked for containment.
   * @param list List of available renderers.
   * @returns If the list contains the renderer or not.
   */
  private containsObject(obj: WebGLRenderer, list: WebGLRenderer[]): boolean {
    for (const object of list) {
      if (object === obj) {
        return true;
      }
    }
    return false;
  }

  /**
   * Set if local clipping is to be enabled or disabled for all the available renderers.
   * @param value If the local clipping is to be enabled or disabled.
   */
  public setLocalClippingEnabled(value: boolean) {
    for (const renderer of this.renderers) {
      renderer.localClippingEnabled = value;
    }
  }

  /**
   * Check if the overlay is fixed or not.
   * @returns If the overlay is fixed or not.
   */
  isFixedOverlay(): boolean {
    return this.fixedOverlay;
  }

  /**
   * Set if the overlay is to be fixed or not.
   * @param value If the overlay is to be fixed or not.
   */
  setFixOverlay(value: boolean) {
    this.fixedOverlay = value;
  }
}
