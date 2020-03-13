import { PhoenixLoader } from "./phoenix-loader";
import { ThreeService } from "../three.service";
import * as THREE from 'three';
import { PhoenixObjects } from "./objects/phoenix-objects";

export class CMSLoader extends PhoenixLoader {
    private data: any;

    constructor() {
        super();
        this.data = {};
    }

    public putData(data: any) {
        this.data = data;
    }

    public getEventData(): any {
        var eventData = {
            eventNumber: '0',
            runNumber: '',
            Hits: undefined,
            Tracks: undefined
        };

        // Getting hits
        eventData.Hits = this.getPixelClusters();
        // Getting tracks
        eventData.Tracks = this.getTracks();

        return eventData;
    }

    private getPixelClusters(): any {
        var siPixelClusters = this.data['Collections']['SiPixelClusters_V1'];
        var Hits = {
            Pixel: []
        };
        var tempClusters = [];
        siPixelClusters.forEach(function (cluster: any) {
            tempClusters.push(cluster[1]);
        });
        Hits.Pixel.push(tempClusters);
        return Hits;
    }

    private getTracks(): any {
        /**
         * For "Tracks_V2" Approach II - Working
         */
        var allTracksData = [];
        var tracks = this.data['Collections']['Tracks_V2'];
        var extras = this.data['Collections']['Extras_V1'];
        var assocs = this.data['Associations']['TrackExtras_V1'];

        // Processing tracks using associations and extras
        
        // Variables to be used inside the loop
        var pt, phi, eta, ti, ei,
            p1, d1,
            p2, d2,
            distance, scale, p3, p4, curve,
            trackInfo;

        for (var i = 0; i < assocs.length; i++) {
            trackInfo = {
                pos: []
            };

            pt = tracks[i][2];
            phi = tracks[i][3];
            eta = tracks[i][4];

            ti = assocs[i][0][1];
            ei = assocs[i][1][1];

            p1 = new THREE.Vector3(extras[ei][0][0], extras[ei][0][1], extras[ei][0][2]);
            d1 = new THREE.Vector3(extras[ei][1][0], extras[ei][1][1], extras[ei][1][2]);
            d1.normalize();

            p2 = new THREE.Vector3(extras[ei][2][0], extras[ei][2][1], extras[ei][2][2]);
            d2 = new THREE.Vector3(extras[ei][3][0], extras[ei][3][1], extras[ei][3][2]);
            d2.normalize();

            distance = p1.distanceTo(p2);
            scale = distance * 0.25;

            p3 = new THREE.Vector3(p1.x + scale * d1.x, p1.y + scale * d1.y, p1.z + scale * d1.z);
            p4 = new THREE.Vector3(p2.x + scale * d2.x, p2.y + scale * d2.y, p2.z + scale * d2.z);

            curve = new THREE.CubicBezierCurve3(p1, p3, p4, p2);

            var positions = [];
            curve.getPoints(24).forEach(function (position: any) {
                positions.push([position.x, position.y, position.z]);
            });

            trackInfo.pos = positions;
            allTracksData.push(trackInfo);

        }
        
        // Changing hits size because default hit size (10) is too big for CMS loader
        PhoenixObjects.hitSize = 0.015;

        return { Particles: allTracksData };
    }
}