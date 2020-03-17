import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Camera, PerspectiveCamera, OrthographicCamera } from 'three';
import { RendererManager } from './renderer-manager';

export class ControlsManager {
    // MEMBERS
    private activeControls: OrbitControls;
    private mainControls: OrbitControls;
    private overlayControls: OrbitControls;
    private controls: OrbitControls[];
    private perspectiveControls: OrbitControls;
    private orthographicControls: OrbitControls;


    // CONSTRUCTOR
    constructor(rendererManager: RendererManager) {
        this.controls = [];
        this.mainControls = null;
        this.overlayControls = null;
        // Arguments: FOV, aspect ratio, near and far distances
        const perspectiveCamera = new PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            100000
        );
        // Arguments: left, right, top, bottom, near and far distances
        const orthographicCamera = new OrthographicCamera(
            -window.innerWidth / 2,
            window.innerWidth / 2,
            window.innerHeight / 2,
            -window.innerHeight / 2,
            0.1,
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
    setActiveControls(controls: OrbitControls) {
        this.activeControls = controls;
    }
    setMainControls(controls: OrbitControls) {
        this.mainControls = controls;
    }
    setOverlayControls(controls: OrbitControls) {
        this.overlayControls = controls;
    }
    getActiveControls(): OrbitControls {
        return this.activeControls;
    }
    getMainControls(): OrbitControls {
        return this.mainControls;
    }
    getOverlayControls(): OrbitControls {
        return this.overlayControls;
    }
    getActiveCamera(): Camera {
        return this.activeControls.object;
    }
    getMainCamera(): Camera {
        return this.mainControls.object;
    }
    getOverlayCamera(): Camera {
        return this.overlayControls.object;
    }


    // FUNCTIONS
    public addControls(controls: OrbitControls): void {
        if (!this.containsObject(controls, this.controls)) { this.controls.push(controls); }
    }

    public removeControls(controls: OrbitControls): void {
        const index: number = this.controls.indexOf(controls);
        if (index > -1) {
            this.controls.splice(index, 1);
        }
    }

    public swapControls(): void {
        const temp: OrbitControls = this.mainControls;
        this.mainControls = this.overlayControls;
        // this._mainControls.autoRotate = temp.autoRotate;
        this.overlayControls = temp;
    }

    public updateSync(): void {
        for (const control of this.controls) {
            if (control === this.activeControls) { continue; }
            this.update(control);
        }
    }

    public update(controls: OrbitControls): void {
        controls.update();
    }

    public transformSync(): void {
        for (const control of this.controls) {
            if (control === this.activeControls) { continue; }
            this.positionSync(control);
            this.rotationSync(control);
        }
    }

    private positionSync(controls: OrbitControls): void {
        controls.object.position.set(
            this.activeControls.object.position.x,
            this.activeControls.object.position.y,
            this.activeControls.object.position.z);
        // controls.update();
    }

    private rotationSync(controls: OrbitControls): void {
        controls.target = this.activeControls.target;
        // controls.update();
    }

    private containsObject(obj: OrbitControls, list: OrbitControls[]): boolean {
        for (const object of list) {
            if (object === obj) {
                return true;
            }
        }

        return false;
    }

    private objectIndex(obj: OrbitControls, list: OrbitControls[]): number {
        for (let i = 0; i < list.length; i++) {
            if (list[i] === obj) {
                return i;
            }
        }

        return -1;
    }
}
