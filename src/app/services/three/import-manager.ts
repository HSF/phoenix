import { HttpClient } from '@angular/common/http';
import { DoubleSide, Mesh, LineSegments, LineBasicMaterial, MeshPhongMaterial, Object3D, Scene, Group, Plane, Geometry } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { ThreeService } from '../three.service';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class ImportManager {

    private clipPlanes: Plane[];
    private EVENT_DATA_ID: string;
    private GEOMETRIES_ID: string;

    constructor(clipPlanes: Plane[], EVENT_DATA_ID: string, GEOMETRIES_ID: string) {
        this.clipPlanes = clipPlanes;
        this.EVENT_DATA_ID = EVENT_DATA_ID;
        this.GEOMETRIES_ID = GEOMETRIES_ID;
    }

    public loadOBJGeometry(
        callback: (object: Group) => any,
        filename: string,
        name: string,
        colour,
        doubleSided: boolean
    ): void {
        if (colour == null) {
            colour = 0x41a6f4;
        }
        const objLoader = new OBJLoader();
        objLoader.load(filename, object => {
            const processed = this.processOBJ(object, name, colour, doubleSided, 'OBJ file');
            callback(processed);
        });
    }

    public parseOBJGeometry(content: string, name: string): Group {
        const objLoader = new OBJLoader();
        const object = objLoader.parse(content);
        return this.processOBJ(
            object,
            name,
            0x41a6f4,
            false,
            'OBJ file loaded from the client.'
        );
    }

    private processOBJ(
        object: Object3D,
        name: string,
        colour: any,
        doubleSided: boolean,
        data?: string
    ): Group {
        object.name = name;
        object.userData = { info: data };
        return this.setObjFlat(object, colour, doubleSided);
    }

    private setObjFlat(object3d, colour, doubleSided): Group {
        const material2 = new MeshPhongMaterial({
            color: colour,
            wireframe: false
        });
        material2.clippingPlanes = this.clipPlanes;
        material2.clipIntersection = true;
        material2.clipShadows = false;
        material2.wireframe = false;
        if (doubleSided) {
            material2.side = DoubleSide;
        }

        object3d.traverse(child => {
            if (child instanceof Mesh) {
                child.name = object3d.name;
                child.userData = object3d.userData;
                child.material = material2;
                // enable casting shadows
                child.castShadow = false;
                child.receiveShadow = false;
            } else {
                if (
                    child instanceof LineSegments &&
                    child.material instanceof LineBasicMaterial
                ) {
                    child.material.color.set(colour);
                }
            }
        });
        return object3d;
    }

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

    public loadGLTFGeometry(sceneUrl: any, callback: (Geometry: Object3D) => any) {
        const loader = new GLTFLoader();
        // @ts-ignore
        loader.load(sceneUrl, gltf => {
            const geometry = gltf.scene;
            callback(geometry);
        });
    }
}
