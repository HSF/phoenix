import { WebGLRenderer, Vector3, BufferGeometry, Line } from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory';
import { XRManager, XRSessionType } from './xr-manager';

// NOTE: This was created on 29/08/2020
// It might become outdated given how WebXR is still a work in progress

// LAST UPDATED ON 20/06/2021

/**
 * VR manager for VR related operations.
 */
export class VRManager extends XRManager {
  /** Session type to use for VR. */
  static readonly SESSION_TYPE: string = 'immersive-vr';
  /** The VR controller for movement. */
  private controller1: any;
  /** The VR controller for movement. */
  private controller2: any;
  /** The VR controller representation */
  private controllerGrip1: any;
  /** The VR controller representation */
  private controllerGrip2: any;

  /** Listener for when the "Select Start" button is pushed. */
  private onControllerSelectStart: () => void;
  /** Listener for when the "Select Start" button is released. */
  private onControllerSelectEnd: () => void;

  /**
   * Create the VR manager.
   * @override
   */
  constructor() {
    super(XRSessionType.VR);
    this.sessionInit = () => ({
      optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
    });
  }

  /**
   * Set and configure the VR session.
   * @param renderer Renderer to set the VR session for.
   * @param onSessionStarted Callback to call when the VR session starts.
   * @param onSessionEnded Callback to call when the VR session ends.
   * @override
   */
  public setXRSession(
    renderer: WebGLRenderer,
    onSessionStarted?: () => void,
    onSessionEnded?: () => void
  ) {
    super.setXRSession(renderer, onSessionStarted, onSessionEnded);
    this.setupVRControls();
  }

  /**
   * Callback when the VR session ends.
   * @override
   */
  protected onXRSessionEnded() {
    super.onXRSessionEnded();

    this.controller1?.removeEventListener(
      'selectstart',
      this.onControllerSelectStart
    );
    this.controller1?.removeEventListener(
      'selectend',
      this.onControllerSelectEnd
    );
  }

  /**
   * Set up VR controls for moving around the event display.
   */
  private setupVRControls() {
    // Get the controllers
    this.controller1 = this.renderer.xr.getController(0);
    this.getCameraGroup().add(this.controller1);
    this.controller2 = this.renderer.xr.getController(1);
    this.getCameraGroup().add(this.controller2);

    const controllerModelFactory = new XRControllerModelFactory();
    this.controllerGrip1 = this.renderer.xr.getControllerGrip(0);
    this.controllerGrip1.add(
      controllerModelFactory.createControllerModel(this.controllerGrip1)
    );
    this.getCameraGroup().add(this.controllerGrip1);

    this.controllerGrip2 = this.renderer.xr.getControllerGrip(1);
    this.controllerGrip2.add(
      controllerModelFactory.createControllerModel(this.controllerGrip2)
    );
    this.getCameraGroup().add(this.controllerGrip2);

    const geometry = new BufferGeometry().setFromPoints([
      new Vector3(0, 0, 0),
      new Vector3(0, 0, -1),
    ]);

    const line = new Line(geometry);
    line.name = 'line';
    line.scale.z = 50;

    this.controller1.add(line.clone());
    this.controller2.add(line.clone());

    // Set up movement

    // Distance for a single step
    const stepDistance = 30;
    // Unit vector in camera direction
    const direction = new Vector3();
    // Interval ID for the movement interval
    let intervalId: NodeJS.Timeout;

    this.onControllerSelectStart = () => {
      console.log(
        'Select: c1 position ' + this.controller1.position.toArray().join(', ')
      );
      console.log(
        'Select: CG position ' + this.cameraGroup.position.toArray().join(', ')
      );

      // Start movement in camera direction
      intervalId = setInterval(() => {
        this.moveInDirection(direction, stepDistance);
      }, 20);
    };

    this.onControllerSelectEnd = () => {
      // Stop the movement
      clearInterval(intervalId);
    };

    this.controller1.addEventListener(
      'selectstart',
      this.onControllerSelectStart
    );
    this.controller1.addEventListener('selectend', this.onControllerSelectEnd);
  }

  /**
   * Move the camera in the given direction.
   * @param direction Direction to move towards.
   * @param stepDistance Distance to move by.
   */
  private moveInDirection(direction: Vector3, stepDistance: number) {
    // Get the direction the controller is facing
    //! this.controller.getWorldDirection(direction);

    // Get direction the camera is facing
    this.xrCamera?.getWorldDirection(direction);

    // Move the camera in the given direction
    this.cameraGroup.position.addScaledVector(direction, stepDistance);
    this.xrCamera.position.addScaledVector(direction, stepDistance);
  }
}
