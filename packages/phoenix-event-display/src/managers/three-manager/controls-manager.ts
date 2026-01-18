import { Tween } from '@tweenjs/tween.js';
import {
  Camera,
  PerspectiveCamera,
  OrthographicCamera,
  Object3D,
  Vector3,
  Group,
  Scene,
  Mesh,
  TubeGeometry,
  MathUtils,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RendererManager } from './renderer-manager';

/**
 * Manager for managing event display controls.
 */
export class ControlsManager {
  /** The main orbit controls. */
  private mainControls: OrbitControls;

  /** The secondary orbit controls for overlay renderer. */
  private secondaryControls?: OrbitControls;

  /** The renderer manager instance for accessing main and overlay renderers. */
  private renderr: any;

  /** Whether the overlay controls are linked to the main controls. */
  private _isOverlayLinked: boolean = false;
  /** Stored window resize handler for cleanup. */
  private resizeHandler: (() => void) | null = null;
  /** Stored OrbitControls change handler for cleanup. */
  private controlsChangeHandler: ((event: any) => void) | null = null;
  /** Track state for hideTubeTracksOnZoom. */
  private tracksHidden: boolean = false;
  /**
   * Constructor for setting up all the controls.
   * @param rendererManager The renderer manager to get the main renderer.
   * @param defaultView The default camera position as [x, y, z] coordinates.
   */
  constructor(
    rendererManager: RendererManager,
    defaultView: number[] = [0, 0, 200],
  ) {
    this.renderr = rendererManager;

    const rendererElement = rendererManager.getMainRenderer()?.domElement;
    const overlay_rendererElement =
      rendererManager.getOverlayRenderer()?.domElement;

    this.setMainControls(this.swapCameraType(rendererElement));

    this.getMainCamera().position.z = defaultView[2];
    this.getMainCamera().position.y = defaultView[1];
    this.getMainCamera().position.x = defaultView[0];
    if (defaultView.length >= 6) {
      this.mainControls.target = new Vector3(
        defaultView[3],
        defaultView[4],
        defaultView[5],
      );
    }

    this.setupResize(rendererElement);
  }

  // ====================================
  // INITIALIZATION & SETUP
  // ====================================

  /**
   * Set orbit controls for the camera.
   * @param camera The camera with which to create the orbit controls.
   * @param domElement DOM element of the renderer to associate the orbit controls with.
   * @returns Configured orbit controls.
   */
  private setOrbitControls(
    camera: Camera,
    domElement: HTMLElement,
  ): OrbitControls {
    const controls: OrbitControls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.autoRotate = false;

    return controls;
  }

  /**
   * Initialize overlay controls if an overlay renderer is available.
   * Creates orbit controls for the overlay camera using the same camera type as the main camera.
   */
  public initOverlayControls() {
    if (this.renderr.getOverlayRenderer()?.domElement) {
      const overlay_rendererElement = this.renderr.getOverlayRenderer()
        ?.domElement as HTMLCanvasElement;
      this.setOverlayControls(
        this.swapCameraType(this.getMainControls(), overlay_rendererElement),
      );
    }
  }

  /**
   * Set up to make camera(s) adapt to window resize.
   * @param rendererElement Canvas element of the main renderer.
   */
  private setupResize(rendererElement: HTMLCanvasElement) {
    // Remove previous resize listener if exists
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    // Store and add new resize listener
    this.resizeHandler = () => {
      const mainCamera = this.getMainCamera() as any;
      if (mainCamera instanceof OrthographicCamera) {
        const ratio =
          rendererElement.offsetWidth / rendererElement.offsetHeight;
        mainCamera.top = mainCamera.right / ratio;
        mainCamera.bottom = -mainCamera.right / ratio;
        mainCamera.updateProjectionMatrix();
      } else if (mainCamera instanceof PerspectiveCamera) {
        mainCamera.aspect =
          rendererElement.offsetWidth / rendererElement.offsetHeight;
        mainCamera.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  // ====================================
  // GETTERS & SETTERS
  // ====================================

  /**
   * Set the main orbit controls.
   * @param controls Orbit controls to be set as main.
   */
  private setMainControls(controls: OrbitControls) {
    if (this.mainControls) controls.autoRotate = this.mainControls.autoRotate;
    this.mainControls = controls;
  }

  /**
   * Set orbit controls for overlay.
   * @param controls Orbit controls to be set for overlay.
   */
  private setOverlayControls(controls: OrbitControls) {
    if (this.secondaryControls)
      controls.autoRotate = this.mainControls.autoRotate;
    this.secondaryControls = controls;
  }

  /**
   * Get the main orbit controls.
   * @returns Main orbit controls.
   */
  public getMainControls(): OrbitControls {
    return this.mainControls;
  }

  /**
   * Get orbit controls for overlay.
   * @returns Orbit controls for overlay.
   */
  public getOverlayControls(): OrbitControls | undefined {
    return this.secondaryControls;
  }

  /**
   * Get the main camera.
   * @returns Main camera.
   */
  public getMainCamera(): Camera {
    return this.mainControls.object as Camera;
  }

  /**
   * Get the camera for overlay.
   * @returns The camera for overlay.
   */
  public getOverlayCamera(): Camera | undefined {
    return this.secondaryControls?.object as Camera | undefined;
  }

  // ====================================
  // CAMERA TYPE MANAGEMENT
  // ====================================

  /**
   * Get the constructor type of the given camera.
   * @param camera The camera instance to check.
   * @returns The camera constructor (OrthographicCamera or PerspectiveCamera).
   */
  private returnType(camera: Camera) {
    return camera instanceof OrthographicCamera
      ? OrthographicCamera
      : PerspectiveCamera;
  }

  /**
   * Get the opposite constructor type of the given camera.
   * @param camera The camera instance to check.
   * @returns The opposite camera constructor (PerspectiveCamera if input is Orthographic, vice versa).
   */
  private returnReverseType(camera: Camera) {
    return camera instanceof PerspectiveCamera
      ? OrthographicCamera
      : PerspectiveCamera;
  }

  /**
   * Create a camera instance of the specified type with appropriate settings.
   * @param cameraClass The camera constructor (PerspectiveCamera or OrthographicCamera).
   * @param domElement The DOM element to use for aspect ratio and dimensions.
   * @returns A new camera instance configured for the given element.
   */
  private CameraFactory(
    cameraClass: typeof PerspectiveCamera | typeof OrthographicCamera,
    domElement: HTMLElement,
  ): Camera {
    if (cameraClass === OrthographicCamera) {
      return new OrthographicCamera(
        domElement.offsetWidth / -2,
        domElement.offsetWidth / 2,
        domElement.offsetHeight / 2,
        domElement.offsetHeight / -2,
        10,
        100000,
      );
    } else if (cameraClass === PerspectiveCamera) {
      return new PerspectiveCamera(
        75,
        domElement.offsetWidth / domElement.offsetHeight,
        10,
        100000,
      );
    }
  }

  /**
   * Swap camera type for given orbit controls or canvas element.
   * Creates new orbit controls with a different camera type while preserving position and target.
   * @param input Either existing OrbitControls or HTMLCanvasElement to create controls for.
   * @param overridden The canvas element to use (defaults to input's domElement if input is OrbitControls).
   * @param cameraType The target camera type (defaults to opposite of current camera type).
   * @param Iaspect The aspect ratio to use for the new camera.
   * @returns New OrbitControls with the swapped camera type.
   */
  private swapCameraType(
    input: OrbitControls | HTMLCanvasElement,
    overridden: HTMLCanvasElement = input instanceof OrbitControls
      ? (input.domElement as HTMLCanvasElement)
      : input,
    cameraType:
      | typeof PerspectiveCamera
      | typeof OrthographicCamera = input instanceof OrbitControls
      ? this.returnReverseType(input.object as Camera)
      : PerspectiveCamera,
    Iaspect: number = overridden.width / overridden.height,
  ): OrbitControls {
    const oldCamera =
      input instanceof OrbitControls ? (input.object as Camera) : null;

    const rendererElement = overridden as HTMLCanvasElement;

    const ortbitTarget =
      input instanceof OrbitControls ? input.target : new Vector3(0, 0, 0);

    const newCamera = this.CameraFactory(cameraType, rendererElement);

    this.syncCameras(oldCamera, newCamera, ortbitTarget, Iaspect);

    // OrbitControls has messy internals, and doesn't like changing the dom or the camera directly.
    const newControl = this.setOrbitControls(newCamera, rendererElement);
    newControl.target = ortbitTarget.clone();
    newControl.update();
    return newControl;
  }

  /**
   * Swap the camera type of orbit controls and create new controls with the new camera.
   * @param control Orbit controls to be reverted/swapped.
   * @returns New orbit controls with swapped camera type.
   */
  public revertCamerabyControl(control: OrbitControls): OrbitControls {
    return this.swapCameraType(control);
  }

  /**
   * Revert the camera to its inverse type. Default resulted type is Perspective.
   */
  public revertCameraType(camera: Camera) {
    if (camera === this.getMainCamera())
      this.setMainControls(this.revertCamerabyControl(this.getMainControls()));
    else if (!!this.getOverlayControls() && camera === this.getOverlayCamera())
      this.setOverlayControls(
        this.revertCamerabyControl(this.getOverlayControls()),
      );
  }

  // ====================================
  // CAMERA SYNCHRONIZATION
  // ====================================

  /**
   * Synchronize a perspective camera from an orthographic camera.
   * Calculates the appropriate distance and position for the perspective camera to match
   * the view frustum of the orthographic camera at the orbit target.
   * @param source The source orthographic camera to sync from.
   * @param target The target perspective camera to sync to.
   * @param orbitTarget The point in 3D space that both cameras should focus on.
   */
  private syncPersFromOrtho(
    source: OrthographicCamera,
    target: PerspectiveCamera,
    orbitTarget: Vector3,
  ) {
    const orthoHeight = (source.top - source.bottom) / source.zoom;
    const vFOV = MathUtils.degToRad(target.fov);
    const focusDist = orthoHeight / (2 * Math.tan(vFOV / 2));

    // Get the direction from the target to the source camera position
    const direction = new Vector3();
    direction.subVectors(source.position, orbitTarget).normalize();

    // Place the perspective camera at the correct distance along this direction
    target.position.copy(orbitTarget).addScaledVector(direction, focusDist);

    target.up.copy(source.up);
    target.lookAt(orbitTarget);
    target.updateProjectionMatrix();
  }

  /**
   * Synchronize an orthographic camera from a perspective camera.
   * Calculates the appropriate frustum bounds for the orthographic camera to match
   * the field of view of the perspective camera at the orbit target distance.
   * @param source The source perspective camera to sync from.
   * @param target The target orthographic camera to sync to.
   * @param orbitTarget The point in 3D space that both cameras should focus on.
   * @param forcedAspectRation Optional aspect ratio override for the orthographic camera.
   */
  private syncOrthoFromPers(
    source: PerspectiveCamera,
    target: OrthographicCamera,
    orbitTarget: Vector3,
    forcedAspectRation: number | undefined,
  ) {
    const vFOV = MathUtils.degToRad(source.getEffectiveFOV());
    const aspect = forcedAspectRation ?? source.aspect;

    const focusDist = source.position.distanceTo(orbitTarget);
    const height = 2 * Math.tan(vFOV / 2) * focusDist;
    const width = height * aspect;

    target.zoom = 1;
    target.left = -width / 2;
    target.right = width / 2;
    target.top = height / 2;
    target.bottom = -height / 2;

    target.position.copy(source.position);
    target.up.copy(source.up);
    target.lookAt(orbitTarget);
    target.updateProjectionMatrix();
  }

  /**
   * Synchronize camera properties between two cameras.
   * Handles synchronization between all camera type combinations:
   * - Same type: copies position, orientation, and camera-specific properties
   * - Different types: uses specialized sync methods to maintain equivalent views
   * @param source The source camera to copy properties from.
   * @param target The target camera to copy properties to.
   * @param orbitTarget The orbit target point for cross-type synchronization.
   * @param forcedAspectRation Optional aspect ratio override for orthographic cameras.
   */
  public syncCameras(
    source: Camera,
    target: Camera,
    orbitTarget: Vector3 = new Vector3(0, 0, 0),
    forcedAspectRation: number | undefined = undefined,
  ): void {
    // If both are the same type, clone relevant properties
    if (
      source instanceof PerspectiveCamera &&
      target instanceof PerspectiveCamera
    ) {
      target.position.copy(source.position);
      target.quaternion.copy(source.quaternion);
      target.up.copy(source.up);
      {
        target.fov = source.fov;
      }
      target.near = source.near;
      target.far = source.far;
      target.updateProjectionMatrix();
    } else if (
      source instanceof OrthographicCamera &&
      target instanceof OrthographicCamera
    ) {
      target.position.copy(source.position);
      target.quaternion.copy(source.quaternion);
      target.up.copy(source.up);

      target.left = source.left;
      target.right = source.right;
      target.top = source.right / (forcedAspectRation ?? 1);
      target.bottom = source.left / (forcedAspectRation ?? 1);

      target.zoom = source.zoom;
      target.near = source.near;
      target.far = source.far;
      target.updateProjectionMatrix();
    } else if (
      source instanceof PerspectiveCamera &&
      target instanceof OrthographicCamera
    ) {
      // Sync ortho from persp
      this.syncOrthoFromPers(source, target, orbitTarget, forcedAspectRation);
    } else if (
      source instanceof OrthographicCamera &&
      target instanceof PerspectiveCamera
    ) {
      // Sync persp from ortho
      this.syncPersFromOrtho(source, target, orbitTarget); // Extra checkers
    }
  }

  // ====================================
  // OVERLAY MANAGEMENT
  // ====================================

  /**
   * Check if the overlay is indeed linked to Main canva.
   * @returns returns _isOverlayLinked boolean.
   */
  public isOverlayLinked(): boolean {
    return this.getOverlayControls() && this._isOverlayLinked;
  }

  /**
   * Toggle the linking state between overlay and main controls.
   * just a signal to render() in index.ts to take the call for the sync
   */
  public linkOverlayToMain() {
    this._isOverlayLinked = !this._isOverlayLinked;
  }

  /**
   * Synchronize the overlay camera with the main camera.
   * Creates new overlay controls that match the main camera type and position,
   * then adjusts the viewport to maintain proper aspect ratio.
   */
  public syncOverlayFromMain() {
    const overlayControls = this.swapCameraType(
      this.getMainControls(),
      this.getOverlayControls().domElement as HTMLCanvasElement,
      this.returnType(this.getOverlayCamera()),
    );
    this.setOverlayControls(overlayControls);

    this.syncOverlayViewPort(1, 1, false);
  }

  // ====================================
  // VIEWPORT & ASPECT RATIO
  // ====================================

  /**
   * Adjust the aspect ratio of the overlay camera to match a new ratio.
   * @param ratio The new aspect ratio to apply to the overlay camera.
   */
  public readaptOverlayAspectRatio(ratio: number) {
    const camera = this.getOverlayCamera();
    this.syncCameras(camera, camera, new Vector3(0, 0, 0), ratio);
  }

  /**
   * Synchronize the overlay viewport with the given dimensions and ratios.
   * @param widthRatio The width scaling ratio to apply.
   * @param heightRatio The height scaling ratio to apply.
   * @param mitigateMotion Whether to compensate for camera movement during viewport changes.
   */
  public syncOverlayViewPort(
    widthRatio: number,
    heightRatio: number,
    mitigateMotion: boolean = true,
  ) {
    this.syncViewPort(
      this.getOverlayControls(),
      widthRatio,
      heightRatio,
      (this.isOverlayLinked()
        ? this.renderr.getOverlayRenderer()
        : this.getOverlayControls()
      ).domElement as HTMLCanvasElement,
      mitigateMotion,
    );
  }

  /**
   * Internal method to synchronize viewport dimensions for a specific control.
   * Handles both orthographic and perspective cameras with optional motion mitigation.
   * @param control The orbit controls to modify.
   * @param widthRatio The width scaling ratio to apply.
   * @param heightRatio The height scaling ratio to apply.
   * @param overridenCanva The canvas element to use for aspect ratio calculations.
   * @param mitigateMotion Whether to adjust camera position to minimize apparent movement.
   */
  private syncViewPort(
    control: OrbitControls,
    widthRatio: number,
    heightRatio: number,
    overridenCanva: HTMLCanvasElement,
    mitigateMotion: boolean = true,
  ) {
    const camera = control.object as Camera;
    const canva = this.renderr.getOverlayRenderer()
      .domElement as HTMLCanvasElement;
    const aspect = canva.width / canva.height;

    if (camera instanceof OrthographicCamera) {
      const matrix = camera.matrixWorld;
      const localLeft = new Vector3().setFromMatrixColumn(matrix, 0).negate(); // local -X
      const localUp = new Vector3().setFromMatrixColumn(matrix, 1); // local +Y

      // Store old effective values (accounting for zoom)
      const oldEffectiveRight = camera.right / camera.zoom;
      const oldEffectiveTop = camera.top / camera.zoom;

      // Calculate new values
      const newRight = camera.right * widthRatio;
      const newTop = newRight / aspect;
      const newEffectiveRight = newRight / camera.zoom;
      const newEffectiveTop = newTop / camera.zoom;

      if (mitigateMotion) {
        // Displacement based on effective differences
        const displacement = new Vector3()
          .addScaledVector(localLeft, oldEffectiveRight - newEffectiveRight)
          .addScaledVector(localUp, oldEffectiveTop - newEffectiveTop);

        // Apply the movement
        camera.position.add(displacement);
        control.target.add(displacement);
      }
      // Update camera bounds
      camera.left *= widthRatio;
      camera.right = newRight;
      camera.top = newTop;
      camera.bottom = camera.left / aspect;
      camera.updateProjectionMatrix();
    } else if (camera instanceof PerspectiveCamera) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
  }

  // ====================================
  // CONTEXT SWITCHING & CONTROLS
  // ====================================

  /**
   * Switch the roles of main and overlay controls.
   * Swaps the main camera controls with the overlay camera controls,
   * effectively making the overlay become the main view and vice versa.
   */
  public switchContexts() {
    if (this.getOverlayControls()) {
      // May not be always the same as the renderer canvas.
      const mainCameraCanvas = this.getMainControls()
        .domElement as HTMLCanvasElement;
      const overlayCameraCanvas = this.getMainControls()
        .domElement as HTMLCanvasElement;

      const overlayControls = this.swapCameraType(
        this.getMainControls(),
        this.getOverlayControls().domElement as HTMLCanvasElement,
        this.returnType(this.getMainCamera()),
      );

      const mainControls = this.swapCameraType(
        this.getOverlayControls(),
        this.renderr.getMainRenderer().domElement,
        this.returnType(this.getOverlayCamera()),
      );

      this.setMainControls(mainControls);
      this.setOverlayControls(overlayControls);
    }
  }

  /**
   * Update orbit controls.
   * @param controls Orbit controls to be updated.
   */
  public update(controls: OrbitControls): void {
    controls.update();
  }

  // ====================================
  // ANIMATION & INTERACTION
  // ====================================

  /**
   * Zoom all the cameras by a specific zoom factor.
   * The factor may either be greater or smaller.
   * @param zoomFactor The factor to zoom by.
   * @param zoomTime The time it takes for a zoom animation to complete.
   */
  public zoomTo(zoomFactor: number, zoomTime: number) {
    const mainCamera = this.getMainCamera();
    const target = this.mainControls.target.clone();

    if (mainCamera instanceof OrthographicCamera) {
      mainCamera.left /= zoomFactor;
      mainCamera.right /= zoomFactor;
      mainCamera.top /= zoomFactor;
      mainCamera.bottom /= zoomFactor;
      mainCamera.updateProjectionMatrix();
    } else if (mainCamera instanceof PerspectiveCamera) {
      const direction = new Vector3().subVectors(mainCamera.position, target);
      direction.multiplyScalar(zoomFactor);
      mainCamera.position.copy(target.clone().add(direction));
    }

    if (this.isOverlayLinked()) {
      this.syncOverlayFromMain();
    }
  }

  /**
   * Move the camera to look at the object with the given uuid.
   * @param uuid uuid of the object.
   * @param objectsGroup Group of objects to be traversed for finding the object
   * with the given uuid.
   */
  public lookAtObject(
    uuid: string,
    objectsGroup: Object3D,
    offset: number = 0,
  ) {
    const origin = new Vector3(0, 0, 0);

    const objectPosition = this.getObjectPosition(uuid, objectsGroup);
    if (objectPosition) {
      // Moving the camera to the object's position and then zooming out
      new Tween(this.getMainCamera().position)
        .to(
          {
            x: objectPosition.x * 1.1 + offset,
            y: objectPosition.y * 1.1 + offset,
            z: objectPosition.z * 1.1 + offset,
          },
          200,
        )
        .start();
    }
  }

  /**
   * Get position of object from UUID.
   * @param uuid UUID of the object.
   * @param objectsGroup Objects group to look into for the object.
   * @returns Position of the 3D object.
   */
  public getObjectPosition(uuid: string, objectsGroup: Object3D): Vector3 {
    const object = objectsGroup.getObjectByProperty('uuid', uuid) as any;

    if (object) {
      const origin = new Vector3(0, 0, 0);
      let objectPosition = new Vector3();

      if (object instanceof Group) {
        // If it is a group of other event data we traverse through it
        object.traverse((childObject: any) => {
          // Make sure the child is not a group (e.g Track is a group)
          if (childObject.children.length === 0) {
            if (childObject.position.equals(origin)) {
              // Get the max vector from the bounding box to accumulate with the clusters
              if (childObject.geometry?.boundingSphere) {
                try {
                  objectPosition.add(
                    childObject.geometry.boundingSphere.getBoundingBox().max,
                  );
                } catch (e) {
                  objectPosition.add(
                    childObject.geometry.boundingSphere?.center,
                  );
                }
              }
            } else {
              objectPosition.add(childObject.position);
            }
          }
        });
      } else if (object.position.equals(origin)) {
        // Get the center of bounding sphere of objects with no position
        objectPosition = object.geometry?.boundingSphere?.center;
      } else {
        // Get the object position for all other elements
        objectPosition = object.position;
      }

      return objectPosition;
    } else {
      return new Vector3();
    }
  }

  /**
   * Hide tube geometry of tracks on zoom if the camera is too close.
   * (For visibility of vertices)
   * @param scene Scene to look in for tracks.
   * @param minRadius Radius after which the tube tracks should be invisible.
   */
  public hideTubeTracksOnZoom(scene: Scene, minRadius: number) {
    // Remove previous change listener if exists
    if (this.controlsChangeHandler) {
      this.mainControls.removeEventListener(
        'change',
        this.controlsChangeHandler,
      );
    }

    // Reset tracks hidden state
    this.tracksHidden = false;
    const origin = new Vector3();

    // Store and add new change listener
    this.controlsChangeHandler = (event: any) => {
      const isCameraClose =
        (event?.target?.object?.position as Vector3).distanceTo(origin) <
        minRadius;
      if (isCameraClose && !this.tracksHidden) {
        scene.getObjectByName('Tracks')?.traverse((track) => {
          if (
            track.name === 'Track' &&
            (track as Mesh).geometry instanceof TubeGeometry
          ) {
            track.visible = false;
          }
        });
        this.tracksHidden = true;
      } else if (!isCameraClose && this.tracksHidden) {
        scene.getObjectByName('Tracks')?.traverse((track) => {
          if (
            track.name === 'Track' &&
            (track as Mesh).geometry instanceof TubeGeometry
          ) {
            track.visible = true;
          }
        });
        this.tracksHidden = false;
      }
    };
    this.mainControls.addEventListener('change', this.controlsChangeHandler);
  }

  // ====================================
  // UTILITY METHODS
  // ====================================

  /**
   * Check if the list of orbit controls contains a specific orbit controls.
   * @param obj Orbit controls to be checked for containment.
   * @param list List of orbit controls.
   * @returns If the list contains the orbit controls.
   */
  private containsObject(obj: OrbitControls, list: OrbitControls[]): boolean {
    for (const object of list) {
      if (object === obj) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get the index of orbit controls from a list of orbit controls.
   * @param obj Orbit controls whose index is to be obtained.
   * @param list List of orbit controls.
   * @returns Index of the orbit controls in the given list. Returns -1 if not found.
   */
  private objectIndex(obj: OrbitControls, list: OrbitControls[]): number {
    for (let i = 0; i < list.length; i++) {
      if (list[i] === obj) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Cleanup event listeners before re-initialization.
   */
  public cleanup() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.controlsChangeHandler && this.mainControls) {
      this.mainControls.removeEventListener(
        'change',
        this.controlsChangeHandler,
      );
      this.controlsChangeHandler = null;
    }
  }
}
