import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Camera } from 'three';

export class ControlsManager {
    // MEMBERS
    private activeControls: OrbitControls;

    private mainControls: OrbitControls;
    private overlayControls: OrbitControls;
    private controls: OrbitControls[];


    // CONSTRUCTOR
    constructor(activeControls: OrbitControls) {
        this.activeControls = activeControls;

        this.mainControls = null;
        this.overlayControls = null;
        this.controls = [];
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
