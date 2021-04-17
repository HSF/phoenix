import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { Camera, Scene, WebGLRenderer, Vector2, NormalBlending } from 'three';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { Pass } from 'three/examples/jsm/postprocessing/Pass';

/**
 * Manager for managing three.js event display effects like outline pass and unreal bloom.
 */
export class EffectsManager {
  /** Effect composer for effect passes. */
  public composer: EffectComposer;
  /** The camera inside the scene. */
  private camera: Camera;
  /** The default scene used for event display. */
  private scene: Scene;
  /** Render pass for rendering the default scene. */
  private defaultRenderPass: RenderPass;
  /** Whether antialiasing is enabled or disabled. */
  public antialiasing: boolean = true;

  /** Render function with (normal render) or without antialias (effects render). */
  public render: (scene: Scene, camera: Camera) => void;

  /**
   * Constructor for the effects manager which manages effects and three.js passes.
   * @param camera The camera inside the scene.
   * @param scene The default scene used for event display.
   * @param renderer The main renderer used by the event display.
   */
  constructor(camera: Camera, scene: Scene, renderer: WebGLRenderer) {
    this.composer = new EffectComposer(renderer);
    this.camera = camera;
    this.scene = scene;

    this.defaultRenderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.defaultRenderPass);

    // Set the starting render function
    this.render = this.antialiasing ? this.antialiasRender : this.effectsRender;
  }

  /**
   * Render the effects composer.
   * @param scene The default scene used for event display.
   * @param camera The camera inside the scene.
   */
  private effectsRender(scene: Scene, camera: Camera) {
    if (this.composer) {
      this.defaultRenderPass.camera = camera;
      this.defaultRenderPass.scene = scene;
      this.composer.render();
    }
  }

  /**
   * Render for antialias without the effects composer.
   * @param scene The default scene used for event display.
   * @param camera The camera inside the scene.
   */
  private antialiasRender(scene: Scene, camera: Camera) {
    this.composer.renderer.render(scene, camera);
  }

  /**
   * Initialize the outline pass for highlighting hovered over event display elements.
   * @returns OutlinePass for highlighting hovered over event display elements.
   */
  public addOutlinePassForSelection(): OutlinePass {
    const outlinePass = new OutlinePass(
      new Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.camera
    );
    outlinePass.overlayMaterial.blending = NormalBlending;
    outlinePass.visibleEdgeColor.set(0xffff66);
    outlinePass.visibleEdgeColor.set(0xdf5330);

    this.composer.addPass(outlinePass);

    return outlinePass;
  }

  /**
   * Remove a pass from the effect composer.
   * @param pass Effect pass to be removed from the effect composer.
   */
  public removePass(pass: Pass) {
    const passIndex = this.composer.passes.indexOf(pass);
    this.composer.passes.splice(passIndex, 1);
  }

  /**
   * Set the antialiasing of renderer.
   * @param antialias Whether antialiasing is to enabled or disabled.
   */
  public setAntialiasing(antialias: boolean) {
    this.antialiasing = antialias;
    this.render = this.antialiasing ? this.antialiasRender : this.effectsRender;
  }
}
