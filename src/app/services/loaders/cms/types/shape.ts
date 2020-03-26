import { CMSType } from './cmstype';
import { Object3D, Group } from 'three';

export abstract class Shape extends CMSType {

    getObject(collection: any): Object3D {
        const shapeCollection = new Group();
        shapeCollection.name = this.name;

        for (const object of collection) {
            const shape = this.getShape(object);

            if (shape !== null) {
                shapeCollection.add(shape);
            }
        }
        return shapeCollection;
    }

    abstract getShape(objectData: any): Object3D;
}
