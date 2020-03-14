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
            distance, scale, cp1, cp2, curve,
            trackInfo;

        for (var i = 0; i < assocs.length; i++) {
            // Current track info
            trackInfo = {
                pos: []
            };

            // Track properties
            pt = tracks[i][2];
            phi = tracks[i][3];
            eta = tracks[i][4];

            // Track i - location in assocs
            ti = assocs[i][0][1];
            // Extras i - location in assocs
            ei = assocs[i][1][1];

            // Position 1 of current track
            p1 = new THREE.Vector3(extras[ei][0][0], extras[ei][0][1], extras[ei][0][2]);
            // Direction of position 1 of current track
            d1 = new THREE.Vector3(extras[ei][1][0], extras[ei][1][1], extras[ei][1][2]);
            d1.normalize();

            // Position 2 of current track
            p2 = new THREE.Vector3(extras[ei][2][0], extras[ei][2][1], extras[ei][2][2]);
            // Direction of position 2 of current track
            d2 = new THREE.Vector3(extras[ei][3][0], extras[ei][3][1], extras[ei][3][2]);
            d2.normalize();

            // Calculate the distance from position 1 to position 2
            distance = p1.distanceTo(p2);
            scale = distance * 0.25;

            // Calculating the control points to generate a bezier curve
            cp1 = new THREE.Vector3(p1.x + scale * d1.x, p1.y + scale * d1.y, p1.z + scale * d1.z);
            cp2 = new THREE.Vector3(p2.x + scale * d2.x, p2.y + scale * d2.y, p2.z + scale * d2.z);

            // Create the track curve
            curve = new THREE.CubicBezierCurve3(p1, cp1, cp2, p2);

            var positions = [];
            // Divide the curve into points to put into positions array
            curve.getPoints(24).forEach(function (position: any) {
                positions.push([position.x, position.y, position.z]);
            });

            trackInfo.pos = positions;
            allTracksData.push(trackInfo);

        }
        
        // Changing size of hits because default hit size (10) is too big for CMS detector and event
        PhoenixObjects.hitSize = 0.015;

        return { Particles: allTracksData };
    }
}