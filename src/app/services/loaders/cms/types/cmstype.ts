import { Object3D } from 'three';

export abstract class CMSType {
    key: string;
    name: string;
    group: string;
    style?: any;
    selection: any;
    visible: boolean;

    constructor(
        key: string,
        name: string,
        group: string,
        visible: boolean,
        selection: any,
        style?: any
    ) {
        this.key = key;
        this.name = name;
        this.group = group;
        this.visible = visible;
        this.selection = selection;
        this.style = style;
    }

    abstract getObject(collection: any): Object3D;
}
