import { Mesh, BufferAttribute, Float32BufferAttribute, Vector3 } from "three";
import { PhoenixLoader } from "./phoenix-loader";

export class JSRootEventLoader extends PhoenixLoader {

    private JSROOT: any;
    private fileEventData: any;
    private rootFileURL: any;

    constructor(JSROOT: any, rootFileURL: string) {
        super();

        this.JSROOT = JSROOT;
        this.rootFileURL = rootFileURL;

        this.fileEventData = {
            Hits: {},
            Tracks: {},
            Jets: {},
            CaloClusters: {},
            MuonChambers: {}
        };
    }

    public getEventData(objectName: string, onEventData: (eventData: any) => void) {
        this.JSROOT.OpenFile(this.rootFileURL, (file: any) => {
            file.ReadObject(objectName, (object: any) => {
                this.processItemsList(object, 'tracks');
                this.processItemsList(object, 'hits');
                this.processItemsList(object, 'clusters');
                onEventData(this.fileEventData);
            });
        });
    }

    private processItemsList(obj: any, itemName: string) {
        if (["TObjArray", "TList"].includes(obj._typename)) {
            if (!obj.arr) return false;
            for (let n = 0; n < obj.arr.length; ++n) {
                let sobj = obj.arr[n], sname = obj.opt ? obj.opt[n] : "";
                if (!sname)
                    sname = (itemName || "<prnt>") + "/[" + n + "]";
                this.processItemsList(sobj, sname);
            }
        } else if (obj._typename === 'THREE.Mesh') {
            this.addMiscPhysicsObject(obj);
        } else if (obj._typename === 'TGeoTrack') {
            if (!this.fileEventData.Tracks['TGeoTracks']) {
                this.fileEventData.Tracks['TGeoTracks'] = [];
            }
            const tGeoTrack = this.getTGeoTrack(obj);
            if (tGeoTrack) {
                this.fileEventData.Tracks['TGeoTracks'].push(tGeoTrack)
            }
        } else if ((obj._typename === 'TEveTrack') || (obj._typename === 'ROOT::Experimental::TEveTrack')) {
            if (!this.fileEventData.Tracks['TEveTracks']) {
                this.fileEventData.Tracks['TEveTracks'] = [];
            }
            const tEveTrack = this.getTEveTrack(obj);
            if (tEveTrack) {
                this.fileEventData.Tracks['TEveTracks'].push(tEveTrack)
            }
        } else if ((obj._typename === 'TEvePointSet') || (obj._typename === "ROOT::Experimental::TEvePointSet") || (obj._typename === "TPolyMarker3D")) {

        } else if ((obj._typename === "TEveGeoShapeExtract") || (obj._typename === "ROOT::Experimental::TEveGeoShapeExtract")) {

        }
    }

    private addMiscPhysicsObject(obj: Mesh) { }

    private getTGeoTrack(track: any): any {
        if (!track || !track.fNpoints) return false;

        let npoints = Math.round(track.fNpoints / 4),
            buf = new Float32Array((npoints - 1) * 6),
            pos = 0;

        for (let k = 0; k < npoints - 1; ++k) {
            buf[pos] = track.fPoints[k * 4];
            buf[pos + 1] = track.fPoints[k * 4 + 1];
            buf[pos + 2] = track.fPoints[k * 4 + 2];
            buf[pos + 3] = track.fPoints[k * 4 + 4];
            buf[pos + 4] = track.fPoints[k * 4 + 5];
            buf[pos + 5] = track.fPoints[k * 4 + 6];
            pos += 6;
        }

        return this.getCoordsArray(buf);
    }

    private getTEveTrack(track: any): any {
        if (!track || (track.fN <= 0)) return false;

        const trackObj = {};

        const positions = [];
        for (let i = 0; i < track.fN - 1; i++) {
            positions.push([
                track.fP[i * 3],
                track.fP[i * 3 + 1],
                track.fP[i * 3 + 2]
            ]);
        }

        for (const trackParamLine of track.fTitle.split('\n')) {
            for (const trackParam of trackParamLine.split(/(?!\(.*), (?!.*\))/g)) {
                const trackParamData = trackParam.split('=');
                trackObj[trackParamData[0]] = trackParamData[1];
            }
        }

        trackObj['pos'] = positions;

        return trackObj;

        // return {
        //     pos: this.getCoordsArray(buf)
        // };
    }

    private getCoordsArray(bufferArr: any): any[] {
        const val = bufferArr instanceof Float32Array ?
            new BufferAttribute(bufferArr, 3) :
            new Float32BufferAttribute(bufferArr, 3);

        const allValues = [];
        for (let i = 0; i < val.array.length / val.itemSize; i++) {
            allValues.push([
                val.array[i * val.itemSize + 0],
                val.array[i * val.itemSize + 1],
                val.array[i * val.itemSize + 2]
            ]);
        }

        return allValues;
    }
}
