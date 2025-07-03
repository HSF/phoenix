import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {
  Camera,
  Scene,
  WebGLRenderer,
  Vector2,
  ShaderMaterial,
  Material,
  Mesh,
  EdgesGeometry,
  LineSegments,
  NormalBlending,
} from 'three';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';

/**
 * Manager for managing three.js event display effects like outline pass and unreal bloom.
 *
 * Features:
 * - Multi-object selection with animated rainbow outlines
 * - Hover outlines with distinct blue styling
 * - Edge-based outline rendering for true silhouettes
 * - Shared shader architecture for performance
 * - Legacy compatibility for existing outline systems
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
  /** Array to keep track of outline passes that need camera updates */
  private outlinePasses: OutlinePass[] = [];
  /** Whether antialiasing is enabled or disabled. */
  public antialiasing: boolean = true;

  /** WebGL renderer reference for custom outline rendering */
  private renderer: WebGLRenderer;

  // Multi-selection support
  /** Map of selected objects to their outline helpers */
  private selectedOutlines: Map<Mesh, LineSegments> = new Map();
  /** Currently hovered object outline (temporary) */
  private hoverOutline: LineSegments | null = null;

  /** Render function with (normal render) or without antialias (effects render). */
  public render: (scene: Scene, camera: Camera) => void;

  // Shared shader code for reuse
  /** Shared vertex shader code for outline rendering. */
  private static readonly VERTEX_SHADER = `
    uniform float time;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    
    void main() {
      vPosition = position;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  /** Shared rainbow color function for reuse across shaders. */
  private static readonly RAINBOW_FUNCTION = `
    // Enhanced rainbow function - reused from main outline material
    vec3 rainbow(float t) {
      t = fract(t);
      vec3 c = vec3(0.0);
      
      if (t < 0.16667) {
        c = mix(vec3(1.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), t * 6.0);
      } else if (t < 0.33333) {
        c = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.16667) * 6.0);
      } else if (t < 0.5) {
        c = mix(vec3(1.0, 1.0, 0.0), vec3(0.0, 1.0, 0.0), (t - 0.33333) * 6.0);
      } else if (t < 0.66667) {
        c = mix(vec3(0.0, 1.0, 0.0), vec3(0.0, 1.0, 1.0), (t - 0.5) * 6.0);
      } else if (t < 0.83333) {
        c = mix(vec3(0.0, 1.0, 1.0), vec3(0.0, 0.0, 1.0), (t - 0.66667) * 6.0);
      } else {
        c = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 1.0), (t - 0.83333) * 6.0);
      }
      
      return c;
    }
  `;

  /** Fragment shader for hover outline effects (clean blue outline). */
  private static readonly HOVER_FRAGMENT_SHADER = `
    // Hover outline shader - clean blue outline
    uniform float time;
    uniform float opacity;

    void main() {
      // Clean blue color - no animation for simplicity
      vec3 color = vec3(0.2, 0.6, 1.0); // Nice blue
      
      gl_FragColor = vec4(color, opacity);
    }
  `;

  /** Fragment shader for selection outline effects (animated rainbow outline). */
  private static readonly SELECTION_FRAGMENT_SHADER = `
    // Selection outline shader - reuses rainbow function
    uniform float time;
    uniform float opacity;
    varying vec3 vWorldPosition;

    ${EffectsManager.RAINBOW_FUNCTION}

    void main() {
      // Enhanced gradient calculation for more vibrant colors
      float t = (vWorldPosition.x * 0.5 + vWorldPosition.y * 1.0 - vWorldPosition.z * 0.3) / 20000.0;

      // Faster animation for more dynamic effect
      t += time * 0.35;

      // Use the shared rainbow function
      vec3 color = rainbow(t);
      

      gl_FragColor = vec4(color, opacity);
    }

    

  `;

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
    this.renderer = renderer;

    this.defaultRenderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.defaultRenderPass);

    // Set the starting render function
    this.render = this.antialiasing ? this.antialiasRender : this.effectsRender;
  }

  /**
   * Render the effects composer with custom rainbow outline rendering.
   * @param scene The default scene used for event display.
   * @param camera The camera inside the scene.
   */
  private effectsRender(scene: Scene, camera: Camera) {
    if (this.composer) {
      this.defaultRenderPass.camera = camera;
      this.defaultRenderPass.scene = scene;

      // Update all outline passes with the current camera
      for (const outlinePass of this.outlinePasses) {
        outlinePass.renderCamera = camera;
      }

      // Always update time uniforms if we have any outlines (new multi-selection system)
      if (this.selectedOutlines.size > 0 || this.hoverOutline) {
        this.renderWithRainbowOutline(scene, camera);
      } else {
        // Normal rendering without outline
        this.composer.render();
      }
    }
  }

  /**
   * Render for antialias without the effects composer.
   * @param scene The default scene used for event display.
   * @param camera The camera inside the scene.
   */
  private antialiasRender(scene: Scene, camera: Camera) {
    // Always update time uniforms if we have any outlines (new multi-selection system)
    if (this.selectedOutlines.size > 0 || this.hoverOutline) {
      this.renderWithRainbowOutline(scene, camera);
    } else {
      // Normal rendering without outline
      this.composer.renderer.render(scene, camera);
    }
  }

  /**
   * Initialize the outline pass for highlighting hovered over event display elements.
   * @returns OutlinePass for highlighting hovered over event display elements.
   */
  public addOutlinePassForSelection(): OutlinePass {
    const outlinePass = new OutlinePass(
      new Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.camera,
    );
    outlinePass.overlayMaterial.blending = NormalBlending;
    // outlinePass.visibleEdgeColor.set(0xffff66);
    outlinePass.visibleEdgeColor.set(0xdf5330);

    this.composer.addPass(outlinePass);

    // Keep track of this outline pass for camera updates
    this.outlinePasses.push(outlinePass);

    return outlinePass;
  }

  /**
   * Remove a pass from the effect composer.
   * @param pass Effect pass to be removed from the effect composer.
   */
  public removePass(pass: Pass) {
    const passIndex = this.composer.passes.indexOf(pass);
    this.composer.passes.splice(passIndex, 1);

    // If it's an outline pass, remove it from our tracking array
    if (pass instanceof OutlinePass) {
      const outlineIndex = this.outlinePasses.indexOf(pass);
      if (outlineIndex > -1) {
        this.outlinePasses.splice(outlineIndex, 1);
      }
    }
  }

  /**
   * Set the antialiasing of renderer.
   * @param antialias Whether antialiasing is to enabled or disabled.
   */
  public setAntialiasing(antialias: boolean) {
    this.antialiasing = antialias;
    this.render = this.antialiasing ? this.antialiasRender : this.effectsRender;
  }

  /**
   * Perform dual-pass rendering: rainbow outline + original object.
   * @param scene The scene to render.
   * @param camera The camera to render with.
   */
  private renderWithRainbowOutline(scene: Scene, camera: Camera) {
    // Update time uniforms for all outline shaders
    const time = performance.now() * 0.001;

    // Update selected outlines
    for (const outlineHelper of this.selectedOutlines.values()) {
      const material = outlineHelper.material as ShaderMaterial;
      material.uniforms.time.value = time;
    }

    // Update hover outline
    if (this.hoverOutline) {
      const material = this.hoverOutline.material as ShaderMaterial;
      material.uniforms.time.value = time;
    }

    // Normal rendering - all outlines are already in the scene
    if (this.antialiasing) {
      this.renderer.render(scene, camera);
    } else {
      this.composer.render();
    }
  }

  /**
   * Get performance statistics for the outline system.
   * @returns Object containing performance metrics.
   */
  public getOutlinePerformanceStats() {
    return {
      selectedObjectsCount: this.selectedOutlines.size,
      hasHoverOutline: !!this.hoverOutline,
      totalOutlines: this.selectedOutlines.size + (this.hoverOutline ? 1 : 0),
    };
  }

  /**
   * Add an object to the selected set (sticky selection).
   * @param object The mesh object to be selected.
   */
  public selectObject(object: Mesh) {
    if (this.selectedOutlines.has(object)) {
      return; // Already selected
    }

    // Create outline helper for this object
    const outlineHelper = this.createOutlineHelper(object);
    this.selectedOutlines.set(object, outlineHelper);
    this.scene.add(outlineHelper);
  }

  /**
   * Remove an object from the selected set.
   * @param object The mesh object to be deselected.
   */
  public deselectObject(object: Mesh) {
    const outlineHelper = this.selectedOutlines.get(object);
    if (outlineHelper) {
      this.scene.remove(outlineHelper);
      outlineHelper.geometry.dispose();
      (outlineHelper.material as ShaderMaterial).dispose();
      this.selectedOutlines.delete(object);
    }
  }

  /**
   * Toggle selection state of an object.
   * @param object The mesh object to toggle.
   * @returns True if object is now selected, false if deselected.
   */
  public toggleSelection(object: Mesh): boolean {
    if (this.selectedOutlines.has(object)) {
      this.deselectObject(object);
      return false;
    } else {
      this.selectObject(object);
      return true;
    }
  }

  /**
   * Clear all selected objects.
   */
  public clearAllSelections() {
    const count = this.selectedOutlines.size;
    for (const [object, outlineHelper] of this.selectedOutlines) {
      this.scene.remove(outlineHelper);
      outlineHelper.geometry.dispose();
      (outlineHelper.material as ShaderMaterial).dispose();
    }
    this.selectedOutlines.clear();
  }

  /**
   * Set hover outline for an object (temporary, non-sticky).
   * @param object The mesh object to hover outline, or null to clear.
   */
  public setHoverOutline(object: Mesh | null) {
    // Clear existing hover outline
    if (this.hoverOutline) {
      this.scene.remove(this.hoverOutline);
      this.hoverOutline.geometry.dispose();
      (this.hoverOutline.material as ShaderMaterial).dispose();
      this.hoverOutline = null;
    }

    // Create new hover outline if object provided and not already selected
    if (object && !this.selectedOutlines.has(object)) {
      this.hoverOutline = this.createOutlineHelper(object, true); // Different style for hover
      this.scene.add(this.hoverOutline);
    }
  }

  /**
   * Create an outline helper for an object.
   * @param object The mesh object to create outline for.
   * @param isHover Whether this is a hover outline (affects styling).
   * @returns The created outline helper.
   */
  private createOutlineHelper(
    object: Mesh,
    isHover: boolean = false,
  ): LineSegments {
    // For selection outlines, use more sensitive edge detection to show more edges
    // For hover outlines, use default edge detection for cleaner look
    // Lower threshold = more edges detected (0.1 for selection vs 1.0 for hover)
    const edges = new EdgesGeometry(object.geometry, isHover ? 1 : 0.1);

    const lineMaterial = new ShaderMaterial({
      vertexShader: EffectsManager.VERTEX_SHADER,
      fragmentShader: isHover
        ? EffectsManager.HOVER_FRAGMENT_SHADER
        : EffectsManager.SELECTION_FRAGMENT_SHADER,
      uniforms: {
        time: { value: 0.0 },
        opacity: { value: isHover ? 0.8 : 1.0 }, // Selection fully opaque, hover slightly transparent
      },
      transparent: true,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      // Make selection outlines thicker/more prominent
      linewidth: isHover ? 1 : 2,
    });

    const outlineHelper = new LineSegments(edges, lineMaterial);

    // Copy the object's transformation exactly
    outlineHelper.position.copy(object.position);
    outlineHelper.rotation.copy(object.rotation);
    outlineHelper.scale.copy(object.scale);

    return outlineHelper;
  }
}
