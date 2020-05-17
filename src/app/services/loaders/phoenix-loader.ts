import { EventDataLoader } from '../event-data-loader';
import { Group, Object3D } from 'three';
import * as THREE from 'three';
import { UIService } from '../ui.service';
import { ThreeService } from '../three.service';
import { Cut } from '../extras/cut.model';
import { PhoenixObjects } from './objects/phoenix-objects';

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
   */
  public buildEventData(eventData: any, graphicsLibrary: ThreeService, ui: UIService): void {
    this.graphicsLibrary = graphicsLibrary;
    this.ui = ui;
    this.eventData = eventData;

    // initiate load
    this.loadObjectTypes(eventData);
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
      for (const collection of Object.keys(this.eventData[objectType])) {
        collections.push(collection);
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
      for (const collection of Object.keys(this.eventData[objectType])) {
        if (collection === collectionName) {
          return this.eventData[objectType][collection];
        }
      }
    }
  }

  /**
   * Receives an object containing the data from an event and parses it
   * to reconstruct the different collections of physics objects.
   * @param eventData Representing ONE event (expressed in the Phoenix format).
   */
  private loadObjectTypes(eventData: any) {
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

      this.addObjectType(eventData.Jets, PhoenixObjects.getJet, 'Jets', cuts);
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
   */
  private addObjectType(object: any, getObject: any, typeName: string, cuts?: Cut[]) {

    const typeFolder = this.ui.addEventDataTypeFolder(typeName);
    const objectGroup = this.graphicsLibrary.addEventDataTypeGroup(typeName);

    const collectionsList: string[] = this.getObjectTypeCollections(object);


    for (const collectionName of collectionsList) {
      const objectCollection = object[collectionName];

      this.addCollection(objectCollection, collectionName, getObject, objectGroup);

      cuts = cuts?.filter(cut => objectCollection[0][cut.field]);
      this.ui.addCollection(typeFolder, collectionName, cuts);
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
    // add to scene
    return muonScene;
  }

  /**
   * Get metadata associated to the event (experiment info, time, run, event...).
   * @returns Metadata of the event.
   */
  getEventMetadata(): string[] {
    // Not implemented
    return [];
  }

}
