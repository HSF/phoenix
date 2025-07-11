import {
  Vector2,
  Vector3,
  Raycaster,
  Camera,
  Scene,
  Object3D,
  DirectionalLight,
  AmbientLight,
  AxesHelper,
  Mesh,
} from 'three';
import * as TWEEN from '@tweenjs/tween.js';
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
  /** Function to get the current controls. */
  private getControls: () => any;
  /** Function to get the current overlay controls (optional). */
  private getOverlayControls: (() => any) | undefined;
  /** Function to get the overlay canvas DOM element (optional). */
  private getOverlayCanvas: (() => HTMLCanvasElement | undefined) | undefined;

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
  /** Mouse down position for drag detection (selection system) */
  private selectionMouseDownPosition: { x: number; y: number } | null = null;
  /** Maximum pixel distance to consider as a click (not drag) */
  private clickThreshold = 5;
  /** Whether the user is currently dragging (selection system) */
  private selectionIsDragging = false;

  // Double-click detection for collision coordinates
  /** Timestamp of the last click for double-click detection */
  private lastClickTime = 0;
  /** Maximum time between clicks to consider as double-click (ms) */
  private doubleClickThreshold = 300;
  /** Position of the last click for double-click validation */
  private lastClickPosition: { x: number; y: number } | null = null;
  /** Mouse down position for passive double-click detection */
  private passiveMouseDownPosition: { x: number; y: number } | null = null;

  /** Frame counter for intersection processing */
  private frameCounter = 0;
  /** Current number of frames to skip (dynamic) */
  private framesToSkip = 3;
  /** Smoothed FPS for stable decisions */
  private smoothedFPS = 60;
  /** FPS smoothing factor */
  private readonly FPS_SMOOTHING = 0.1;

  // Hysteresis thresholds to prevent oscillation
  /** Performance thresholds for dynamic frame skipping to maintain stable FPS. */
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
   *
   * Features enabled:
   * - Passive double-click detection on both main and overlay canvases
   * - Smooth Tween.js-based orbit target transitions
   * - Automatic canvas detection and appropriate controls routing
   * - Detailed collision information logging
   *
   * @param getControls Function to get the current main controls.
   * @param getOverlayControls Function to get the current overlay controls (optional).
   * @param getOverlayCanvas Function to get the overlay canvas DOM element (optional).
   * @param scene The scene used for event display.
   * @param effectsManager Manager for managing three.js event display effects
   * like outline pass and unreal bloom.
   * @param infoLogger Service for logging data to the information panel.
   */
  public init(
    getControls: () => any,
    getOverlayControls: (() => any) | undefined,
    getOverlayCanvas: (() => HTMLCanvasElement | undefined) | undefined,
    scene: Scene,
    effectsManager: EffectsManager,
    infoLogger: InfoLogger,
  ) {
    this.getControls = getControls;
    this.getOverlayControls = getOverlayControls;
    this.getOverlayCanvas = getOverlayCanvas;
    this.scene = scene;
    this.isInit = true;
    this.infoLogger = infoLogger;
    this.effectsManager = effectsManager;
    // Custom outline system is now used instead of OutlinePass

    // Always enable passive double-click detection for both canvases
    this.enablePassiveDoubleClick();
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
   * Enable passive double-click detection (always active, independent of selection).
   * Sets up event listeners for both main and overlay canvases.
   */
  private enablePassiveDoubleClick() {
    // Main canvas (always available)
    const mainCanvas = document.getElementById('three-canvas');
    if (mainCanvas) {
      mainCanvas.addEventListener('mousedown', this.onPassiveMouseDown, true);
      mainCanvas.addEventListener('mouseup', this.onPassiveMouseUp, true);
    }

    // Overlay canvas (available when overlay is created)
    this.setupOverlayListeners();
  }

  /**
   * Set up event listeners for overlay canvas if it exists.
   * This method can be called multiple times safely.
   */
  private setupOverlayListeners() {
    if (this.getOverlayCanvas) {
      const overlayCanvas = this.getOverlayCanvas();

      if (overlayCanvas) {
        // Remove existing listeners to avoid duplicates
        overlayCanvas.removeEventListener(
          'mousedown',
          this.onPassiveMouseDown,
          true,
        );
        overlayCanvas.removeEventListener(
          'mouseup',
          this.onPassiveMouseUp,
          true,
        );

        // Add new listeners
        overlayCanvas.addEventListener(
          'mousedown',
          this.onPassiveMouseDown,
          true,
        );
        overlayCanvas.addEventListener('mouseup', this.onPassiveMouseUp, true);
      }
    }
  }

  /**
   * Disable passive double-click detection for both canvases.
   */
  private disablePassiveDoubleClick() {
    // Main canvas
    const mainCanvas = document.getElementById('three-canvas');
    if (mainCanvas) {
      mainCanvas.removeEventListener(
        'mousedown',
        this.onPassiveMouseDown,
        true,
      );
      mainCanvas.removeEventListener('mouseup', this.onPassiveMouseUp, true);
    }

    // Overlay canvas
    if (this.getOverlayCanvas) {
      const overlayCanvas = this.getOverlayCanvas();

      if (overlayCanvas) {
        overlayCanvas.removeEventListener(
          'mousedown',
          this.onPassiveMouseDown,
          true,
        );
        overlayCanvas.removeEventListener(
          'mouseup',
          this.onPassiveMouseUp,
          true,
        );
      }
    }

    // Reset double-click state
    this.lastClickTime = 0;
    this.lastClickPosition = null;
    this.passiveMouseDownPosition = null;
  }

  /**
   * Passive mouse down handler for double-click detection only.
   */
  private onPassiveMouseDown = (event: MouseEvent) => {
    // Only track for double-click detection, don't interfere with selection
    // Using different variable names to avoid conflicts with selection system
    this.passiveMouseDownPosition = { x: event.clientX, y: event.clientY };
  };

  /**
   * Passive mouse up handler for double-click detection only.
   */
  private onPassiveMouseUp = (event: MouseEvent) => {
    if (!this.passiveMouseDownPosition) {
      return;
    }

    // Calculate distance moved (same logic as selection)
    const deltaX = event.clientX - this.passiveMouseDownPosition.x;
    const deltaY = event.clientY - this.passiveMouseDownPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Only process if it's a click (not a drag)
    if (distance <= this.clickThreshold) {
      // Check for double-click
      const currentTime = Date.now();
      const timeDelta = currentTime - this.lastClickTime;
      const clickPosition = { x: event.clientX, y: event.clientY };

      let isDoubleClick = false;
      if (this.lastClickPosition && timeDelta <= this.doubleClickThreshold) {
        const positionDelta = Math.sqrt(
          Math.pow(clickPosition.x - this.lastClickPosition.x, 2) +
            Math.pow(clickPosition.y - this.lastClickPosition.y, 2),
        );

        if (positionDelta <= this.clickThreshold) {
          isDoubleClick = true;
        }
      }

      if (isDoubleClick) {
        // Handle double-click without triggering selection
        this.handlePassiveDoubleClick(event);
      }

      // Update last click tracking
      this.lastClickTime = currentTime;
      this.lastClickPosition = clickPosition;
    }

    // Reset mouse down position
    this.passiveMouseDownPosition = null;
  };

  /**
   * Handle passive double-click events (works independently of selection state).
   * Automatically determines which canvas/controls to use based on the event target.
   * @param event The mouse event for collision detection
   */
  private handlePassiveDoubleClick = (event: MouseEvent) => {
    // Determine which canvas the event came from
    const isOverlayCanvas = this.isEventFromOverlayCanvas(event);
    const canvasType = isOverlayCanvas ? 'Overlay' : 'Main';

    console.log(`=== DOUBLE-CLICK ON ${canvasType.toUpperCase()} CANVAS ===`);

    const collision = this.getDetailedIntersection(event, isOverlayCanvas);

    if (collision) {
      const { object, point, face, faceIndex, uv } = collision;

      // Print detailed collision information
      console.log('=== DOUBLE-CLICK COLLISION DETECTED ===');
      console.log('Canvas:', canvasType);
      console.log('Object:', object.name || 'unnamed');
      console.log('Object UUID:', object.uuid);
      console.log('Collision Point (World):', {
        x: point.x.toFixed(4),
        y: point.y.toFixed(4),
        z: point.z.toFixed(4),
      });

      if (face) {
        console.log('Face Index:', faceIndex);
        console.log('Face Normal:', {
          x: face.normal.x.toFixed(4),
          y: face.normal.y.toFixed(4),
          z: face.normal.z.toFixed(4),
        });
      }

      if (uv) {
        console.log('UV Coordinates:', {
          u: uv.x.toFixed(4),
          v: uv.y.toFixed(4),
        });
      }

      console.log('Distance from Camera:', collision.distance.toFixed(4));
      console.log('=====================================');

      // Smoothly animate orbit target to the collision point using appropriate controls
      const controls = isOverlayCanvas
        ? this.getOverlayControls?.()
        : this.getControls();
      const controlsType = isOverlayCanvas ? 'overlay' : 'main';

      console.log(`Using ${controlsType} controls for orbit target animation`);
      console.log('Controls object:', controls);
      console.log('Controls.object (camera):', controls?.object);

      if (controls && controls.target) {
        // Store current target position for animation
        const currentTarget = {
          x: controls.target.x,
          y: controls.target.y,
          z: controls.target.z,
        };

        // Create tween for smooth transition
        const targetTween = new TWEEN.Tween(currentTarget)
          .to(
            {
              x: point.x,
              y: point.y,
              z: point.z,
            },
            1000,
          ) // 1 second duration
          .easing(TWEEN.Easing.Cubic.Out) // Smooth easing
          .onUpdate(() => {
            // Update controls target during animation
            controls.target.set(
              currentTarget.x,
              currentTarget.y,
              currentTarget.z,
            );
            controls.update();
          })
          .onComplete(() => {
            // Ensure final position is exact
            controls.target.copy(point);
            controls.update();
            console.log(
              `${controlsType} orbit target smoothly animated to collision point`,
            );
          });

        // Start the animation
        targetTween.start();
        console.log('Starting smooth orbit target animation');
      } else {
        console.warn(
          `${controlsType} controls or controls.target not available for orbit target update`,
        );
      }

      // Also log to the info logger for UI feedback
      this.infoLogger.add(
        `[${canvasType}] Collision at (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)}) on ${object.name || 'unnamed'} - Smoothly animating ${controlsType} orbit target`,
        'Double-Click',
      );
    } else {
      console.log(
        `Double-click detected on ${canvasType} canvas but no collision found`,
      );
      this.infoLogger.add(
        `[${canvasType}] Double-click detected (no collision)`,
        'Double-Click',
      );
    }
  };

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
    this.selectionMouseDownPosition = null;
    this.selectionIsDragging = false;

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
    if (this.selectionMouseDownPosition && !this.selectionIsDragging) {
      const deltaX = event.clientX - this.selectionMouseDownPosition.x;
      const deltaY = event.clientY - this.selectionMouseDownPosition.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > this.clickThreshold) {
        this.selectionIsDragging = true;

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
    if (this.selectionIsDragging) {
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

      // Update info panel for hovered object (immediate feedback)
      this.updateInfoPanelForHover(targetObject);

      // Also update the currently outlined object for backwards compatibility
      this.currentlyOutlinedObject = targetObject;
    }
  }

  /**
   * Function to call on mouse down to start drag detection.
   */
  private onMouseDown = (event: MouseEvent) => {
    this.selectionMouseDownPosition = { x: event.clientX, y: event.clientY };
    this.selectionIsDragging = false;
  };

  /**
   * Function to call on mouse up to detect clicks vs drags and double-clicks.
   * Only triggers selection if the mouse hasn't moved significantly (not a drag).
   * Detects double-clicks for collision coordinate display.
   */
  private onMouseUp = (event: MouseEvent) => {
    if (!this.selectionMouseDownPosition) {
      return; // No mousedown recorded
    }

    // Calculate distance moved
    const deltaX = event.clientX - this.selectionMouseDownPosition.x;
    const deltaY = event.clientY - this.selectionMouseDownPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Reset drag detection
    this.selectionMouseDownPosition = null;
    this.selectionIsDragging = false;

    // Only process as a click if movement was minimal (not a drag)
    if (distance <= this.clickThreshold) {
      // Handle single click for selection
      this.handleClick();
    }
  };

  /**
   * Handle double-click events with precise collision detection.
   * Performs detailed intersection and prints collision coordinates.
   * @param event The mouse event for collision detection
   */
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

      // Log the selection/deselection (no info panel update)
      this.logSelectionAction(intersectedObject, isNowSelected);
    } else {
      // Clicked on empty space - clear all selections
      if (this.selectedObjects.size > 0) {
        this.effectsManager.clearAllSelections();
        this.selectedObjects.clear();

        // Log that selections were cleared
        this.infoLogger.add('All selections cleared', 'Selection');
      }
    }
  };

  /**
   * Update the info panel for a hovered object (hover-only info display).
   * @param object The object being hovered, or null to clear
   */
  private updateInfoPanelForHover(object: Mesh | null) {
    if (object) {
      // Object is being hovered - update info panel
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
    } else {
      // No object being hovered - clear info panel
      this.selectedObject.name = '';
      this.selectedObject.attributes.splice(
        0,
        this.selectedObject.attributes.length,
      );
      this.activeObject.update('');
    }
  }

  /**
   * Log a selection/deselection action without updating the info panel.
   * @param object The object that was selected/deselected
   * @param isSelected Whether the object is now selected
   */
  private logSelectionAction(object: Mesh, isSelected: boolean) {
    // Process properties of the object for logging
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

    if (isSelected) {
      this.infoLogger.add(log || 'unnamed object', 'Selected');
    } else {
      this.infoLogger.add(log || 'unnamed object', 'Deselected');
    }
  }

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
    const controls = this.getControls();
    const camera = controls?.object as Camera;

    if (!camera) {
      console.warn(
        'SelectionManager: Camera not available from controls in intersectObject',
      );
      return null;
    }

    raycaster.setFromCamera(mouse, camera);

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
   * Perform detailed intersection calculation with complete collision information.
   * @param event Mouse event containing coordinates
   * @returns Detailed intersection data or null
   */
  private getDetailedIntersection(
    event: MouseEvent,
    useOverlay: boolean = false,
  ): {
    object: Mesh;
    point: Vector3;
    face: any | null; // Face type varies between Three.js versions
    faceIndex: number;
    distance: number;
    uv?: Vector2;
  } | null {
    const mouse = new Vector2();
    const raycaster = new Raycaster();

    // Get the appropriate controls and renderer based on canvas type
    let controls: any;
    let rendererElement: HTMLElement;

    if (useOverlay && this.getOverlayControls) {
      controls = this.getOverlayControls();
      const overlayCanvas = this.getOverlayCanvas?.();

      if (!controls || !overlayCanvas) {
        console.warn(
          'SelectionManager: Overlay controls or canvas not available',
        );
        return null;
      }

      rendererElement = overlayCanvas;
    } else {
      controls = this.getControls();
      rendererElement = this.effectsManager.composer.renderer.domElement;
    }

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / rendererElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / rendererElement.clientHeight) * 2 + 1;

    // Set up raycaster
    const camera = controls?.object as Camera;

    if (!camera) {
      const canvasType = useOverlay ? 'overlay' : 'main';
      console.warn(
        `SelectionManager: Camera not available from ${canvasType} controls in getDetailedIntersection`,
      );
      return null;
    }

    raycaster.setFromCamera(mouse, camera);

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

    // Perform intersection test with detailed results
    const intersects = raycaster.intersectObjects(intersectableObjects, false);

    if (intersects.length > 0) {
      const intersection = intersects[0];

      // Return detailed collision information
      return {
        object: intersection.object as Mesh,
        point: intersection.point,
        face: intersection.face || null,
        faceIndex: intersection.faceIndex || -1,
        distance: intersection.distance,
        uv: intersection.uv,
      };
    }

    return null;
  }

  /**
   * Enable highlighting of the objects.
   */
  public enableHighlighting() {
    this.preSelectionAntialias = this.effectsManager.antialiasing;
    this.effectsManager.setAntialiasing(false);
  }

  /**
   * Highlight the object with the given uuid by selecting it.
   * @param uuid uuid of the object.
   * @param objectsGroup Group of objects to be traversed for finding the object
   * with the given uuid.
   */
  public highlightObject(uuid: string, objectsGroup: Object3D) {
    const object = objectsGroup.getObjectByProperty('uuid', uuid);
    if (object && object instanceof Mesh) {
      // Use the modern selection system instead of legacy outline
      this.effectsManager.selectObject(object);
      this.selectedObjects.add(object);
      this.currentlyOutlinedObject = object;
      // Note: No info panel update - info panel is now hover-only
      this.logSelectionAction(object, true);
    }
  }

  /**
   * Disable highlighting of objects.
   */
  public disableHighlighting() {
    // Clear all selections instead of just the legacy outline
    this.effectsManager.clearAllSelections();
    this.selectedObjects.clear();
    this.currentlyOutlinedObject = null;
    this.effectsManager.setAntialiasing(this.preSelectionAntialias);

    // Note: No info panel clearing - info panel is now hover-controlled
    this.infoLogger.add('All selections cleared', 'Selection');
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
    this.logSelectionAction(object, true);
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
    this.logSelectionAction(object, false);
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

      // Note: No info panel clearing - info panel is now hover-controlled
      this.infoLogger.add('All selections cleared', 'Selection');
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

  /**
   * Set the double-click time threshold.
   * @param threshold Maximum time between clicks to consider as double-click (ms)
   */
  public setDoubleClickThreshold(threshold: number): void {
    if (threshold > 0) {
      this.doubleClickThreshold = threshold;
    }
  }

  /**
   * Get the current double-click time threshold.
   * @returns Current double-click threshold in milliseconds
   */
  public getDoubleClickThreshold(): number {
    return this.doubleClickThreshold;
  }

  /**
   * Update overlay event listeners when overlay canvas becomes available.
   * Called by ThreeManager when setOverlayRenderer is invoked.
   */
  public updateOverlayListeners() {
    this.setupOverlayListeners();
  }

  /**
   * Determine if a mouse event came from the overlay canvas.
   * @param event The mouse event to check
   * @returns true if the event came from the overlay canvas, false if from main canvas
   */
  private isEventFromOverlayCanvas(event: MouseEvent): boolean {
    const target = event.target as HTMLElement;

    // Check if the target is the overlay canvas
    if (this.getOverlayCanvas) {
      const overlayCanvas = this.getOverlayCanvas();

      if (overlayCanvas && target === overlayCanvas) {
        return true;
      }
    }

    return false;
  }
}
