import { DoubleSide, Mesh, LineSegments, LineBasicMaterial, MeshPhongMaterial, Object3D, Group, Plane, Material, ObjectLoader } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * Manager for managing event display's import related functionality.
 */
export class ImportManager {

    /** Planes for clipping geometry. */
    private clipPlanes: Plane[];
    /** Object group ID containing event data. */
    private EVENT_DATA_ID: string;
    /** Object group ID containing detector geometries. */
    private GEOMETRIES_ID: string;

    /**
     * Constructor for the import manager.
     * @param clipPlanes Planes for clipping geometry.
     * @param EVENT_DATA_ID Object group ID containing event data.
     * @param GEOMETRIES_ID Object group ID containing detector geometries.
     */
    constructor(clipPlanes: Plane[], EVENT_DATA_ID: string, GEOMETRIES_ID: string) {
        this.clipPlanes = clipPlanes;
        this.EVENT_DATA_ID = EVENT_DATA_ID;
        this.GEOMETRIES_ID = GEOMETRIES_ID;
    }

    /**
     * Loads an OBJ (.obj) geometry from the given filename.
     * @param callback Callback when geometry is processed.
     * @param filename Path to the geometry.
     * @param name Name given to the geometry.
     * @param color Color to initialize the geometry.
     * @param doubleSided Renders both sides of the material.
     */
    public loadOBJGeometry(
        callback: (object: Group) => any,
        filename: string,
        name: string,
        color: any,
        doubleSided: boolean
    ) {
        if (color == null) {
            color = 0x41a6f4;
        }
        const objLoader = new OBJLoader();
        objLoader.load(filename, object => {
            const processed = this.processOBJ(object, name, color, doubleSided, 'OBJ file');
            callback(processed);
        });
    }

    /**
     * Parses and loads a geometry in OBJ (.obj) format.
     * @param geometry Geometry in OBJ (.obj) format.
     * @param name Name given to the geometry.
     * @returns The processed object.
     */
    public parseOBJGeometry(geometry: string, name: string): Group {
        const objLoader = new OBJLoader();
        const object = objLoader.parse(geometry);
        return this.processOBJ(
            object,
            name,
            0x41a6f4,
            false,
            'OBJ file loaded from the client.'
        );
    }

    /**
     * Process the geometry object being loaded from OBJ (.obj) format.
     * @param object 3D object.
     * @param name Name of the object.
     * @param color Color of the object.
     * @param doubleSided Renders both sides of the material.
     * @param data Data/description to be associated with the object.
     */
    private processOBJ(
        object: Object3D,
        name: string,
        color: any,
        doubleSided: boolean,
        data?: string
    ): Group {
        object.name = name;
        object.userData = { info: data };
        return this.setObjFlat(object, color, doubleSided);
    }

    /**
     * Process the 3D object and flatten it.
     * @param object3d Group of geometries that make up the object.
     * @param color Color of the object.
     * @param doubleSided Renders both sides of the material.
     * @returns The processed object.
     */
    private setObjFlat(object3d: any, color: any, doubleSided: boolean): Group {
        const material2 = new MeshPhongMaterial({
            color: color,
            shininess: 0,
            wireframe: false,
            clippingPlanes: this.clipPlanes,
            clipIntersection: true,
            clipShadows: false

        });
        if (doubleSided) {
            material2.side = DoubleSide;
        }

        object3d.traverse(child => {
            if (child instanceof Mesh) {
                child.name = object3d.name;
                child.userData = object3d.userData;
                // Use the new material
                if (child.material instanceof Material) {
                    child.material.dispose();
                    child.material = material2;
                }
                // enable casting shadows
                child.castShadow = false;
                child.receiveShadow = false;
            } else {
                if (
                    child instanceof LineSegments &&
                    child.material instanceof LineBasicMaterial
                ) {
                    child.material.color.set(color);
                }
            }
        });
        return object3d;
    }

    /**
     * Parses and loads a geometry in GLTF (.gltf) format.
     * @param geometry Geometry in GLTF (.gltf) format.
     * @param callback Callback called after the geometry is loaded.
     */
    public parseGLTFGeometry(geometry: any, callback: (geometries: Object3D, eventData: Object3D) => any) {
        const loader = new GLTFLoader();
        const sceneString = JSON.stringify(geometry, null, 2);
        // @ts-ignore
        loader.parse(sceneString, '', gltf => {
            const eventData = gltf.scene.getObjectByName(this.EVENT_DATA_ID);
            const geometries = gltf.scene.getObjectByName(this.GEOMETRIES_ID);
            callback(eventData, geometries);
        });
    }

    /**
     * Loads a GLTF (.gltf) scene/geometry from the given URL.
     * @param sceneUrl URL to the GLTF (.gltf) file.
     * @param name Name of the loaded scene/geometry.
     * @param callback Callback called after the scene/geometry is loaded.
     * @param scale Scale of the geometry.
     */
    public loadGLTFGeometry(sceneUrl: any, name: string, callback: (Geometry: Object3D) => any, scale?: number) {
        const loader = new GLTFLoader();
        // @ts-ignore
        loader.load(sceneUrl, gltf => {
            const geometry = gltf.scene;
            this.processGeometry(geometry, name, scale);
            callback(geometry);
        });
    }

    /**	
     * Loads geometries from JSON.
     * @param json JSON or URL to JSON file of the geometry.
     * @param name Name of the geometry or group of geometries.
     * @param callback Callback called after the geometries are
     * processed and loaded.
     * @param scale Scale of the geometry.
     */
    public loadJSONGeometry(json: string | object, name: string,
        callback: (Geometry: Object3D) => any,
        scale?: number) {
        const loader = new ObjectLoader();
        if (typeof json === 'string') {
            loader.load(json, (geometry: Object3D) => {
                this.processGeometry(geometry, name, scale);
                callback(geometry);
            });
        } else if (typeof json === 'object') {
            const geometry = loader.parse(json);
            this.processGeometry(geometry, name, scale);
            callback(geometry);
        }
    }

    /**
     * Process the geometry by setting up material and clipping attributes.
     * @param geometry Geometry to be processed.
     * @param name Name of the geometry.
     * @param scale Scale of the geometry.
     */
    private processGeometry(geometry: Object3D, name: string, scale?: number) {
        geometry.name = name;
        // Set a custom scale if provided
        if (scale) {
            geometry.scale.set(scale, scale, scale);
        }
        geometry.traverse((child) => {
            if (child instanceof Mesh) {
                child.name = child.userData.name = name;
                if (child.material instanceof Material) {
                    const color = child.material['color'] ? child.material['color'] : 0x2fd691;
                    const side = child.material['side'];
                    // Disposing of the default material
                    child.material.dispose();
                    // Changing to a material with 0 shininess
                    child.material = new MeshPhongMaterial({
                        color: color,
                        shininess: 0,
                        side: side
                    });
                    // Setting up the clipping planes
                    child.material.clippingPlanes = this.clipPlanes;
                    child.material.clipIntersection = true;
                    child.material.clipShadows = false;
                }
            }
        });
    }
}
