import { Scene, Object3D, Color, LineSegments, Mesh, MeshPhongMaterial, LineBasicMaterial, Vector3, Group, AxesHelper, AmbientLight, DirectionalLight, Line, MeshBasicMaterial, Material, Points, PointsMaterial } from 'three';
import { Cut } from '../extras/cut.model';


export class SceneManager {
    public static EVENT_DATA_ID = 'EventData';
    public static GEOMETRIES_ID = 'Geometries';

    private scene: Scene;
    private ignoreList: string[];
    // Axis
    private axis: AxesHelper;

    constructor(ignoreList: string[]) {
        this.getScene();
        this.ignoreList = ignoreList;
        this.scene.background = new Color('hsl(0, 0%, 100%)');
        this.axis = null;
        this.setLights();
    }

    /**
     * Initializes the lights of the screen.
     */
    private setLights() {
        const ambientLight = new AmbientLight(0x404040);
        const directionalLight1 = new DirectionalLight(0xbfbfbf);
        const directionalLight2 = new DirectionalLight(0xbfbfbf);

        directionalLight1.position.set(-100, -50, 100);
        directionalLight2.position.set(100, 50, -100);

        this.scene.add(directionalLight1);
        this.scene.add(directionalLight2);
        this.scene.add(ambientLight);
    }

    public getScene(): Scene {
        if (!this.scene) {
            this.scene = new Scene();
        }
        return this.scene;
    }

    /**
     * Creates a cleaned copy of a scene.
     * @param scene Scene to copy and clean.
     * @returns a clean scene
     */
    public getCleanScene(): Scene {
        const clearScene: Scene = this.scene.clone();
        const removeList = [];

        clearScene.traverse((object: Object3D) => {
            if (this.ignoreList.includes(object.type)) {
                removeList.push(object);
            }
        });

        clearScene.remove(...removeList);

        return clearScene;
    }

    /**
     * Sets the background dark/white.
     */
    public darkBackground(dark: boolean) {
        let background = 0xffffff;
        if (dark) {
            background = 0x0;
        }
        if (this.scene) {
            this.scene.background = new Color(background);
        }
    }

    /**
     * Modifies an object's opacity.
     * @param name Name of the object to change its opacity.
     * @param value Value of opacity, between 0 (transparent) and 1 (opaque).
     */
    public setGeometryOpacity(name: string, value: number) {
        const object = this.scene.getObjectByName(name);

        if (value) {
            object.traverse((o) => {
                if (o instanceof Mesh && o.material instanceof Material) {
                    o.material.transparent = true;
                    o.material.opacity = value;
                }
            });
        }
    }


    /**
     * Changes color to an OBJ geometry.
     * @param name Name of the geometry.
     * @param value Value representing the color in hex format.
     */
    public OBJGeometryColor(name: string, value: any) {
        const object = this.scene.getObjectByName(name);
        if (object) {
            object.traverse(child => {
                if (child instanceof Mesh || child instanceof LineSegments) {
                    if (
                        child.material instanceof MeshPhongMaterial ||
                        child.material instanceof MeshBasicMaterial ||
                        child.material instanceof LineBasicMaterial
                    ) {
                        child.material.color.set(value);
                    }
                }
            });
        }
    }

    /**
     * Changes objects visibility.
     * @param name Name of the object to change its visibility.
     */
    public objectVisibility(name: string, visible: boolean) {
        const object = this.scene.getObjectByName(name);
        if (object) {
            object.visible = visible;
        }
    }

    /**
     * Gets an object's position
     * @param name Name of the object
     * @returns object position.
     */
    public getObjectPosition(name: string): Vector3 {
        const object = this.scene.getObjectByName(name);
        if (object) {
            return object.position;
        }
    }

    /**
     * Removes an object from the scene.
     * @param name Name of the object to remove.
     */
    public removeGeometry(name: string) {
        const object = this.scene.getObjectByName(name);
        const geometries = this.getGeometries() as Group;
        geometries.remove(object);
    }

    /**
     * Scales an object's size.
     * @param name Name of the object to remove.
     * @param value To scale the object's size.
     */
    public scaleObject(name: string, value: any) {
        const object = this.scene.getObjectByName(name);
        object.scale.set(value, value, value);
    }

    /**
     * Adds a new type of objects (Jets, Tracks...) to the event data group.
     * @param objectType Name of the object type.
     * @returns The new group added to the event data.
     */
    public addEventDataTypeGroup(objectType: string): Group {
        const eventData = this.getEventData();
        let typeGroup = this.scene.getObjectByName(objectType) as Group;
        if (!typeGroup) {
            typeGroup = new Group();
        }
        typeGroup.name = objectType;
        eventData.add(typeGroup);
        return typeGroup;
    }

    /**
     * Changes the color of all objects inside an event data collection.
     * @param collectionName Name of the collection.
     * @param color Hex value representing the color.
     */
    public collectionColor(collectionName: string, color: any) {
        const collection = this.getScene().getObjectByName(collectionName);

        for (const child of Object.values(collection.children)) {
            child.traverse((object: THREE.Object3D) => {
                // For jets and tracks
                if (object instanceof Line || object instanceof Mesh || object instanceof Points) {
                    if (
                        object.material instanceof LineBasicMaterial ||
                        object.material instanceof MeshBasicMaterial ||
                        object.material instanceof MeshBasicMaterial ||
                        object.material instanceof PointsMaterial ||
                        object.material instanceof MeshPhongMaterial
                    ) {
                        object.material.color.set(color);

                    }
                }
            });
        }
    }

    /**
     * Applies a cut to all objects inside a collection, filtering them given a parameter.
     * @param collectionName Name of the collection.
     * @param filter Cut used to filter the elements.
     */
    public collectionFilter(collectionName: string, filter: Cut) {
        const collection = this.getScene().getObjectByName(collectionName);
        for (const child of Object.values(collection.children)) {
            if (child.userData) {
                const value = child.userData[filter.field];
                if (value) {
                    if (value <= filter.maxValue && value >= filter.minValue) {
                        child.visible = true;
                    } else {
                        child.visible = false;
                    }
                }
            }
        }
    }

    /**
     * Changes the visibility of all elements in a group.
     * @param name Name of the group.
     * @param visible Value of visibility.
     */
    public groupVisibility(name: string, visible: boolean) {
        const collection = this.scene.getObjectByName(name);
        for (const child of Object.values(collection.children)) {
            child.visible = visible;
        }
    }


    /**
     * Gets a group of objects from the scene.
     * @param identifier String that identifies the group's name.
     * @returns The obj
     */
    public getObjectsGroup(identifier: string): Object3D {
        let group = this.scene.getObjectByName(identifier);
        if (group == null) {
            group = new Group();
            group.name = identifier;
            this.scene.add(group);
        }
        return group;
    }

    public getEventData(): Object3D {
        return this.getObjectsGroup(SceneManager.EVENT_DATA_ID);
    }

    public getGeometries(): Object3D {
        return this.getObjectsGroup(SceneManager.GEOMETRIES_ID);
    }

    /**
     * Clears event data of the scene.
     */
    public clearEventData() {
        const eventData = this.getEventData();
        if (eventData != null) {
            this.scene.remove(eventData);
        }
        this.getEventData();
    }

    /**
     * Sets scene axis visibility.
     */
    public setAxis(visible: boolean) {
        if (this.axis == null) {
            this.axis = new AxesHelper(2000);
            this.scene.add(this.axis);
        }
        this.axis.visible = visible;
    }

    public eventDataDepthTest(value: boolean) {
        const object = this.getEventData();

        if (object !== null) {
            this.updateChildrenDepthTest(object, value);
        }
    }

    /**
     * Update all children's depthTest and renderOrder.
     * @param object Object group whose depthTest is to be changed.
     * @param value A boolean to specify if depthTest is to be enabled or disabled.
     */
    private updateChildrenDepthTest(object: any, value: boolean) {
        // Changing renderOrder to make event data render on top of geometry
        // Arbitrarily setting a high value of 999
        value ? object.renderOrder = 0 : object.renderOrder = 999;

        // Traversing all event data objects to change material's depthTest
        object.children.forEach((objectChild: any) => {
            if (!(objectChild instanceof Group)) {
                if (objectChild.material) {
                    objectChild.material.depthTest = value;
                }
            } else {
                // Calling the function again if the object is a group
                this.updateChildrenDepthTest(objectChild, value);
            }
        });
    }
}
