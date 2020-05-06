import {
    Vector2,
    Raycaster,
    Camera,
    Scene, Object3D, DirectionalLight, AmbientLight, AxesHelper, NormalBlending, Renderer, WebGLRenderer
} from 'three';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ControlsManager } from './controls-manager';
import { LoggerService } from '../logger.service';

export class SelectionManager {

    private isInit: boolean;
    private camera: Camera;
    private scene: Scene;
    // Object used to display the information of the selected 3D object.
    private selectedObject: { name: string; attributes: any[]; };
    private ignoreList: string[];
    // Post processing
    private composer: EffectComposer;
    private outlinePass: OutlinePass;
    private renderPass: RenderPass;
    // Logger
    private logger: LoggerService;

    constructor() {
        this.isInit = false;
        this.ignoreList = [
            new AmbientLight().type,
            new DirectionalLight().type,
            new AxesHelper().type
        ];
    }

    public init(camera: Camera, scene: Scene, renderer: WebGLRenderer, logger: LoggerService) {
        this.camera = camera;
        this.scene = scene;
        this.isInit = true;
        this.logger = logger;
        this.initOutlinePass(camera, scene, renderer);
    }

    public render(scene: Scene, controlsManager: ControlsManager) {
        if (this.composer) {
            this.renderPass.scene = scene;
            this.renderPass.camera = controlsManager.getMainCamera();
            this.composer.render();
        }
    }

    public setSelectedObject(selectedObject: { name: string, attributes: any[] }) {
        this.selectedObject = selectedObject;
    }

    public setSelecting(enable: boolean) {
        if (this.isInit) {
            if (enable) {
                this.enableSelecting();
            } else {
                this.disableSelecting();
            }
        }
    }

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

    private enableSelecting() {
        document.getElementById('three-canvas').addEventListener('mousemove',
            this.onTouchMove, true);
        document.getElementById('three-canvas').addEventListener('click',
            this.onDocumentMouseDown, true);
    }

    private disableSelecting() {
        document.getElementById('three-canvas').removeEventListener('mousemove',
            this.onTouchMove, true);
        document.getElementById('three-canvas').removeEventListener('click',
            this.onDocumentMouseDown, true);
        this.outlinePass.selectedObjects = [];
    }


    private onTouchMove = (event: any) => {
        const intersectedObject = this.intersectObject(event);
        if (intersectedObject) {
            if (this.ignoreList.includes(intersectedObject.type)) { return; }
            this.outlinePass.selectedObjects = [intersectedObject];
        }
    }


    private onDocumentMouseDown = () => {
        const intersectedObject = this.outlinePass.selectedObjects[0];
        if (intersectedObject) {
            this.selectedObject.name = intersectedObject.name;
            this.selectedObject.attributes.splice(0, this.selectedObject.attributes.length);

            for (const key of Object.keys(intersectedObject.userData)) {
                this.selectedObject.attributes.push({
                    attributeName: key,
                    attributeValue: intersectedObject.userData[key]
                });
            }
            
            // Process properties of the selected object
            const props = Object.keys(intersectedObject.userData).map((key) => {
                // Only take properties that are a string or number (no arrays or objects)
                if (['string', 'number'].includes(typeof(intersectedObject.userData[key]))) {
                    return key + '=' + intersectedObject.userData[key];
                }
            }).filter(val => val);
            // Build the log text and add to the logger
            const log = intersectedObject.name + (props.length > 0 ? ' with ' + props.join(', ') : '');
            this.logger.add(log, 'Clicked');
        }
    }


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

}
