import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {
  Camera,
  Scene,
  WebGLRenderer,
  Vector2,
  ShaderMaterial,
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
 * Selection uses OutlinePass for true silhouette outlines (boundary only, no internal
 * mesh edges). This addresses the feedback that EdgesGeometry showed too many
 * internal edges, especially on jets where all cone triangles were visible.
 *
 * Hover uses EdgesGeometry (15° threshold) for lightweight, immediate feedback.
 *
 * Selection color defaults to amber but is configurable via setSelectionColor()
 * for experiments like LHCb where amber-colored objects are common.
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
  /** WebGL renderer reference */
  private renderer: WebGLRenderer;

  // Selection support (OutlinePass — true silhouette)
  /** Set of currently selected objects */
  private selectedObjectsSet: Set<Mesh> = new Set();
  /** OutlinePass for selection silhouette (lazy-initialized on first select) */
  private selectionOutlinePass: OutlinePass | null = null;

  // Hover support (EdgesGeometry — lightweight)
  /** Currently hovered object outline (temporary) */
  private hoverOutline: LineSegments | null = null;
  /** Reference to the hovered object for cleanup */
  private hoverTarget: Mesh | null = null;

  /** Render function with (normal render) or without antialias (effects render). */
  public render: (scene: Scene, camera: Camera) => void;

  /** Vertex shader for hover outline rendering. */
  private static readonly VERTEX_SHADER = `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  /** Fragment shader for hover outlines (static blue). */
  private static readonly HOVER_FRAGMENT_SHADER = `
    uniform float opacity;
    void main() {
      vec3 color = vec3(0.2, 0.6, 1.0);
      gl_FragColor = vec4(color, opacity);
    }
  `;

  /**
   * Constructor for the effects manager.
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
   * Lazily initialize the selection OutlinePass on first use.
   * Keeps the composer clean until selection is needed, preserving
   * existing tests that check composer.passes.length.
   */
  private ensureSelectionPass(): OutlinePass {
    if (!this.selectionOutlinePass) {
      this.selectionOutlinePass = new OutlinePass(
        new Vector2(window.innerWidth, window.innerHeight),
        this.scene,
        this.camera,
      );
      this.selectionOutlinePass.visibleEdgeColor.set(0xffcc44); // bright amber
      this.selectionOutlinePass.hiddenEdgeColor.set(0x190a05);
      this.selectionOutlinePass.edgeGlow = 0; // no glow bleeding onto neighbors
      this.selectionOutlinePass.edgeThickness = 1; // tight silhouette line
      this.selectionOutlinePass.edgeStrength = 3;
      this.selectionOutlinePass.pulsePeriod = 0; // we handle pulsing manually
      this.selectionOutlinePass.enabled = false;

      this.composer.addPass(this.selectionOutlinePass);
      this.outlinePasses.push(this.selectionOutlinePass);
    }
    return this.selectionOutlinePass;
  }

  /**
   * Render the effects composer with outline support.
   * Called when antialiasing is off (selection mode).
   * @param scene The default scene used for event display.
   * @param camera The camera inside the scene.
   */
  private effectsRender(scene: Scene, camera: Camera) {
    if (this.composer) {
      this.defaultRenderPass.camera = camera;
      this.defaultRenderPass.scene = scene;

      for (const outlinePass of this.outlinePasses) {
        outlinePass.renderCamera = camera;
      }

      this.updateSelectionPulse();
      this.composer.render();
    }
  }

  /**
   * Render for antialias without the effects composer.
   * Falls back to composer if there are active selections (OutlinePass needs it).
   * @param scene The default scene used for event display.
   * @param camera The camera inside the scene.
   */
  private antialiasRender(scene: Scene, camera: Camera) {
    if (this.selectedObjectsSet.size > 0) {
      // Selections require OutlinePass which needs the composer
      this.defaultRenderPass.camera = camera;
      this.defaultRenderPass.scene = scene;
      for (const outlinePass of this.outlinePasses) {
        outlinePass.renderCamera = camera;
      }
      this.updateSelectionPulse();
      this.composer.render();
    } else if (this.hoverOutline) {
      // Hover outlines are scene children, direct render handles them
      this.renderer.render(scene, camera);
    } else {
      this.composer.renderer.render(scene, camera);
    }
  }

  /**
   * Initialize an outline pass for external use.
   * @returns OutlinePass for highlighting event display elements.
   */
  public addOutlinePassForSelection(): OutlinePass {
    const outlinePass = new OutlinePass(
      new Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.camera,
    );
    outlinePass.overlayMaterial.blending = NormalBlending;
    outlinePass.visibleEdgeColor.set(0xdf5330);

    this.composer.addPass(outlinePass);

    // Keep track for camera updates
    this.outlinePasses.push(outlinePass);

    return outlinePass;
  }

  /**
   * Remove a pass from the effect composer.
   * @param pass Effect pass to be removed from the effect composer.
   */
  public removePass(pass: Pass) {
    const passIndex = this.composer.passes.indexOf(pass);
    if (passIndex > -1) {
      this.composer.passes.splice(passIndex, 1);
    }

    // If it's an outline pass, remove from tracking array
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
   * Update the pulsing animation on the selection OutlinePass.
   * Oscillates edgeStrength for a gentle breathing effect.
   */
  private updateSelectionPulse() {
    if (this.selectionOutlinePass && this.selectedObjectsSet.size > 0) {
      const time = performance.now() * 0.001;
      // Pulse between 1.5 and 4.5 — always visible, gentle breathing
      this.selectionOutlinePass.edgeStrength = 3 + 1.5 * Math.sin(time * 2.5);
    }
  }

  /**
   * Get performance statistics for the outline system.
   * @returns Object containing performance metrics.
   */
  public getOutlinePerformanceStats() {
    return {
      selectedObjectsCount: this.selectedObjectsSet.size,
      hasHoverOutline: !!this.hoverOutline,
      totalOutlines: this.selectedObjectsSet.size + (this.hoverOutline ? 1 : 0),
    };
  }

  /**
   * Add an object to the selected set (sticky selection).
   * Uses OutlinePass for true silhouette rendering (boundary only).
   * @param object The mesh object to be selected.
   */
  public selectObject(object: Mesh) {
    if (this.selectedObjectsSet.has(object)) {
      return;
    }

    this.selectedObjectsSet.add(object);
    const pass = this.ensureSelectionPass();
    pass.selectedObjects = Array.from(this.selectedObjectsSet);
    pass.enabled = true;
  }

  /**
   * Remove an object from the selected set.
   * @param object The mesh object to be deselected.
   */
  public deselectObject(object: Mesh) {
    if (!this.selectedObjectsSet.has(object)) {
      return;
    }

    this.selectedObjectsSet.delete(object);
    if (this.selectionOutlinePass) {
      this.selectionOutlinePass.selectedObjects = Array.from(
        this.selectedObjectsSet,
      );
      this.selectionOutlinePass.enabled = this.selectedObjectsSet.size > 0;
    }
  }

  /**
   * Toggle selection state of an object.
   * @param object The mesh object to toggle.
   * @returns True if object is now selected, false if deselected.
   */
  public toggleSelection(object: Mesh): boolean {
    if (this.selectedObjectsSet.has(object)) {
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
    this.selectedObjectsSet.clear();
    if (this.selectionOutlinePass) {
      this.selectionOutlinePass.selectedObjects = [];
      this.selectionOutlinePass.enabled = false;
    }
  }

  /**
   * Set hover outline for an object (temporary, non-sticky).
   * Uses EdgesGeometry at 15° for visible hover feedback.
   * @param object The mesh object to hover outline, or null to clear.
   */
  public setHoverOutline(object: Mesh | null) {
    // Clear existing hover outline
    if (this.hoverOutline) {
      this.hoverOutline.removeFromParent();
      this.hoverOutline.geometry.dispose();
      (this.hoverOutline.material as ShaderMaterial).dispose();
      this.hoverOutline = null;
      this.hoverTarget = null;
    }

    // Create new hover outline if object provided and not already selected
    if (object && !this.selectedObjectsSet.has(object)) {
      this.hoverOutline = this.createHoverOutline(object);
      this.hoverTarget = object;
      // Add as child so outline inherits all transformations
      object.add(this.hoverOutline);
    }
  }

  /**
   * Set the selection outline color.
   * Default is amber (0xffa633). Experiments with amber-colored objects
   * (e.g. LHCb calorimeter deposits) may want a different color for contrast.
   * @param color The color as a hex number (e.g. 0x00ff00 for green).
   */
  public setSelectionColor(color: number) {
    const pass = this.ensureSelectionPass();
    pass.visibleEdgeColor.set(color);
  }

  /**
   * Create an EdgesGeometry hover outline for an object.
   * Added as a child so it inherits transforms and is excluded from raycasts.
   * @param object The mesh object to create hover outline for.
   * @returns The created outline helper.
   */
  private createHoverOutline(object: Mesh): LineSegments {
    // 15° threshold: shows enough edges for clear visibility without clutter
    const edges = new EdgesGeometry(object.geometry, 15);

    const lineMaterial = new ShaderMaterial({
      vertexShader: EffectsManager.VERTEX_SHADER,
      fragmentShader: EffectsManager.HOVER_FRAGMENT_SHADER,
      uniforms: {
        opacity: { value: 0.8 },
      },
      transparent: true,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const outlineHelper = new LineSegments(edges, lineMaterial);

    // Prevent hover flicker: outline intercepts raycast → removed → cycle
    outlineHelper.raycast = () => {};

    // Identity transform — child of target, inherits transformations
    outlineHelper.position.set(0, 0, 0);
    outlineHelper.rotation.set(0, 0, 0);
    outlineHelper.scale.set(1, 1, 1);

    return outlineHelper;
  }

  /**
   * Cleanup and dispose all WebGL resources to prevent memory leaks.
   * Must be called before re-initialization or when destroying the event display.
   */
  public cleanup() {
    // Clear all selections (resets OutlinePass)
    this.clearAllSelections();

    // Clear hover outline (disposes geometry and material)
    this.setHoverOutline(null);

    // Dispose the selection outline pass
    if (this.selectionOutlinePass) {
      this.selectionOutlinePass.dispose();
      const passIndex = this.composer.passes.indexOf(this.selectionOutlinePass);
      if (passIndex > -1) {
        this.composer.passes.splice(passIndex, 1);
      }
      const outlineIndex = this.outlinePasses.indexOf(
        this.selectionOutlinePass,
      );
      if (outlineIndex > -1) {
        this.outlinePasses.splice(outlineIndex, 1);
      }
      this.selectionOutlinePass = null;
    }

    // Dispose remaining outline passes
    for (const pass of this.outlinePasses) {
      if (pass.dispose) {
        pass.dispose();
      }
      const passIndex = this.composer.passes.indexOf(pass);
      if (passIndex > -1) {
        this.composer.passes.splice(passIndex, 1);
      }
    }
    this.outlinePasses = [];

    // Dispose the effect composer (frees render targets/framebuffers)
    if (this.composer) {
      this.composer.dispose();
    }
  }
}
