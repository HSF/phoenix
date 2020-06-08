import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Camera, PerspectiveCamera, OrthographicCamera } from 'three';
import { RendererManager } from './renderer-manager';

/**
 * Manager for managing event display controls.
 */
export class ControlsManager {
    /** Currently active orbit controls. */
    private activeControls: OrbitControls;
    /** The main orbit controls. */
    private mainControls: OrbitControls;
    /** Orbit controls for overlay view. */
    private overlayControls: OrbitControls;
    /** All orbit controls. */
    private controls: OrbitControls[];
    /** Orbit controls for the perspective view. */
    private perspectiveControls: OrbitControls;
    /** Orbit controls for the orthographic view. */
    private orthographicControls: OrbitControls;

    /**
     * Constructor for setting up all the controls.
     * @param rendererManager The renderer manager to get the main renderer.
     */
    constructor(rendererManager: RendererManager) {
        this.controls = [];
        this.mainControls = null;
        this.overlayControls = null;
        // Arguments: FOV, aspect ratio, near and far distances
        const perspectiveCamera = new PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            10,
            100000
        );
        // Arguments: left, right, top, bottom, near and far distances
        const orthographicCamera = new OrthographicCamera(
            -window.innerWidth / 2,
            window.innerWidth / 2,
            window.innerHeight / 2,
            -window.innerHeight / 2,
            10,
            100000
        );
        // Orbit controls allow to move around
        this.perspectiveControls = this.setOrbitControls(
            perspectiveCamera,
            rendererManager.getMainRenderer().domElement
        );
        this.orthographicControls = this.setOrbitControls(
            orthographicCamera,
            rendererManager.getMainRenderer().domElement
        );
        perspectiveCamera.position.z = orthographicCamera.position.z = 200;
        // Set active orbit controls
        this.addControls(this.perspectiveControls);
        this.addControls(this.orthographicControls);
        this.setActiveControls(this.perspectiveControls);
        this.setMainControls(this.perspectiveControls);
        this.setOverlayControls(this.orthographicControls);
        // Add listener
        this.getActiveControls().addEventListener(
            'change', () => {
                this.transformSync();
                this.updateSync();
            }
        );
    }

    /**
     * Set orbit controls for the camera.
     * @param camera The camera with which to create the orbit controls.
     * @param domElement DOM element of the renderer to associate the orbit controls with.
     * @returns Configured orbit controls.
     */
    private setOrbitControls(
        camera: PerspectiveCamera | OrthographicCamera,
        domElement?: HTMLElement
    ): OrbitControls {
        const controls: OrbitControls = new OrbitControls(camera, domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enableZoom = true;
        controls.autoRotate = false;

        return controls;
    }

    // SET/GET

    /**
     * Set the currently active orbit controls.
     * @param controls Orbit controls to be set as active.
     */
    setActiveControls(controls: OrbitControls) {
        this.activeControls = controls;
    }
    /**
     * Set the main orbit controls.
     * @param controls Orbit controls to be set as main.
     */
    setMainControls(controls: OrbitControls) {
        this.mainControls = controls;
    }
    /**
     * Set orbit controls for overlay.
     * @param controls Orbit controls to be set for overlay.
     */
    setOverlayControls(controls: OrbitControls) {
        this.overlayControls = controls;
    }
    /**
     * Get currently active orbit controls.
     * @returns Currently active orbit controls.
     */
    getActiveControls(): OrbitControls {
        return this.activeControls;
    }
    /**
     * Get the main orbit controls.
     * @returns Main orbit controls.
     */
    getMainControls(): OrbitControls {
        return this.mainControls;
    }
    /**
     * Get orbit controls for overlay.
     * @returns Orbit controls for overlay.
     */
    getOverlayControls(): OrbitControls {
        return this.overlayControls;
    }
    /**
     * Get the currently active camera.
     * @returns Currently active camera.
     */
    getActiveCamera(): Camera {
        return this.activeControls.object;
    }
    /**
     * Get the main camera.
     * @returns Main camera.
     */
    getMainCamera(): Camera {
        return this.mainControls.object;
    }
    /**
     * Get the camera for overlay.
     * @returns The camera for overlay.
     */
    getOverlayCamera(): Camera {
        return this.overlayControls.object;
    }


    // FUNCTIONS

    /**
     * Add orbit controls to the controls list.
     * @param controls Orbit controls to be added.
     */
    public addControls(controls: OrbitControls): void {
        if (!this.containsObject(controls, this.controls)) { this.controls.push(controls); }
    }

    /**
     * Remove orbit controls from the controls list.
     * @param controls Orbit controls to be removed.
     */
    public removeControls(controls: OrbitControls): void {
        const index: number = this.controls.indexOf(controls);
        if (index > -1) {
            this.controls.splice(index, 1);
        }
    }

    /**
     * Swap the main and overlay orbit controls.
     */
    public swapControls(): void {
        const temp: OrbitControls = this.mainControls;
        this.mainControls = this.overlayControls;
        // this._mainControls.autoRotate = temp.autoRotate;
        this.overlayControls = temp;
    }

    /**
     * Synchronously update all controls.
     */
    public updateSync(): void {
        for (const control of this.controls) {
            if (control === this.activeControls) { continue; }
            this.update(control);
        }
    }

    /**
     * Update orbit controls.
     * @param controls Orbit controls to be updated.
     */
    public update(controls: OrbitControls): void {
        controls.update();
    }

    /**
     * Synchronously transform the controls by updating the position and rotation.
     */
    public transformSync(): void {
        for (const control of this.controls) {
            if (control === this.activeControls) { continue; }
            this.positionSync(control);
            this.rotationSync(control);
        }
    }

    /**
     * Synchronously update position of the orbit controls.
     * @param controls Orbit controls whose position is to be updated.
     */
    private positionSync(controls: OrbitControls): void {
        controls.object.position.set(
            this.activeControls.object.position.x,
            this.activeControls.object.position.y,
            this.activeControls.object.position.z);
        // controls.update();
    }

    /**
     * Synchronously update rotation of the orbit controls.
     * @param controls Controls whose rotation is to be updated.
     */
    private rotationSync(controls: OrbitControls): void {
        controls.target = this.activeControls.target;
        // controls.update();
    }

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
}
