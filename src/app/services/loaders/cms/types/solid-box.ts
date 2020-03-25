import { CMSType } from './cmstype';
import { Object3D } from 'three';

export abstract class SolidBox extends CMSType {
    getObject(): Object3D {
        throw new Error('Method not implemented.');
    }
}
