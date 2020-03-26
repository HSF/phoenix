import { CMSType } from './cmstype';
import { Object3D, LineBasicMaterial, Geometry, LineSegments } from 'three';

export abstract class Box extends CMSType {

    getObject(collection: any): Object3D {
        const style = this.style ? this.style : { color: '0xff0000', linewidth: 0.5, opacity: 0.5 };
        const material = new LineBasicMaterial({
            color: style.color,
            transparent: style.opacity < 1 ? true : false,
            linewidth: style.linewidth,
            depthWrite: false,
            opacity: style.opacity
        });

        const geometry = new Geometry();

        for (const object of collection) {
            const box = this.createBox(object);
            geometry.merge(box);
        }

        const line = new LineSegments(geometry, material);
        line.name = this.name;
        line.renderOrder = 1;
        return line;
    }

    abstract createBox(data): Geometry;
}
