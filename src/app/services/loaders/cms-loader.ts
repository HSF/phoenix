import { PhoenixLoader } from './phoenix-loader';
import { Vector3, QuadraticBezierCurve3 } from 'three';

/**
 * PhoenixLoader for processing and loading a CMS event.
 */
export class CMSLoader extends PhoenixLoader {
    /** Event data to be processed. */
    private data: any;

    /**
     * Constructor for the LHCb loader.
     */
    constructor() {
        super();
        this.data = {};
    }

    /**
     * Put event data into the loader.
     * @param data Event data to be used by the loader.
     */
    public putEventData(data: any) {
        this.data = data;
    }

    /**
     * Get all event data.
     * @returns Event data with Hits and Tracks.
     */
    public getEventData(): any {
        let eventData = {
            eventNumber: '0',
            runNumber: '',
            Hits: {},
            Tracks: {}
        };

        // Getting hits
        eventData.Hits = this.getPixelClusters();
        // Getting tracks
        eventData.Tracks = this.getTracks();

        return eventData;
    }

    /**
     * Get Pixel Clusters from the event data.
     * @returns Hits with Pixel Clusters.
     */
    private getPixelClusters(): any {
        const siPixelClusters = this.data['Collections']['SiPixelClusters_V1'];
        let Hits = {
            SiPixelClusters_V1: []
        };
        let tempClusters = [];
        siPixelClusters.forEach(function (cluster: any) {
            // tempClusters.push(cluster[1]);
        });
        Hits.SiPixelClusters_V1.push(tempClusters);
        return Hits;
    }

    /**
     * Get all tracks from the event data.
     * @returns An object containing all tracks.
     */
    private getTracks(): any {
        /**
         * For "Tracks_V2" Approach II - Working
         */
        let allTracksData = [];
        const tracks = this.data['Collections']['Tracks_V2'];
        const extras = this.data['Collections']['Extras_V1'];
        const assocs = this.data['Associations']['TrackExtras_V1'];

        // Processing tracks using associations and extras
        
        // Variables to be used inside the loop
        let pt, ti, ei,
            p1, d1,
            p2, d2,
            distance, scale, cp1, cp2, curve,
            trackInfo;

        const cutsLimit = [0, 0.6];
        for (let i = 0; i < assocs.length; i++) {
            // Current track info
            trackInfo = {
                pos: [],
                pt: tracks[i][2],
                phi: tracks[i][3],
                eta: tracks[i][4],
                charge: tracks[i][5],
                chi2: tracks[i][6],
                dof: tracks[i][7]
            };

            // Track properties
            pt = tracks[i][2];

            if (pt < cutsLimit[0] || pt > cutsLimit[1])
                continue; // Skip this track

            // Track i - location in assocs
            ti = assocs[i][0][1];
            // Extras i - location in assocs
            ei = assocs[i][1][1];

            // Position 1 of current track
            p1 = new Vector3(extras[ei][0][0], extras[ei][0][1], extras[ei][0][2]);
            // Direction of position 1 of current track
            d1 = new Vector3(extras[ei][1][0], extras[ei][1][1], extras[ei][1][2]);
            d1.normalize();

            // Position 2 of current track
            p2 = new Vector3(extras[ei][2][0], extras[ei][2][1], extras[ei][2][2]);
            // Direction of position 2 of current track
            d2 = new Vector3(extras[ei][3][0], extras[ei][3][1], extras[ei][3][2]);
            d2.normalize();

            // Calculate the distance from position 1 to position 2
            distance = p1.distanceTo(p2);
            scale = distance * 0.25;

            // Calculating the control points to generate a bezier curve
            cp1 = new Vector3(p1.x + scale * d1.x, p1.y + scale * d1.y, p1.z + scale * d1.z);
            cp2 = new Vector3(p2.x + scale * d2.x, p2.y + scale * d2.y, p2.z + scale * d2.z);

            // Create the track curve
            curve = new QuadraticBezierCurve3(p1, cp1, p2);

            let positions = [];
            // Divide the curve into points to put into positions array
            curve.getPoints(24).forEach(function (position: any) {
                position.multiplyScalar(1000);
                positions.push([position.x, position.y, position.z]);
            });

            trackInfo.pos = positions;
            allTracksData.push(trackInfo);

        }

        return { Particles: allTracksData };
    }
}
