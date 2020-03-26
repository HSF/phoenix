import { Shape } from '../types/shape';
import { Object3D, CylinderGeometry, Matrix4, Color, DoubleSide, MeshBasicMaterial, Mesh, Vector3 } from 'three';

export class Jet extends Shape {

    getShape(objectData: any): Object3D {
        const et = objectData[0];
        const eta = objectData[1];

        const theta = objectData[2];
        const phi = objectData[3];

        const ct = Math.cos(theta);
        const st = Math.sin(theta);
        const cp = Math.cos(phi);
        const sp = Math.sin(phi);

        const maxZ = 2.25;
        const maxR = 1.10;

        const length1 = ct ? maxZ / Math.abs(ct) : maxZ;
        const length2 = st ? maxR / Math.abs(st) : maxR;
        const length = length1 < length2 ? length1 : length2;
        const radius = 0.3 * (1.0 / (1 + 0.001));

        // radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded
        const geometry = new CylinderGeometry(radius, 0.0, length, 16, 1, true);
        geometry.applyMatrix4(new Matrix4().makeTranslation(0, length * 0.5, 0));
        geometry.applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));

        const jcolor = new Color(this.style.color);

        let transp = false;
        if (this.style.opacity < 1.0) {
            transp = true;
        }

        const material = new MeshBasicMaterial({ color: jcolor, transparent: transp, opacity: this.style.opacity });
        material.side = DoubleSide;

        const jet = new Mesh(geometry, material);
        jet.lookAt(new Vector3(length * 0.5 * st * cp, length * 0.5 * st * sp, length * 0.5 * ct));
        jet.visible = true;
        jet.name = 'Jet [' + this.name + ']';
        jet.userData = { et, eta, theta, phi };

        // Removing cuts for demonstration purposes
        // TODO enable back
        // if (et < this.selection.min_et) {
        //     jet.visible = false;
        // }

        return jet;
    }

}
