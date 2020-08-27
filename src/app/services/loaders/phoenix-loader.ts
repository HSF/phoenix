import { EventDataLoader } from '../event-data-loader';
import { Group, Object3D, Vector3 } from 'three';
import * as THREE from 'three';
import { UIService } from '../ui.service';
import { ThreeService } from '../three.service';
import { Cut } from '../extras/cut.model';
import { PhoenixObjects } from './objects/phoenix-objects';
import { InfoLoggerService } from '../infologger.service';
import { PhoenixMenuNode } from '../../components/phoenix-menu/phoenix-menu-node/phoenix-menu-node';
import { RungeKutta } from '../extras/runge-kutta';

/**
 * Loader for processing and loading an event.
 */
export class PhoenixLoader implements EventDataLoader {
  /** ThreeService to perform three.js related functions. */
  private graphicsLibrary: ThreeService;
  /** UIService to perform UI related functions. */
  private ui: UIService;
  /** Event data processed by the loader. */
  private eventData: any;


  /**
   * Takes an object that represents ONE event and takes care of adding
   * the different objects to the graphic library and the UI controls.
   * @param eventData Object representing the event.
   * @param graphicsLibrary Service containing functionality to draw the 3D objects.
   * @param ui Service for showing menus and controls to manipulate the geometries.
   * @param infoLogger Service for logging data to the information panel.
   */
  public buildEventData(eventData: any, graphicsLibrary: ThreeService, ui: UIService, infoLogger: InfoLoggerService): void {
    this.graphicsLibrary = graphicsLibrary;
    this.ui = ui;
    this.eventData = eventData;


    // Replacing tracks with tracks through Runge-Kutta
    // TODO - make this configurable? Or possibluy automatic if tracks have <2 positions to draw?
    // Object.assign(this.eventData.Tracks, this.getTracksWithRungeKutta(this.eventData['Tracks']));

    // initiate load
    this.loadObjectTypes(eventData);

    const eventNumber = eventData['event number'] ? eventData['event number'] : eventData['eventNumber'];
    const runNumber = eventData['run number'] ? eventData['run number'] : eventData['runNumber'];
    infoLogger.add('Event#' + eventNumber + ' from run#' + runNumber, 'Loaded');
  }

  getTracksWithRungeKutta(tracksCollectionsEvent: any) {
    const tracksCollections = JSON.parse(JSON.stringify(tracksCollectionsEvent));
    let Tracks = {};
    for (const tracksCollection of Object.keys(tracksCollections)) {
      for (const track of tracksCollections[tracksCollection]) {
        const dparams = track.dparams;
        // ATLAS uses mm, MeV
        let   d0    = dparams[0],
              z0    = dparams[1],
              phi   = dparams[2],
              theta = dparams[3],
              qop   = dparams[4];
      
        // console.log('Params', dparams)
        let p;
        if (qop !== 0) {
          p = Math.abs(1 / qop) ;
        } else {
          p = 0;
        }
        const q = Math.round(p * qop);

        // ATLAS definition of momentum, so probably so move this calc there.
        let globalMomentum = new Vector3(
            p * Math.cos(phi) * Math.sin(theta),
            p * Math.sin(phi) * Math.sin(theta),
            p * Math.cos(theta)
          );

        // Cannot use setFromSphericalCoordinates since ATLAS and threejs use different phi & theta definitions (though both are right-handed)
        let startPos = new Vector3(
          -d0 * Math.sin(phi),
          d0 * Math.cos(phi),
          z0
        );

        // Wipe existing positions
        track.pos = []
        track.pos.push([startPos.x,startPos.y,startPos.z])
        let startDir = globalMomentum.clone();
        startDir.normalize();

        // console.log('startPos = ',startPos.x,startPos.y,startPos.z)
        // console.log('startDir = ',startDir.x,startDir.y,startDir.z)
        // console.log('p = '+globalMomentum.length())
        const traj = RungeKutta.propagate(startPos, startDir, p, q, 10, 10000);
        
        let newpos = traj.map(val => [val.pos.x, val.pos.y, val.pos.z])
        track.pos = track.pos.concat( newpos );
        break;
      }
    }
    console.log(Tracks);
    return Tracks;
  }

  /**
   * Get the list of event names from the event data.
   * @param eventsData Object containing all event data.
   * @returns List of event names.
   */
  public getEventsList(eventsData: any): string[] {
    const eventsList: string[] = [];

    for (const eventName of Object.keys(eventsData)) {
      if (eventsData[eventName] !== null) {
        eventsList.push(eventName);
      }
    }

    return eventsList;
  }

  /**
   * Get list of collections in the event data.
   * @returns List of all collection names.
   */
  public getCollections(): string[] {
    if (!this.eventData) {
      return null;
    }

    const collections = [];
    for (const objectType of Object.keys(this.eventData)) {
      if (this.eventData[objectType] && typeof this.eventData[objectType] === 'object') {
        for (const collection of Object.keys(this.eventData[objectType])) {
          collections.push(collection);
        }
      }
    }
    return collections;
  }

  /**
   * Get the collection with the given collection name from the event data.
   * @param collectionName Name of the collection to get.
   * @returns An object containing the collection.
   */
  public getCollection(collectionName: string): any {
    if (!this.eventData) {
      return null;
    }

    for (const objectType of Object.keys(this.eventData)) {
      if (this.eventData[objectType]) {
        for (const collection of Object.keys(this.eventData[objectType])) {
          if (collection === collectionName) {
            return this.eventData[objectType][collection];
          }
        }
      }
    }
  }

  /**
   * Receives an object containing the data from an event and parses it
   * to reconstruct the different collections of physics objects.
   * @param eventData Representing ONE event (expressed in the Phoenix format).
   */
  protected loadObjectTypes(eventData: any) {
    if (eventData.Tracks) {
      // (Optional) Cuts can be added to any physics object.
      const cuts: Cut[] = [
        new Cut('chi2', 0, 50),
        new Cut('dof', 0, 100),
        new Cut('mom', 0, 500)
      ];

      this.addObjectType(eventData.Tracks, PhoenixObjects.getTrack, 'Tracks', cuts);
    }

    if (eventData.Jets) {
      // (Optional) Cuts can be added to any physics object.
      const cuts = [
        new Cut('phi', -Math.PI, Math.PI),
        new Cut('eta', 0, 100),
        new Cut('energy', 2000, 10000)
      ];

      const addJetsSizeOption = (typeFolder: any, typeFolderPM: PhoenixMenuNode) => {
        if (typeFolder) {
          const sizeMenu = typeFolder.add({ jetsScale: 100 }, 'jetsScale', 1, 200)
            .name('Jets Size (%)');
          sizeMenu.onChange((value: number) => {
            this.graphicsLibrary.getSceneManager().scaleJets(value);
          });
        }
        // Phoenix menu
        if (typeFolderPM) {
          typeFolderPM.addConfig('slider', {
            label: 'Jets Size (%)',
            min: 1, max: 200,
            allowCustomValue: true,
            onChange: (value: number) => {
              this.graphicsLibrary.getSceneManager().scaleJets(value);
            }
          });
        }
      };

      this.addObjectType(eventData.Jets, PhoenixObjects.getJet, 'Jets', cuts, addJetsSizeOption);
    }

    if (eventData.Hits) {
      this.addObjectType(eventData.Hits, PhoenixObjects.getHits, 'Hits');
    }

    if (eventData.CaloClusters) {
      // (Optional) Cuts can be added to any physics object.
      const cuts = [
        new Cut('phi', -Math.PI, Math.PI),
        new Cut('eta', 0, 100),
        new Cut('energy', 2000, 10000)
      ];

      this.addObjectType(eventData.CaloClusters, PhoenixObjects.getCluster, 'CaloClusters', cuts);
    }

    if (eventData.Muons) {
      this.addObjectType(eventData.Muons, this.getMuon, 'Muons');
    }
  }

  /**
   * Adds to the event display all collections of a given object type.
   * @param object Contains all collections of a given type (Tracks, Jets, CaloClusters...).
   * @param getObject Function that handles of reconstructing objects of the given type.
   * @param typeName Label for naming the object type.
   * @param cuts Filters that can be applied to the objects.
   * @param extendEventDataTypeUI A callback to add more options to event data type UI folder.
   */
  protected addObjectType(object: any, getObject: any, typeName: string,
    cuts?: Cut[], extendEventDataTypeUI?: (typeFolder: any, typeFolderPM?: PhoenixMenuNode) => void) {

    const typeFolder = this.ui.addEventDataTypeFolder(typeName, extendEventDataTypeUI);
    const typeFolderPM = this.ui.addEventDataTypeFolderPM(typeName, extendEventDataTypeUI);
    const objectGroup = this.graphicsLibrary.addEventDataTypeGroup(typeName);

    const collectionsList: string[] = this.getObjectTypeCollections(object);


    for (const collectionName of collectionsList) {
      const objectCollection = object[collectionName];

      this.addCollection(objectCollection, collectionName, getObject, objectGroup);

      cuts = cuts?.filter(cut => objectCollection[0][cut.field]);
      this.ui.addCollection(typeFolder, collectionName, cuts);
      this.ui.addCollectionPM(typeFolderPM, collectionName, cuts);
    }
  }

  /**
   * Adds to the event display all the objects inside a collection.
   * @param objectCollection Contains the params for every object of the collection.
   * @param collectionName Label to UNIQUELY identify the collection.
   * @param getObject Handles reconstructing the objects of the objects of the collection.
   * @param objectGroup Group containing the collections of the same object type.
   */
  private addCollection(
    objectCollection: any, collectionName: string,
    getObject: (object: any) => Object3D, objectGroup: Group) {
    const collscene = new THREE.Group();
    collscene.name = collectionName;

    for (const objectParams of objectCollection) {
      const object = getObject.bind(this)(objectParams);
      if (object) {
        collscene.add(object);
      }
      // console.log(objectParams);
      break;
    }

    objectGroup.add(collscene);
  }

  /**
   * Get collection names of a given object type.
   * @param object Contains all collections of a given type (Tracks, Jets, CaloClusters etc.).
   * @returns List of collection names of an object type (Tracks, Jets, CaloClusters etc.).
   */
  private getObjectTypeCollections(object: any): string[] {
    const collectionsList: string[] = [];

    for (const collectionName of Object.keys(object)) {
      if (object[collectionName] !== null) {
        collectionsList.push(collectionName);
      }
    }

    return collectionsList;
  }

  /**
   * Process the Muon from the given parameters and get it as a group.
   * @param muonParams Parameters of the Muon.
   * @returns Muon group containing Clusters and Tracks.
   */
  protected getMuon(muonParams: any): Object3D {
    const muonScene = new Group();

    for (const clusterID of muonParams.LinkedClusters) {
      const clusterColl = clusterID.split(':')[0];
      const clusterIndex = clusterID.split(':')[1];

      if (clusterColl && clusterIndex && this.eventData.CaloClusters && this.eventData.CaloClusters[clusterColl]) {
        const clusterParams = this.eventData.CaloClusters[clusterColl][clusterIndex];
        if (clusterParams) {
          const cluster = PhoenixObjects.getCluster(clusterParams);
          muonScene.add(cluster);
        }
      }
    }

    for (const trackID of muonParams.LinkedTracks) {
      const trackColl = trackID.split(':')[0];
      const trackIndex = trackID.split(':')[1];

      if (trackColl && trackIndex && this.eventData.Tracks && this.eventData.Tracks[trackColl]) {
        const trackParams = this.eventData.Tracks[trackColl][trackIndex];
        if (trackParams) {
          const track = PhoenixObjects.getTrack(trackParams);
          muonScene.add(track);
        }
      }
    }
    // uuid for selection of muons from the collections info panel
    muonParams.uuid = muonScene.uuid;
    muonScene.name = 'Muon';
    // add to scene
    return muonScene;
  }

  /**
   * Get metadata associated to the event (experiment info, time, run, event...).
   * @returns Metadata of the event.
   */
  getEventMetadata(): any[] {
    let metadata = [];

    // Dividing event meta data into groups by keys and label 
    // For example, the first array group is for "Run / Event / LS"
    const eventDataPropGroups = [
      [
        { keys: ['runNumber', 'run number'], label: 'Run' },
        { keys: ['eventNumber', 'event number'], label: 'Event' },
        { keys: ['ls'], label: 'LS' },
        { keys: ['lumiBlock'], label: 'LumiBlock' }
      ],
      [
        { keys: ['time'], label: 'Data recorded' }
      ]
    ];

    const eventDataKeys = Object.keys(this.eventData);

    // Iterating the group
    for (const eventDataPropGroup of eventDataPropGroups) {
      let combinedProps = {};
      // Iterating the props inside a group
      for (const eventDataProp of eventDataPropGroup) {
        // Iterating each possible key of a prop
        for (const eventDataPropKey of eventDataProp.keys) {
          if (eventDataKeys.includes(eventDataPropKey) && this.eventData[eventDataPropKey]) {
            combinedProps[eventDataProp.label] = this.eventData[eventDataPropKey];
            break;
          }
        }
      }
      if (Object.keys(combinedProps).length > 0) {
        // Joining and pushing the collected combined properties to the actual metadata
        metadata.push({
          label: Object.keys(combinedProps).join(' / '),
          value: Object.values(combinedProps).join(' / ')
        });
      }
    }

    return metadata;
  }

}
