import { EventDataLoader } from '../event-data-loader';
import { Group, Object3D, Scene, Vector3 } from 'three';
import * as THREE from 'three';
import { UIService } from '../ui.service';
import { ThreeService } from '../three.service';
import { Cut } from '../extras/cut.model';
import { PhoenixObjects } from './objects/phoenix-objects';

export class PhoenixLoader implements EventDataLoader {
  private graphicsLibrary: ThreeService;
  private ui: UIService;
  private eventData: any;


  public buildEventData(eventData: any, graphicsLibrary: ThreeService, ui: UIService): void {
    this.graphicsLibrary = graphicsLibrary;
    this.ui = ui;
    this.eventData = eventData;

    // initiate load
    this.loadObjectTypes(eventData);
  }

  public getEventsList(eventsData: any): string[] {
    const eventsList: string[] = [];

    for (const eventName of Object.keys(eventsData)) {
      if (eventsData[eventName] !== null) {
        eventsList.push(eventName);
      }
    }

    return eventsList;
  }

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
   * Receives an object containg the data from an event and parses it to reconstruct the different collections
   * of physics objects.
   * @param eventData representing ONE event (expressed in the Phoenix format).
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
   * @param object contains all collections of a given type (Tracks, Jets, CaloClusters...)
   * @param getObject function that handles of reconstructing objects of the given type.
   * @param typeName label for naming the object type.
   * @param cuts (Optional) filters that can be applied to the objects.
   */
  private addObjectType(object: any, getObject: any, typeName: string, cuts?: Cut[]) {

    const typeFolder = this.ui.addEventDataTypeFolder(typeName);
    const objectGroup = this.graphicsLibrary.addEventDataTypeGroup(typeName);

    const collectionsList: string[] = this.getObjectTypeCollections(object);


    for (const collectionName of collectionsList) {
      const objectCollection = object[collectionName];

      this.addCollection(objectCollection, collectionName, getObject, objectGroup);
      this.ui.addCollection(typeFolder, collectionName, cuts);
    }
  }

  /**
   * Adds to the event display all the objects inside a collection.
   * @param objectCollection contains the params for every object of the collection.
   * @param collectionName label to UNIQUELY identify the collection.
   * @param getObject handles reconstructing the objects of the objects of the collection.
   * @param objectGroup group containing the collections of the same object type.
   */
  private addCollection(objectCollection: any, collectionName: string,
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

  private getObjectTypeCollections(object: any): string[] {
    const collectionsList: string[] = [];

    for (const collectionName of Object.keys(object)) {
      if (object[collectionName] !== null) {
        collectionsList.push(collectionName);
      }
    }

    return collectionsList;
  }

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


}
