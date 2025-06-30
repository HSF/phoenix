import {
  Vector2,
  Raycaster,
  Camera,
  Scene,
  Object3D,
  DirectionalLight,
  AmbientLight,
  AxesHelper,
  Mesh,
} from 'three';
import { InfoLogger } from '../../helpers/info-logger';
import { EffectsManager } from './effects-manager';
import { PrettySymbols } from '../../helpers/pretty-symbols';
import { ActiveVariable } from '../../helpers/active-variable';

/**
 * Manager for managing event display's selection related functions.
 *
 * Features:
 * - Multi-object sticky selection with rainbow outlines
 * - Hover preview with blue outlines
 * - Click vs drag detection for orbit controls compatibility
 * - Performance-optimized frame-based intersection processing
 * - Programmatic selection API
 */
export class SelectionManager {
  /** Is initialized. */
  private isInit: boolean;
  /** The camera inside the scene. */
  // private camera: Camera;

  private getCamera: () => Camera;

  /** The scene used for event display. */
  private scene: Scene;
  /** Object used to display the information of the selected 3D object. */
  private selectedObject: { name: string; attributes: any[] };
  /** The currently selected object which is observable for changes. */
  private activeObject = new ActiveVariable<string>('');
  /** Objects to be ignored on hovering over the scene. */
  private ignoreList: string[];

  // Post processing - now using custom outline system
  /** Manager for managing three.js event display effects like outline pass and unreal bloom. */
  private effectsManager: EffectsManager;

  /** Service for logging data to the information panel. */
  private infoLogger: InfoLogger;
  /** Performance mode value before enabling selection. */
  private preSelectionAntialias: boolean;

  // Frame-based intersection processing with dynamic adjustment
  /** Latest mouse event to process */
  private latestMouseEvent: MouseEvent | null = null;
  /** Currently outlined object for click detection */
  private currentlyOutlinedObject: Mesh | null = null;

  // Multi-selection system
  /** Set of currently selected (sticky) objects */
  private selectedObjects: Set<Mesh> = new Set();
  /** Currently hovered object (for outline preview) */
  private hoveredObject: Mesh | null = null;

  // Drag detection to prevent accidental selection during orbit controls
  /** Mouse down position for drag detection */
  private mouseDownPosition: { x: number; y: number } | null = null;
  /** Maximum pixel distance to consider as a click (not drag) */
  private clickThreshold = 5;
  /** Whether the user is currently dragging */
  private isDragging = false;

  /** Frame counter for intersection processing */
  private frameCounter = 0;
  /** Current number of frames to skip (dynamic) */
  private framesToSkip = 3;
  /** Smoothed FPS for stable decisions */
  private smoothedFPS = 60;
  /** FPS smoothing factor */
  private readonly FPS_SMOOTHING = 0.1;

  // Hysteresis thresholds to prevent oscillation
  private readonly FPS_THRESHOLDS = {
    // Going to more aggressive skipping (when performance drops)
    TO_HIGH_SKIP: 25, // FPS drops below 25 → skip 8 frames
    TO_MED_SKIP: 35, // FPS drops below 35 → skip 5 frames

    // Going to less aggressive skipping (when performance improves)
    TO_LOW_SKIP: 45, // FPS above 45 → skip 3 frames
    TO_MINIMAL_SKIP: 90, // FPS above 55 → skip 1 frame
  };
  /**
   * Constructor for the selection manager.
   */
  constructor() {
    this.isInit = false;
    this.ignoreList = [
      new AmbientLight().type,
      new DirectionalLight().type,
      new AxesHelper().type,
    ];
  }

  /**
   * Initialize the selection manager.
   * @param getCamera Function to get the current camera.
   * @param scene The scene used for event display.
   * @param effectsManager Manager for managing three.js event display effects
   * like outline pass and unreal bloom.
   * @param infoLogger Service for logging data to the information panel.
   */
  public init(
    getCamera: () => Camera,
    scene: Scene,
    effectsManager: EffectsManager,
    infoLogger: InfoLogger,
  ) {
    this.getCamera = getCamera;
    this.scene = scene;
    this.isInit = true;
    this.infoLogger = infoLogger;
    this.effectsManager = effectsManager;
    // Custom outline system is now used instead of OutlinePass
  }

  /**
   * Set the currently selected object.
   * @param selectedObject The currently selected object.
   */
  public setSelectedObject(selectedObject: {
    name: string;
    attributes: any[];
  }) {
    this.selectedObject = selectedObject;
  }

  /**
   * Get the uuid of the currently selected object.
   * @returns uuid of the currently selected object.
   */
  public getActiveObjectId(): ActiveVariable<string> {
    return this.activeObject;
  }

  /**
   * Set if selecting is to be enabled or disabled.
   * @param enable If selecting is to be enabled or disabled.
   */
  public setSelecting(enable: boolean) {
    if (this.isInit) {
      // eslint-disable-next-line
      enable ? this.enableSelecting() : this.disableSelecting();
    }
  }

  /**
   * Enable selecting of event display elements and set mouse move and click events.
   */
  private enableSelecting() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) {
      return;
    }
    canvas.addEventListener('mousemove', this.onTouchMove, true);
    canvas.addEventListener('mousedown', this.onMouseDown, true);
    canvas.addEventListener('mouseup', this.onMouseUp, true);
    canvas.addEventListener('touchstart', this.onTouchDown);
    this.preSelectionAntialias = this.effectsManager.antialiasing;
    this.effectsManager.setAntialiasing(false);
  }

  /**
   * Disable selecting of event display elements and remove mouse move and click events.
   */
  private disableSelecting() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) {
      return;
    }
    canvas.removeEventListener('mousemove', this.onTouchMove, true);
    canvas.removeEventListener('mousedown', this.onMouseDown, true);
    canvas.removeEventListener('mouseup', this.onMouseUp, true);
    canvas.removeEventListener('touchstart', this.onTouchDown);

    // Clean up frame-based processing
    this.latestMouseEvent = null;
    this.frameCounter = 0;
    this.framesToSkip = 3; // Reset to default
    this.smoothedFPS = 60;

    // Clean up drag detection
    this.mouseDownPosition = null;
    this.isDragging = false;

    // Clear all outlines and selections
    this.effectsManager.clearAllSelections();
    this.effectsManager.setHoverOutline(null);
    this.selectedObjects.clear();
    this.hoveredObject = null;
    this.currentlyOutlinedObject = null;
    this.effectsManager.setAntialiasing(this.preSelectionAntialias);
  }

  /**
   * Function to call on mouse move when object selection is enabled.
   * Stacks events and only processes the latest one every few frames.
   * Also tracks dragging for click vs drag detection.
   */
  private onTouchMove = (event: any) => {
    // Stack the latest mouse event - this will replace any previous unstacked event
    this.latestMouseEvent = event;

    // Check if this is a drag operation
    if (this.mouseDownPosition && !this.isDragging) {
      const deltaX = event.clientX - this.mouseDownPosition.x;
      const deltaY = event.clientY - this.mouseDownPosition.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > this.clickThreshold) {
        this.isDragging = true;

        // Clear hover outline when drag starts to provide immediate visual feedback
        this.effectsManager.setHoverOutline(null);
        this.hoveredObject = null;
        this.currentlyOutlinedObject = null;
      }
    }
  };

  /**
   * Apply intersection result to selection outline using custom outline system.
   * Now handles both hover outlines and sticky selections.
   * Skips hover updates during drag operations to avoid visual noise.
   */
  public applyIntersectionResult(intersectedObject: Object3D | null) {
    // Skip hover outline updates during drag operations
    if (this.isDragging) {
      return;
    }

    let targetObject: Mesh | null = null;

    if (intersectedObject) {
      if (
        !this.ignoreList.includes(intersectedObject.type) &&
        intersectedObject instanceof Mesh
      ) {
        targetObject = intersectedObject;
      }
    }

    // Only update hover outline if the target object has changed
    if (targetObject !== this.hoveredObject) {
      this.hoveredObject = targetObject;

      // Set hover outline (this is separate from sticky selections)
      this.effectsManager.setHoverOutline(targetObject);

      // Also update the currently outlined object for backwards compatibility
      this.currentlyOutlinedObject = targetObject;
    }
  }

  /**
   * Function to call on mouse down to start drag detection.
   */
  private onMouseDown = (event: MouseEvent) => {
    this.mouseDownPosition = { x: event.clientX, y: event.clientY };
    this.isDragging = false;
  };

  /**
   * Function to call on mouse up to detect clicks vs drags.
   * Only triggers selection if the mouse hasn't moved significantly (not a drag).
   */
  private onMouseUp = (event: MouseEvent) => {
    if (!this.mouseDownPosition) {
      return; // No mousedown recorded
    }

    // Calculate distance moved
    const deltaX = event.clientX - this.mouseDownPosition.x;
    const deltaY = event.clientY - this.mouseDownPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Reset drag detection
    this.mouseDownPosition = null;
    this.isDragging = false;

    // Only process as a click if movement was minimal (not a drag)
    if (distance <= this.clickThreshold) {
      this.handleClick();
    }
  };

  /**
   * Function to call on mouse click when object selection is enabled.
   * Implements sticky multi-selection behavior:
   * - Click on object: toggle its selection (add if not selected, remove if selected)
   * - Click on empty space: clear all selections
   */
  private handleClick = () => {
    const intersectedObject = this.currentlyOutlinedObject;

    if (intersectedObject) {
      // Toggle selection of the clicked object
      const wasSelected = this.selectedObjects.has(intersectedObject);
      const isNowSelected =
        this.effectsManager.toggleSelection(intersectedObject);

      if (isNowSelected) {
        this.selectedObjects.add(intersectedObject);
      } else {
        this.selectedObjects.delete(intersectedObject);
      }

      // Update the info panel for the newly selected/deselected object
      this.updateInfoPanel(intersectedObject, isNowSelected);
    } else {
      // Clicked on empty space - clear all selections
      if (this.selectedObjects.size > 0) {
        this.effectsManager.clearAllSelections();
        this.selectedObjects.clear();

        // Clear the info panel
        this.selectedObject.name = '';
        this.selectedObject.attributes.splice(
          0,
          this.selectedObject.attributes.length,
        );
        this.activeObject.update('');
      }
    }
  };

  /**
   * Update the info panel for a selected/deselected object.
   * @param object The object that was clicked
   * @param isSelected Whether the object is now selected
   */
  private updateInfoPanel(object: Mesh, isSelected: boolean) {
    if (isSelected) {
      // Object was selected - update info panel
      this.selectedObject.name = object.name;
      this.selectedObject.attributes.splice(
        0,
        this.selectedObject.attributes.length,
      );
      this.activeObject.update(object.uuid);

      const prettyParams = PrettySymbols.getPrettyParams(object.userData);

      for (const key of Object.keys(prettyParams)) {
        this.selectedObject.attributes.push({
          attributeName: key,
          attributeValue: prettyParams[key],
        });
      }

      // Process properties of the selected object
      const props = Object.keys(object.userData)
        .map((key) => {
          // Only take properties that are a string or number (no arrays or objects)
          if (['string', 'number'].includes(typeof object.userData[key])) {
            return key + '=' + object.userData[key];
          }
        })
        .filter((val) => val);

      // Build the log text and add to the logger
      const log =
        object.name + (props.length > 0 ? ' with ' + props.join(', ') : '');
      if (log) {
        this.infoLogger.add(log, 'Selected');
      }
    } else {
      // Object was deselected
      const log = object.name || 'unnamed object';
      this.infoLogger.add(log, 'Deselected');

      // If this was the active object, clear the info panel
      if (this.activeObject.value === object.uuid) {
        this.selectedObject.name = '';
        this.selectedObject.attributes.splice(
          0,
          this.selectedObject.attributes.length,
        );
        this.activeObject.update('');
      }
    }
  }

  /**
   * Function to call on touch when object selection is enabled.
   * @param event Event containing touch data.
   */
  private onTouchDown = (event: TouchEvent) => {
    event.preventDefault();
    this.onTouchMove(event.targetTouches[0]);
    // For touch, we treat it as an immediate click (no drag detection for now)
    this.handleClick();
  };

  /**
   * Perform intersection calculation with the scene objects.
   * @param event Mouse event containing coordinates
   * @returns The intersected object or null
   */
  private intersectObject(event: MouseEvent): Object3D | null {
    const mouse = new Vector2();
    const raycaster = new Raycaster();

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rendererElement = this.effectsManager.composer.renderer.domElement;
    mouse.x = (event.clientX / rendererElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / rendererElement.clientHeight) * 2 + 1;

    // Set up raycaster
    raycaster.setFromCamera(mouse, this.getCamera());

    // Get all intersectable objects from the scene
    const intersectableObjects: Object3D[] = [];
    this.scene.traverse((obj) => {
      // Skip objects in ignore list
      if (this.ignoreList.includes(obj.type)) return;

      // Only include objects with geometry that are visible
      if ((obj as any).geometry && obj.visible) {
        intersectableObjects.push(obj);
      }
    });

    // Perform intersection test
    const intersects = raycaster.intersectObjects(intersectableObjects, false);

    return intersects.length > 0 ? intersects[0].object : null;
  }

  /**
   * Enable highlighting of the objects.
   */
  public enableHighlighting() {
    this.preSelectionAntialias = this.effectsManager.antialiasing;
    this.effectsManager.setAntialiasing(false);
  }

  /**
   * Highlight the object with the given uuid by giving it an outline.
   * @param uuid uuid of the object.
   * @param objectsGroup Group of objects to be traversed for finding the object
   * with the given uuid.
   */
  public highlightObject(uuid: string, objectsGroup: Object3D) {
    const object = objectsGroup.getObjectByProperty('uuid', uuid);
    if (object && object instanceof Mesh) {
      this.effectsManager.outlineObject(object);
      this.currentlyOutlinedObject = object;
      this.activeObject.update(object.uuid);
    }
  }

  /**
   * Disable highlighting of objects.
   */
  public disableHighlighting() {
    this.effectsManager.clearOutline();
    this.currentlyOutlinedObject = null;
    this.effectsManager.setAntialiasing(this.preSelectionAntialias);
  }

  /**
   * Process intersection only when there's a new mouse event to process.
   * This should be called once per render frame but only processes when mouse moves.
   */
  public processStackedIntersection(deltaTime: number): void {
    // Only process if we have a new mouse event
    if (!this.latestMouseEvent) {
      return; // No mouse event to process
    }

    // Calculate and smooth FPS
    const currentFPS = 1000 / deltaTime; // deltaTime in ms
    this.smoothedFPS =
      this.smoothedFPS * (1 - this.FPS_SMOOTHING) +
      currentFPS * this.FPS_SMOOTHING;

    // Adjust frame skipping based on smoothed FPS using hysteresis
    this.adjustFrameSkipping();

    this.frameCounter++;

    // Only process intersection every framesToSkip frames
    if (this.frameCounter >= this.framesToSkip) {
      this.frameCounter = 0; // Reset counter

      // Process the latest stacked mouse event
      const result = this.intersectObject(this.latestMouseEvent);
      this.applyIntersectionResult(result);

      // Clear the processed event to avoid reprocessing
      this.latestMouseEvent = null;
    }
  }

  /**
   * Adjust frame skipping based on FPS with hysteresis to prevent oscillation.
   */
  private adjustFrameSkipping(): void {
    const fps = this.smoothedFPS;
    const currentSkip = this.framesToSkip;
    let newSkip = currentSkip;

    // Determine new skip value based on FPS thresholds and current state
    if (fps < this.FPS_THRESHOLDS.TO_HIGH_SKIP && currentSkip < 8) {
      newSkip = 8; // Aggressive skipping for very low FPS
    } else if (fps < this.FPS_THRESHOLDS.TO_MED_SKIP && currentSkip < 5) {
      newSkip = 5; // Moderate skipping for low FPS
    } else if (fps > this.FPS_THRESHOLDS.TO_MINIMAL_SKIP && currentSkip > 1) {
      newSkip = 1; // Minimal skipping for high FPS
    } else if (fps > this.FPS_THRESHOLDS.TO_LOW_SKIP && currentSkip > 3) {
      newSkip = 3; // Low skipping for medium-good FPS
    }
    newSkip = 2;
    // Only change if it's different and log the decision
    if (newSkip !== currentSkip) {
      this.framesToSkip = newSkip;
    }
  }

  // Public methods for programmatic access to selection state

  /**
   * Get all currently selected objects.
   * @returns Set of selected mesh objects
   */
  public getSelectedObjects(): Set<Mesh> {
    return new Set(this.selectedObjects); // Return a copy to prevent external modification
  }

  /**
   * Get the currently hovered object (if any).
   * @returns The hovered mesh object or null
   */
  public getHoveredObject(): Mesh | null {
    return this.hoveredObject;
  }

  /**
   * Check if a specific object is currently selected.
   * @param object The object to check
   * @returns True if the object is selected
   */
  public isSelected(object: Mesh): boolean {
    return this.selectedObjects.has(object);
  }

  /**
   * Programmatically select an object (without triggering click events).
   * @param object The object to select
   * @returns True if the object was selected, false if already selected
   */
  public selectObject(object: Mesh): boolean {
    if (this.selectedObjects.has(object)) {
      return false; // Already selected
    }

    this.effectsManager.selectObject(object);
    this.selectedObjects.add(object);
    this.updateInfoPanel(object, true);
    return true;
  }

  /**
   * Programmatically deselect an object (without triggering click events).
   * @param object The object to deselect
   * @returns True if the object was deselected, false if not selected
   */
  public deselectObject(object: Mesh): boolean {
    if (!this.selectedObjects.has(object)) {
      return false; // Not selected
    }

    this.effectsManager.deselectObject(object);
    this.selectedObjects.delete(object);
    this.updateInfoPanel(object, false);
    return true;
  }

  /**
   * Programmatically toggle selection of an object.
   * @param object The object to toggle
   * @returns True if the object is now selected, false if deselected
   */
  public toggleObjectSelection(object: Mesh): boolean {
    if (this.selectedObjects.has(object)) {
      this.deselectObject(object);
      return false;
    } else {
      this.selectObject(object);
      return true;
    }
  }

  /**
   * Programmatically clear all selections.
   */
  public clearAllSelections(): void {
    if (this.selectedObjects.size > 0) {
      this.effectsManager.clearAllSelections();
      this.selectedObjects.clear();

      // Clear the info panel
      this.selectedObject.name = '';
      this.selectedObject.attributes.splice(
        0,
        this.selectedObject.attributes.length,
      );
      this.activeObject.update('');
    }
  }

  /**
   * Set the click threshold for drag detection.
   * @param threshold Maximum pixel distance to consider as a click (not drag)
   */
  public setClickThreshold(threshold: number): void {
    if (threshold > 0) {
      this.clickThreshold = threshold;
    }
  }

  /**
   * Get the current click threshold.
   * @returns Current click threshold in pixels
   */
  public getClickThreshold(): number {
    return this.clickThreshold;
  }
}
