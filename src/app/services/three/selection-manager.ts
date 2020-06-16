import {
    Vector2,
    Raycaster,
    Camera,
    Scene, Object3D, DirectionalLight, AmbientLight, AxesHelper, NormalBlending, WebGLRenderer
} from 'three';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ControlsManager } from './controls-manager';
import { InfoLoggerService } from '../infologger.service';
import { BehaviorSubject } from 'rxjs';

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
    private selectedObject: { name: string; attributes: any[]; };
    /** BehaviorSubject for the currently selected object. */
    private activeObject = new BehaviorSubject<string>('');
    /** Objects to be ignored on hovering over the scene. */
    private ignoreList: string[];

    // Post processing
    /** Effect composer for outline pass. */
    private composer: EffectComposer;
    /** Outline pass for highlighting the hovered over event display elements. */
    private outlinePass: OutlinePass;
    /** Render pass. */
    private renderPass: RenderPass;
    /** Service for logging data to the information panel. */
    private infoLogger: InfoLoggerService;

    /**
     * Constructor for the selection manager.
     */
    constructor() {
        this.isInit = false;
        this.ignoreList = [
            new AmbientLight().type,
            new DirectionalLight().type,
            new AxesHelper().type
        ];
    }

    /**
     * Initialize the selection manager.
     * @param camera The camera inside the scene.
     * @param scene The scene used for event display.
     * @param renderer The renderer used for event display.
     * @param infoLogger Service for logging data to the information panel.
     */
    public init(camera: Camera, scene: Scene, renderer: WebGLRenderer, infoLogger: InfoLoggerService) {
        this.camera = camera;
        this.scene = scene;
        this.isInit = true;
        this.infoLogger = infoLogger;
        this.initOutlinePass(camera, scene, renderer);
    }

    /**
     * Render the services of selection manager.
     * @param scene The scene used for event display.
     * @param controlsManager Manager responsible for managing three.js controls.
     */
    public render(scene: Scene, controlsManager: ControlsManager) {
        if (this.composer) {
            this.renderPass.scene = scene;
            this.renderPass.camera = controlsManager.getMainCamera();
            this.composer.render();
        }
    }

    /**
     * Set the currently selected object.
     * @param selectedObject The currently selected object.
     */
    public setSelectedObject(selectedObject: { name: string, attributes: any[] }) {
        this.selectedObject = selectedObject;
    }

    /**
     * Get the uuid of the currently selected object.
     * @returns uuid of the currently selected object.
     */
    public getActiveObjectId(): any {
        return this.activeObject;
    }

    /**
     * Set if selecting is to be enabled or disabled.
     * @param enable If selecting is to be enabled or disabled.
     */
    public setSelecting(enable: boolean) {
        if (this.isInit) {
            if (enable) {
                this.enableSelecting();
            } else {
                this.disableSelecting();
            }
        }
    }

    /**
     * Initialize the outline pass for highlighting hovered over event display elements.
     * @param camera The camera inside the scene.
     * @param scene The scene used for event display.
     * @param renderer The renderer used for event display.
     */
    private initOutlinePass(camera: Camera, scene: Scene, renderer: WebGLRenderer) {
        this.composer = new EffectComposer(renderer);
        this.renderPass = new RenderPass(scene, camera);
        this.composer.addPass(this.renderPass);
        this.outlinePass = new OutlinePass(new Vector2(window.innerWidth, window.innerHeight), scene, camera);
        this.outlinePass.overlayMaterial.blending = NormalBlending;
        this.composer.addPass(this.outlinePass);
        this.outlinePass.visibleEdgeColor.set(0xffff66);
        this.outlinePass.visibleEdgeColor.set(0xdf5330);
    }

    /**
     * Enable selecting of event display elements and set mouse move and click events.
     */
    private enableSelecting() {
        document.getElementById('three-canvas').addEventListener('mousemove',
            this.onTouchMove, true);
        document.getElementById('three-canvas').addEventListener('click',
            this.onDocumentMouseDown, true);
    }

    /**
     * Disable selecting of event display elements and remove mouse move and click events.
     */
    private disableSelecting() {
        document.getElementById('three-canvas').removeEventListener('mousemove',
            this.onTouchMove, true);
        document.getElementById('three-canvas').removeEventListener('click',
            this.onDocumentMouseDown, true);
        this.outlinePass.selectedObjects = [];
    }


    /**
     * Function to call on mouse move when object selection is enabled.
     */
    private onTouchMove = (event: any) => {
        const intersectedObject = this.intersectObject(event);
        if (intersectedObject) {
            if (this.ignoreList.includes(intersectedObject.type)) { return; }
            this.outlinePass.selectedObjects = [intersectedObject];
        }
    }

    /**
     * Function to call on mouse click when object selection is enabled.
     */
    private onDocumentMouseDown = () => {
        const intersectedObject = this.outlinePass.selectedObjects[0];
        if (intersectedObject) {
            this.selectedObject.name = intersectedObject.name;
            this.selectedObject.attributes.splice(0, this.selectedObject.attributes.length);

            this.activeObject.next(intersectedObject.uuid);

            for (const key of Object.keys(intersectedObject.userData)) {
                this.selectedObject.attributes.push({
                    attributeName: key,
                    attributeValue: intersectedObject.userData[key]
                });
            }

            // Process properties of the selected object
            const props = Object.keys(intersectedObject.userData).map((key) => {
                // Only take properties that are a string or number (no arrays or objects)
                if (['string', 'number'].includes(typeof (intersectedObject.userData[key]))) {
                    return key + '=' + intersectedObject.userData[key];
                }
            }).filter(val => val);
            // Build the log text and add to the logger
            const log = intersectedObject.name + (props.length > 0 ? ' with ' + props.join(', ') : '');
            this.infoLogger.add(log, 'Clicked');
        }
    }

    /**
     * Check if any object intersects on mouse move.
     * @param event Event containing data of the mouse move.
     * @returns Intersected or hovered over object.
     */
    private intersectObject(event: any): Object3D {
        event.preventDefault();
        const mouse = new Vector2();
        if (event.changedTouches) {
            mouse.x = event.changedTouches[0].pageX;
            mouse.y = event.changedTouches[0].pageY;
        } else {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }
        const raycaster = new Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        raycaster.params.Line.threshold = 3;
        // @ts-ignore
        const intersects = raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            // We want the closest one
            return intersects[0].object;
        }
    }

    /**
     * Highlight the object with the given uuid by giving it an outline.
     * @param uuid uuid of the object.
     * @param alLObjects Group of objects to be traversed for finding the object
     * with the given uuid.
     */
    public highlightObject(uuid: string, alLObjects: Object3D) {
        alLObjects.traverse((object: any) => {
            if (object.uuid === uuid) {
                this.outlinePass.selectedObjects = [object];
            }
        });
    }
}
