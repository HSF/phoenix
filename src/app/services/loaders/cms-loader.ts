import { PhoenixLoader } from './phoenix-loader';
import { Vector3, QuadraticBezierCurve3 } from 'three';

/**
 * PhoenixLoader for processing and loading a CMS event.
 */
export class CMSLoader extends PhoenixLoader {
    /** Event data to be processed. */
    private data: any;
    /** Scale factor for resizing geometry to fit Phoenix event display. */
    private geometryScale: number = 1000;

    /**
     * Constructor for the CMS loader.
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
        const eventInfo = this.data['Collections']['Event_V2'][0];

        let eventData = {
            runNumber: eventInfo[0],
            eventNumber: eventInfo[1],
            ls: eventInfo[2],
            time: eventInfo[5],
            Hits: {},
            Tracks: {},
            Jets: {},
            CaloClusters: {}
        };

        // Getting Hits
        eventData.Hits = this.getTrackingClusters(eventData.Hits);
        // Getting Tracks
        eventData.Tracks = this.getTracks();
        // Getting Jets
        eventData.Jets = this.getJets();
        // Getting CaloClusters
        eventData.CaloClusters = this.getCaloClusters();

        // Undefining object types if there is no event data
        for (let objectType of ['Hits', 'Tracks', 'Jets', 'CaloClusters']) {
            if (Object.keys(eventData[objectType]).length === 0) {
                eventData[objectType] = undefined;
            }
        }

        return eventData;
    }

    /**
     * Get all tracking clusters from the event data.
     * @param Hits Hits object in which all cluster collections are to be put.
     * @returns Hits object containing all Cluster collections.
     */
    private getTrackingClusters(Hits: any): any {
        const collections = this.data['Collections'];
        const types = this.data['Types'];
        // These are the collections with point cloud geometries
        let clusterCollections = [
            'TrackingRecHits_V1',
            'SiStripClusters_V1',
            'SiPixelClusters_V1',
            'CSCLCTDigis_V1'
        ];
        // Filter to check if the provided collections are indeed inside the data
        clusterCollections = clusterCollections.filter(key => collections[key]);

        // Go through each cluster collection
        for (const clusterCollection of clusterCollections) {
            Hits[clusterCollection] = [];
            const clusterTypes = types[clusterCollection];
            // Set up each cluster from the cluster collection
            for (const cluster of collections[clusterCollection]) {
                let clusterParams = {};
                // Go through each attribute of the cluster
                clusterTypes.forEach((attribute, attributeIndex) => {
                    // Get the attribute name from types
                    clusterParams[attribute[0]] = cluster[attributeIndex];
                });
                if (clusterParams['pos']) {
                    // Increasing the scale to fit Phoenix's event display
                    clusterParams['pos'] = clusterParams['pos']
                        .map((point: number) => point * this.geometryScale);
                    Hits[clusterCollection].push(clusterParams);
                }
            }
            // If the cluster collection has no hits then remove it
            if (Hits[clusterCollection].length === 0) {
                delete Hits[clusterCollection];
            }
        }

        return Hits;
    }

    private getCaloClusters(): any {
        let CaloClusters = {};
        const collections = this.data['Collections'];
        const types = this.data['Types'];
        const assocs = this.data['Associations']['SuperClusterRecHitFractions_V1'];
        const extras = collections['RecHitFractions_V1'];

        let caloClustersCollections = [
            'SuperClusters_V1'
        ];
        // Filter to check if the provided collections are indeed inside the data
        caloClustersCollections = caloClustersCollections.filter(key => collections[key]);

        for (const caloClusterCollection of caloClustersCollections) {
            CaloClusters[caloClusterCollection] = [];
            const caloClusterTypes = types[caloClusterCollection];
            for (const caloCluster of collections[caloClusterCollection]) {
                let caloClusterParams = {};
                caloClusterTypes.forEach((attribute, attributeIndex) => {
                    caloClusterParams[attribute[0]] = caloCluster[attributeIndex];
                });
                if (caloClusterParams['energy']) {
                    // If the attribute of Calo Cluster is energy then scale it to a higher value
                    caloClusterParams['energy'] *= this.geometryScale;
                }
                CaloClusters[caloClusterCollection].push(caloClusterParams);
            }
            // If the CaloCluster collection has no CaloClusters then remove it
            if (CaloClusters[caloClusterCollection].length === 0) {
                delete CaloClusters[caloClusterCollection];
            }
            //! TO BE REVIEWED - Not using extras and assocs
            // let ri = 0;
            // for (let i = 0; i < assocs.length; i++) {
            //     ri = assocs[ri][1][1];
            //     CaloClusters[caloClusterCollection].push(extras[ri]);
            // }
        }
        return CaloClusters;
    }

    /**
     * Get all Tracks from the event data.
     * @returns Tracks object containing all Tracks collections.
     */
    private getTracks(): any {
        let Tracks = {};
        let allTracks = [];

        const collections = this.data['Collections'];
        const tracksCollection = Object.keys(collections)
            .find(key => key.toLowerCase().startsWith('tracks'));

        // Processing tracks using associations and extras
        const tracks = this.data['Collections'][tracksCollection];
        const extras = this.data['Collections']['Extras_V1'];
        const assocs = this.data['Associations']['TrackExtras_V1'];
        // Properties/attributes of tracks
        const trackTypes = this.data['Types'][tracksCollection];

        // Variables to be used inside the loop
        let ti, ei,
            p1, d1,
            p2, d2,
            distance, scale, cp1, cp2, curve,
            trackParams;
        const min_pt = 1.0; // Cut

        for (let i = 0; i < assocs.length; i++) {
            // Current track info
            trackParams = {};

            // Set properties/attributes of track
            trackTypes.forEach((attribute, attributeIndex) => {
                trackParams[attribute[0]] = tracks[i][attributeIndex];
            });

            // SKIPPING TRACKS WITH pt < 1.0
            if (trackParams.pt < min_pt) {
                continue;
            }

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
            for (const position of curve.getPoints(24)) {
                // Increasing the scale to fit Phoenix's event display
                position.multiplyScalar(this.geometryScale);
                positions.push([position.x, position.y, position.z]);
            }

            trackParams.pos = positions;
            allTracks.push(trackParams);

        }

        if (allTracks.length > 0) {
            Tracks[tracksCollection] = allTracks;
        }
        return Tracks;
    }

    /**
     * Get all Jets from the event data.
     * @returns Jets object containing all Jets collections.
     */
    private getJets(): any {
        let Jets = {};

        // Filtering collections to get all Jets collections
        const collections = this.data['Collections'];
        const jetsCollections = Object.keys(collections)
            .filter(key => key.toLowerCase().includes('jets'));
        const min_et = 10;

        // Iterating all Jets collections
        for (const jetsCollection of jetsCollections) {
            Jets[jetsCollection] = [];
            const jetsTypes = this.data['Types'][jetsCollection];
            // Iterating a single Jets collection to process all jets
            for (const jet of collections[jetsCollection]) {
                let jetParams = {};
                // Filling Jets params using the given types
                jetsTypes.forEach((attribute, attributeIndex) => {
                    jetParams[attribute[0]] = jet[attributeIndex];
                    if (['et', 'energy'].includes(attribute[0])) {
                    }
                });
                for (const energyAttribute of ['et', 'energy']) {
                    // If the attribute of Jet is energy then scale it to a higher value
                    if (jetParams[energyAttribute] && jetParams[energyAttribute] > min_et) {
                        jetParams[energyAttribute] *= this.geometryScale;
                        Jets[jetsCollection].push(jetParams);
                    }
                }
            }
            // If the Jets collection has no hits then remove it
            if (Jets[jetsCollection].length === 0) {
                delete Jets[jetsCollection];
            }
        }

        return Jets;
    }

    /**
     * Get CMS specific metadata associated to the event.
     * @returns Metadata of the event.
     */
    getEventMetadata(): any[] {
        let metadata = super.getEventMetadata();
        const eventInfo = this.data['Collections']['Event_V2'][0];
        if (eventInfo[3]) {
            metadata.push({
                label: 'Orbit',
                value: eventInfo[3]
            });
        }
        return metadata;
    }
}
