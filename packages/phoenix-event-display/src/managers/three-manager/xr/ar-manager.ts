import { PerspectiveCamera, Scene } from 'three';
import { SceneManager } from '../scene-manager';
import { XRManager, XRSessionType } from './xr-manager';

// NOTE: This was created on 28/06/2021
// It might become outdated given how WebXR is still a work in progress

// LAST UPDATED ON 07/07/2021

/**
 * AR manager for AR related operations.
 */
export class ARManager extends XRManager {
  /** Session type to use for AR. */
  static readonly SESSION_TYPE: string = 'immersive-ar';
  /** Whether to enable DOM overlay which shows Phoenix overlays on top of the AR scene. */
  public static enableDomOverlay: boolean = true;
  /** Previous values of scene scale, camera near and camera position. */
  private previousValues = {
    sceneScale: 1,
    cameraNear: 10,
  };

  /**
   * Create the AR manager.
   * @param scene The three.js scene.
   * @param camera Camera in the scene.
   * @override
   */
  constructor(private scene: Scene, private camera: PerspectiveCamera) {
    super(XRSessionType.AR);

    this.previousValues.sceneScale = scene.scale.x;
    this.previousValues.cameraNear = camera.near;
    this.sessionInit = () => {
      return ARManager.enableDomOverlay
        ? {
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body },
          }
        : {};
    };
  }

  /**
   * Callback for when the AR session is started.
   * @param session The AR session.
   * @override
   */
  protected async onXRSessionStarted(session: any) {
    document.body.style.setProperty('background-color', 'transparent');
    this.previousValues.sceneScale = this.scene.scale.x;
    this.previousValues.cameraNear = this.camera.near;
    this.scaleScene(0.00001);
    this.camera.near = 0.01;
    this.renderer.xr.setReferenceSpaceType('local');
    await super.onXRSessionStarted(session);
  }

  /**
   * Callback when the AR session ends.
   * @override
   */
  protected onXRSessionEnded() {
    document.body.style.removeProperty('background-color');
    this.scaleScene(this.previousValues.sceneScale);
    this.camera.near = this.previousValues.cameraNear;
    super.onXRSessionEnded();
  }

  /**
   * Scale the three.js scene.
   * @param scale Number to scale the scene to.
   */
  private scaleScene(scale: number) {
    [
      SceneManager.EVENT_DATA_ID,
      SceneManager.GEOMETRIES_ID,
      SceneManager.LABELS_ID,
    ].forEach((groupName) => {
      this.scene.getObjectByName(groupName)?.scale.setScalar(scale);
    });
  }
}
