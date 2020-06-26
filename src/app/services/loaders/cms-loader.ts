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
     * @returns Event data with Hits, Tracks, Jets and CaloClusters.
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
        // These are the collections with point cloud geometries
        let clusterCollections = [
            'TrackingRecHits_V1',
            'SiStripClusters_V1',
            'SiPixelClusters_V1',
            'CSCLCTDigis_V1'
        ];
        // Filter to check if the provided collections are indeed inside the data
        clusterCollections = clusterCollections.filter(key => this.data['Collections'][key]);
        const newHits = this.getObjectCollections(clusterCollections, (objectParams) => {
            if (objectParams['pos']) {
                // Increasing the scale to fit Phoenix's event display
                objectParams['pos'] = objectParams['pos']
                    .map((point: number) => point * this.geometryScale);
            }
        });

        Object.assign(Hits, newHits);

        return Hits;
    }

    /**
     * Get all CaloClusters from the event data.
     * @returns CaloClusters object containing all CaloClusters collections.
     */
    private getCaloClusters(): any {
        let caloClustersCollections = [
            'SuperClusters_V1'
        ];
        // Filter to check if the provided collections are indeed inside the data
        caloClustersCollections = caloClustersCollections.filter(key => this.data['Collections'][key]);
        const CaloClusters = this.getObjectCollections(caloClustersCollections, (objectParams) => {
            if (objectParams['energy']) {
                // If the attribute of Calo Cluster is energy then scale it to a higher value
                objectParams['energy'] *= this.geometryScale;
            }
        });

        //! TO BE REVIEWED - Not using extras and assocs - output might be different
        // let ri = 0;
        // for (let i = 0; i < assocs.length; i++) {
        //     ri = assocs[ri][1][1];
        //     CaloClusters[caloClusterCollection].push(extras[ri]);
        // }

        return CaloClusters;
    }

    /**
     * Get all Jets from the event data.
     * @returns Jets object containing all Jets collections.
     */
    private getJets(): any {
        let Jets = {};

        // Filtering collections to get all Jets collections
        const jetsCollections = Object.keys(this.data['Collections'])
            .filter(key => key.toLowerCase().includes('jets'));
        const cuts = [
            { attribute: 'et', min: 10 },
            { attribute: 'energy', min: 10 }
        ];

        Jets = this.getObjectCollections(jetsCollections, (objectParams) => {
            for (const energyAttribute of ['et', 'energy']) {
                if (objectParams[energyAttribute]) {
                    objectParams[energyAttribute] *= this.geometryScale;
                    break;
                }
            }
        }, cuts);

        return Jets;
    }

    /**
     * Common function for linearly getting event data of collections of an object type.
     * @param collections Keys for collections to be iterated.
     * @param processObject Callback for applying a custom logic to object params.
     * @param cuts Cuts for defining a minimum and maximum value of an attribute.
     * @returns An object containing all event data from the given collections.
     */
    private getObjectCollections(
        collections: string[],
        processObject?: (objectParams: any) => void,
        cuts?: { attribute: string, min?: number, max?: number }[]
    ): any {
        let ObjectType = {};
        // Iterating all collections
        for (const collection of collections) {
            ObjectType[collection] = [];
            const objectAttributes = this.data['Types'][collection];
            // Iterating a single object collection to process all objects
            for (const physicsObject of this.data['Collections'][collection]) {
                let objectParams = {};
                // Filling object params using the given types
                objectAttributes.forEach((attribute, attributeIndex) => {
                    objectParams[attribute[0]] = physicsObject[attributeIndex];
                });

                // Applying cuts to object (if any)
                if (cuts) {
                    let maxPass = true;
                    let minPass = true;
                    for (const cut of cuts) {
                        // Check if the attribute actually exists
                        if (objectParams[cut.attribute]) {
                            if (cut.max && objectParams[cut.attribute] > cut.max) {
                                maxPass = false;
                                break;
                            }
                            if (cut.min && objectParams[cut.attribute] < cut.min) {
                                minPass = false;
                                break;
                            }
                        }
                    }
                    if (maxPass && minPass) {
                        // Custom processing of object (if any)
                        processObject(objectParams);
                        ObjectType[collection].push(objectParams);
                    }
                } else {
                    // Custom processing of object (if any)
                    processObject(objectParams);
                    ObjectType[collection].push(objectParams);
                }
            }
            // If the object collection has no data then remove it
            if (ObjectType[collection].length === 0) {
                delete ObjectType[collection];
            }
        }
        return ObjectType;
    }

    /**
     * Get all Tracks from the event data.
     * @returns Tracks object containing all Tracks collections.
     */
    private getTracks(): any {
        let Tracks = {};

        // All collections with tracks
        let tracksCollections = [
            {
                collection: 'Tracks_V1', extras: 'Extras_V1',
                assocs: 'TrackExtras_V1', color: '0xff0000', min_pt: 1
            },
            {
                collection: 'Tracks_V2', extras: 'Extras_V1',
                assocs: 'TrackExtras_V1', color: '0xff0000', min_pt: 1
            },
            {
                collection: 'Tracks_V3', extras: 'Extras_V1',
                assocs: 'TrackExtras_V1', color: '0xff0000', min_pt: 1
            },
            {
                collection: 'StandaloneMuons_V2', extras: 'Extras_V1',
                assocs: 'MuonTrackExtras_V1', color: '0xf57842', min_pt: 1
            },
            {
                collection: 'PATStandaloneMuons_V1', extras: 'Extras_V1',
                assocs: 'PATMuonTrackExtras_V1', color: '0xf5aa42', min_pt: 1
            },
            {
                collection: 'TrackerMuons_V2', extras: 'Extras_V1',
                assocs: 'MuonTrackerExtras_V1', color: '0xe8d546', min_pt: 2
            },
            {
                collection: 'GsfElectrons_V1', extras: 'Extras_V1',
                assocs: 'GsfElectronExtras_V1', color: '0x1CFF1A', min_pt: 10
            },
            {
                collection: 'GsfElectrons_V2', extras: 'Extras_V1',
                assocs: 'GsfElectronExtras_V1', color: '0x1bcf9f', min_pt: 10
            },
            {
                collection: 'GsfElectrons_V3', extras: 'Extras_V1',
                assocs: 'GsfElectronExtras_V1', color: '0x1ad9ff', min_pt: 10
            },
            {
                collection: 'PATElectrons_V1', extras: 'Extras_V1',
                assocs: 'PATElectronExtras_V1', color: '0x1a40ff', min_pt: 1
            }
        ];
        // Filtering to check if data actually exists in collections
        tracksCollections = tracksCollections
            .filter(obj => this.data['Collections'][obj.collection]);

        for (const tracksCollection of tracksCollections) {
            Tracks[tracksCollection.collection] = [];

            // Processing tracks using associations and extras
            const tracks = this.data['Collections'][tracksCollection.collection];
            const extras = this.data['Collections'][tracksCollection.extras];
            const assocs = this.data['Associations'][tracksCollection.assocs];
            // Properties/attributes of tracks
            const trackTypes = this.data['Types'][tracksCollection.collection];

            // Variables to be used inside the loop
            let ti, ei,
                p1, d1,
                p2, d2,
                distance, scale, cp1, cp2, curve,
                trackParams;

            for (let i = 0; i < assocs.length; i++) {
                // Current track info
                trackParams = {};

                // Set properties/attributes of track
                trackTypes.forEach((attribute, attributeIndex) => {
                    trackParams[attribute[0]] = tracks[i][attributeIndex];
                });

                // SKIPPING TRACKS WITH pt < min_pt
                if (trackParams.pt < tracksCollection.min_pt) {
                    continue;
                }

                trackParams.color = tracksCollection.color;

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
                Tracks[tracksCollection.collection].push(trackParams);

            }

            if (Tracks[tracksCollection.collection].length === 0) {
                delete Tracks[tracksCollection.collection];
            }
        }

        return Tracks;
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
