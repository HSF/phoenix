import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Camera } from 'three';

export class ControlsManager {
    // MEMBERS
    private _activeControls: OrbitControls;

    private _mainControls: OrbitControls;
    private _overlayControls: OrbitControls;
    private _controls: OrbitControls[];


    // CONSTRUCTOR
    constructor(activeControls: OrbitControls) {
        this._activeControls = activeControls;

        this._mainControls = null;
        this._overlayControls = null;
        this._controls = [];
    }


    // SET/GET
    set activeControls(controls: OrbitControls) {
        this._activeControls = controls;
    }
    set mainControls(controls: OrbitControls) {
        this._mainControls = controls;
    }
    set overlayControls(controls: OrbitControls) {
        this._overlayControls = controls;
    }

    get activeControls(): OrbitControls {
        return this._activeControls;
    }
    get mainControls(): OrbitControls {
        return this._mainControls;
    }
    get overlayControls(): OrbitControls {
        return this._overlayControls;
    }
    get activeCamera(): Camera {
        return this._activeControls.object;
    }
    get mainCamera(): Camera {
        return this._mainControls.object;
    }
    get overlayCamera(): Camera {
        return this._overlayControls.object;
    }


    // FUNCTIONS
    public addControls(controls: OrbitControls): void {
        if (!this.containsObject(controls, this._controls)) { this._controls.push(controls); }
    }

    public removeControls(controls: OrbitControls): void {
        const index: number = this._controls.indexOf(controls);
        if (index > -1) {
            this._controls.splice(index, 1);
        }
    }

    public swapControls(): void {
        const temp: OrbitControls = this._mainControls;
        this._mainControls = this._overlayControls;
        // this._mainControls.autoRotate = temp.autoRotate;
        this._overlayControls = temp;
    }

    public updateSync(): void {
        for (let i = 0; i < this._controls.length; i++) {
            if (this._controls[i] === this._activeControls) { continue; }

            this.update(this._controls[i]);
        }
    }

    public update(controls: OrbitControls): void {
        controls.update();
    }

    public transformSync(): void {
        for (let i = 0; i < this._controls.length; i++) {
            if (this._controls[i] === this._activeControls) { continue; }

            this.positionSync(this._controls[i]);
            this.rotationSync(this._controls[i]);
            // this._controls[i].update();
        }
    }

    private positionSync(controls: OrbitControls): void {
        controls.object.position.set(this._activeControls.object.position.x, this._activeControls.object.position.y, this._activeControls.object.position.z);
        // controls.update();
    }

    private rotationSync(controls: OrbitControls): void {
        controls.target = this._activeControls.target;
        // controls.update();
    }

    private containsObject(obj: OrbitControls, list: OrbitControls[]): boolean {
        for (let i = 0; i < list.length; i++) {
            if (list[i] === obj) {
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
