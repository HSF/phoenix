import { WebGLRenderer, Group, Camera, Vector3, BufferGeometry, Line, Scene } from "three";
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory'

// NOTE: This was created on 29/08/2020
// It might get outdated given how WebXR is still a work in progress

/**
 * VR manager for VR related operations.
 */
export class VRManager {
  /** Session type to use for VR. */
  static readonly SESSION_TYPE: string = 'immersive-vr';
  /** Whether the VR is currently active or not. */
  private vrActive: boolean = false;
  /** Renderer to set the VR session for. */
  private renderer: WebGLRenderer;
  /** Currently active VR session. */
  private currentVRSession: any = null;
  /** Callback to call when the VR session ends. */
  private onSessionEnded: () => void;
  /** Group containing the the camera for VR. */
  public cameraGroup: Group;
  /** The camera used by VR. */
  public vrCamera: Camera;

  /** The VR controller for movement. */
  private controller1: any;
  /** The VR controller for movement. */
  private controller2: any;
  /** The VR controller representation */
  private controllerGrip1: any;
  /** The VR controller representation */
  private controllerGrip2: any;

  /**
   * Set and configure the VR session.
   * @param renderer Renderer to set the VR session for.
   * @param onSessionEnded Callback to call when the VR session ends.
   */
  public setVRSession(renderer: WebGLRenderer, onSessionEnded?: () => void) {
    this.renderer = renderer;
    this.onSessionEnded = onSessionEnded;

    if ((navigator as any)?.xr) {
      const sessionInit = {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
      };
      (navigator as any)?.xr?.requestSession(VRManager.SESSION_TYPE, sessionInit)
        .then(this.onVRSessionStarted);

      this.setupVRControls();
    }
  }

  /**
   * Callback for when the VR session is started.
   * @param session The VR session.
   */
  private onVRSessionStarted = (session: any) => {
    this.vrActive = true;
    session.addEventListener('end', this.onVRSessionEnded);
    this.renderer.xr.setSession(session);
    this.currentVRSession = session;
  }

  /**
   * Callback when the VR session ends.
   */
  private onVRSessionEnded = () => {
    this.vrActive = false;
    this.currentVRSession?.removeEventListener('end', this.onVRSessionEnded);
    this.currentVRSession = null;
    this.onSessionEnded?.();
  }

  /**
   * End the current VR session.
   */
  public endVRSession() {
    this.currentVRSession?.end();
    this.getCameraGroup()?.remove(this.controller1);
    this.getCameraGroup()?.remove(this.controller2);
    this.getCameraGroup()?.remove(this.controllerGrip1);
    this.getCameraGroup()?.remove(this.controllerGrip2);
  }

  /**
   * Is the VR currently active or not.
   * @returns A boolean for whether the VR is active or not.
   */
  public isVRActive(): boolean {
    return this.vrActive;
  }

  /**
   * Get the group containing the camera for VR.
   * VR camera works by adding a Group with Camera to the scene.
   * @param camera Camera which is to be cloned for VR use.
   * @returns The camera group used in VR mode.
   */
  public getCameraGroup(camera?: Camera): Group {
    // Set up the camera position in the VR - Adding a group with camera does it
    if (!this.cameraGroup) {
      this.cameraGroup = new Group();
    }
    if (camera) {
      this.vrCamera = camera.clone();
      this.vrCamera.name = 'VR_CAMERA';

      this.cameraGroup.position.copy(this.vrCamera.position);
      this.cameraGroup.add(this.vrCamera);
    }

    return this.cameraGroup;
  }

  /**
   * Get the camera used by VR.
   * @returns The camera used by VR.
   */
  public getVRCamera() {
    return this.vrCamera;
  }

  /**
   * Set up VR controls for moving around the event display.
   */
  private setupVRControls() {
    // Distance for a single step
    const stepDistance = 30;
    // Unit vector in camera direction
    const direction = new Vector3();
    // Interval ID for the movement interval
    let intervalId: NodeJS.Timeout;

    // Get the controllers
    this.controller1 = this.renderer.xr.getController(0);
    this.getCameraGroup()?.add(this.controller1);
    this.controller2 = this.renderer.xr.getController(1);
    this.getCameraGroup()?.add(this.controller2);

    const controllerModelFactory = new XRControllerModelFactory();
    let controllerGrip1 = this.renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    this.getCameraGroup()?.add(controllerGrip1);

    let controllerGrip2 = this.renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    this.getCameraGroup()?.add(controllerGrip2);

    const geometry = new BufferGeometry().setFromPoints([new Vector3(0, 0, 0), new Vector3(0, 0, - 1)]);

    const line = new Line(geometry);
    line.name = 'line';
    line.scale.z = 50;

    this.controller1.add(line.clone());
    this.controller2.add(line.clone());

    this.controller1.addEventListener('selectstart', () => {
      console.log('Select: c1 position ' + this.controller1.position.toArray().join(', '));
      console.log('Select: CG position ' + this.cameraGroup.position.toArray().join(', '));

      // Start movement in camera direction
      intervalId = setInterval(() => {
        this.moveInDirection(direction, stepDistance);
      }, 20);
    });
    this.controller1.addEventListener('selectend', () => {
      // Stop the movement
      clearInterval(intervalId);
    });
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
    this.renderer.xr.getCamera(new Camera())?.getWorldDirection(direction);

    // Move the camera in the given direction
    this.cameraGroup.position.addScaledVector(direction, stepDistance);
    // this.vrCamera.position.addScaledVector(direction, stepDistance);
  }
}