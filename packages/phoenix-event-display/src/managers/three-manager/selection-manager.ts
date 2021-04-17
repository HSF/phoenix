import {
  Vector2,
  Raycaster,
  Camera,
  Scene,
  Object3D,
  DirectionalLight,
  AmbientLight,
  AxesHelper,
} from 'three';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { InfoLogger } from '../../helpers/info-logger';
import { EffectsManager } from './effects-manager';
import { PrettySymbols } from '../../helpers/pretty-symbols';
import { ActiveVariable } from '../../helpers/active-variable';

/**
 * Manager for managing event display's selection related functions.
 */
export class SelectionManager {
  /** Is initialized. */
  private isInit: boolean;
  /** The camera inside the scene. */
  private camera: Camera;
  /** The scene used for event display. */
  private scene: Scene;
  /** Object used to display the information of the selected 3D object. */
  private selectedObject: { name: string; attributes: any[] };
  /** The currently selected object which is observable for changes. */
  private activeObject = new ActiveVariable<string>('');
  /** Objects to be ignored on hovering over the scene. */
  private ignoreList: string[];

  // Post processing
  /** Outline pass for highlighting the hovered over event display elements. */
  private outlinePass: OutlinePass;
  /** Manager for managing three.js event display effects like outline pass and unreal bloom. */
  private effectsManager: EffectsManager;

  /** Service for logging data to the information panel. */
  private infoLogger: InfoLogger;
  /** Performance mode value before enabling selection. */
  private preSelectionAntialias: boolean;

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
   * @param camera The camera inside the scene.
   * @param scene The scene used for event display.
   * @param effectsManager Manager for managing three.js event display effects
   * like outline pass and unreal bloom.
   * @param infoLogger Service for logging data to the information panel.
   */
  public init(
    camera: Camera,
    scene: Scene,
    effectsManager: EffectsManager,
    infoLogger: InfoLogger
  ) {
    this.camera = camera;
    this.scene = scene;
    this.isInit = true;
    this.infoLogger = infoLogger;
    this.effectsManager = effectsManager;
    this.outlinePass = this.effectsManager.addOutlinePassForSelection();
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
      enable ? this.enableSelecting() : this.disableSelecting();
    }
  }

  /**
   * Enable selecting of event display elements and set mouse move and click events.
   */
  private enableSelecting() {
    document
      .getElementById('three-canvas')
      .addEventListener('mousemove', this.onTouchMove, true);
    document
      .getElementById('three-canvas')
      .addEventListener('click', this.onDocumentMouseDown, true);
    document
      .getElementById('three-canvas')
      .addEventListener('touchstart', this.onTouchDown);
    this.preSelectionAntialias = this.effectsManager.antialiasing;
    this.effectsManager.setAntialiasing(false);
  }

  /**
   * Disable selecting of event display elements and remove mouse move and click events.
   */
  private disableSelecting() {
    document
      .getElementById('three-canvas')
      .removeEventListener('mousemove', this.onTouchMove, true);
    document
      .getElementById('three-canvas')
      .removeEventListener('click', this.onDocumentMouseDown, true);
    document
      .getElementById('three-canvas')
      .removeEventListener('touchstart', this.onTouchDown);
    this.outlinePass.selectedObjects = [];
    this.effectsManager.setAntialiasing(this.preSelectionAntialias);
  }

  /**
   * Function to call on mouse move when object selection is enabled.
   */
  private onTouchMove = (event: any) => {
    const intersectedObject = this.intersectObject(event);
    if (intersectedObject) {
      if (this.ignoreList.includes(intersectedObject.type)) {
        return;
      }
      this.outlinePass.selectedObjects = [intersectedObject];
    }
  };

  /**
   * Function to call on mouse click when object selection is enabled.
   */
  private onDocumentMouseDown = () => {
    const intersectedObject = this.outlinePass.selectedObjects[0];
    if (intersectedObject) {
      this.selectedObject.name = intersectedObject.name;
      this.selectedObject.attributes.splice(
        0,
        this.selectedObject.attributes.length
      );

      this.activeObject.update(intersectedObject.uuid);

      const prettyParams = PrettySymbols.getPrettyParams(
        intersectedObject.userData
      );

      for (const key of Object.keys(prettyParams)) {
        this.selectedObject.attributes.push({
          attributeName: key,
          attributeValue: prettyParams[key],
        });
      }

      // Process properties of the selected object
      const props = Object.keys(intersectedObject.userData)
        .map((key) => {
          // Only take properties that are a string or number (no arrays or objects)
          if (
            ['string', 'number'].includes(
              typeof intersectedObject.userData[key]
            )
          ) {
            return key + '=' + intersectedObject.userData[key];
          }
        })
        .filter((val) => val);
      // Build the log text and add to the logger
      const log =
        intersectedObject.name +
        (props.length > 0 ? ' with ' + props.join(', ') : '');
      if (log) {
        this.infoLogger.add(log, 'Clicked');
      }
    }
  };

  /**
   * Function to call on touch when object selection is enabled.
   * @param event Event containing touch data.
   */
  private onTouchDown = (event: TouchEvent) => {
    event.preventDefault();
    this.onTouchMove(event.targetTouches[0]);
    this.onDocumentMouseDown();
  };

  /**
   * Check if any object intersects on mouse move.
   * @param event Event containing data of the mouse move.
   * @returns Intersected or hovered over object.
   */
  private intersectObject(event: any): Object3D {
    event.preventDefault?.();
    const mouse = new Vector2();
    const rendererElement = this.effectsManager.composer.renderer.domElement;
    mouse.x = (event.clientX / rendererElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / rendererElement.clientHeight) * 2 + 1;
    const raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    raycaster.params.Line.threshold = 3;
    const intersects = raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      // We want the closest one
      return intersects[0].object;
    }
  }

  /**
   * Highlight the object with the given uuid by giving it an outline.
   * @param uuid uuid of the object.
   * @param objectsGroup Group of objects to be traversed for finding the object
   * with the given uuid.
   */
  public highlightObject(uuid: string, objectsGroup: Object3D) {
    const object = objectsGroup.getObjectByProperty('uuid', uuid);
    if (object) {
      this.outlinePass.selectedObjects = [object];
    }
  }
}
