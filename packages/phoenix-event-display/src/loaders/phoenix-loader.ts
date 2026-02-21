import { Group, Object3D, Vector3, Color } from 'three';
import { GUI } from 'dat.gui';
import type { EventDataLoader } from './event-data-loader';
import { UIManager } from '../managers/ui-manager/index';
import { ThreeManager } from '../managers/three-manager/index';
import { Cut } from '../lib/models/cut.model';
import { PhoenixObjects } from './objects/phoenix-objects';
import { InfoLogger } from '../helpers/info-logger';
import { PhoenixMenuNode } from '../managers/ui-manager/phoenix-menu/phoenix-menu-node';
import { LoadingManager } from '../managers/loading-manager';
import { StateManager } from '../managers/state-manager';
import { CoordinateHelper } from '../helpers/coordinate-helper';
import { getLabelTitle } from '../helpers/labels';
import { DatGUIMenuUI } from '../managers/ui-manager/dat-gui-ui';
import { PhoenixMenuUI } from '../managers/ui-manager/phoenix-menu/phoenix-menu-ui';
import {
  getDefaultObjectTypeConfigs,
  ObjectTypeConfig,
} from './object-type-registry';
import type {
  PhoenixEventData,
  PhoenixEventsData,
} from '../lib/types/event-data';
import * as _ from 'lodash';

/**
 * Loader for processing and loading an event.
 */
export class PhoenixLoader implements EventDataLoader {
  /** ThreeService to perform three.js related functions. */
  private graphicsLibrary: ThreeManager;

  /** UIService to perform UI related functions. */
  private ui: UIManager;

  /** Event data processed by the loader. */
  protected eventData: PhoenixEventData;
  /** Loading manager for loadable resources */
  protected loadingManager: LoadingManager;

  /** Loading manager for loadable resources */
  protected stateManager: StateManager;

  /** Object containing event object labels. */
  protected labelsObject: { [key: string]: any } = {};

  /**
   * Stores optional event-level time information.
   */
  private eventTime?: { time: number; unit: 'ns' };

  /**
   * Creates an instance of PhoenixLoader.
   */
  constructor() {
    this.loadingManager = new LoadingManager();
    this.stateManager = new StateManager();
  }

  /**
   * Gets event time metadata from the loaded event.
   * Used for time-aware animations.
   * @returns Event time information or undefined.
   */
  public getEventTime(): { time: number; unit: 'ns' } | undefined {
    return this.eventTime;
  }

  /**
   * Takes an object that represents ONE event and takes care of adding
   * the different objects to the graphics library and the UI controls.
   * @param eventData Object representing the event.
   * @param graphicsLibrary Service containing functionality to draw the 3D objects.
   * @param ui Service for showing menus and controls to manipulate the geometries.
   * @param infoLogger Service for logging data to the information panel.
   */
  public buildEventData(
    eventData: PhoenixEventData,
    graphicsLibrary: ThreeManager,
    ui: UIManager,
    infoLogger: InfoLogger,
  ): void {
    // Extract optional event-level time information
    if (typeof eventData?.time === 'number') {
      this.eventTime = {
        time: eventData.time,
        unit: 'ns',
      };
    } else {
      this.eventTime = undefined;
    }

    this.graphicsLibrary = graphicsLibrary;
    this.ui = ui;
    this.eventData = eventData;

    // initiate load
    this.loadObjectTypes(eventData);

    const eventNumber = String(
      eventData['event number'] ?? eventData['eventNumber'] ?? '000',
    );
    const runNumber = String(
      eventData['run number'] ?? eventData['runNumber'] ?? '000',
    );
    infoLogger.add('Event#' + eventNumber + ' from run#' + runNumber, 'Loaded');

    this.stateManager.eventMetadata = {
      runNumber,
      eventNumber,
    };
    // Forward event-level time to animation system if available
    const animationsManager =
      typeof (this.graphicsLibrary as any).getAnimationsManager === 'function'
        ? (this.graphicsLibrary as any).getAnimationsManager()
        : undefined;

    if (animationsManager && this.eventTime?.time !== undefined) {
      animationsManager.setEventTime(this.eventTime.time);
    }
  }

  /**
   * Get the list of event names from the event data.
   * @param eventsData Object containing all event data.
   * @returns List of event names.
   */
  public getEventsList(eventsData: PhoenixEventsData): string[] {
    const eventsList: string[] = [];

    for (const eventName in eventsData) {
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
  public getCollections(): { [key: string]: string[] } {
    if (!this.eventData) {
      return {};
    }

    const collectionsByType: { [key: string]: string[] } = {};
    const data = this.eventData as Record<string, any>;

    for (const objectType in data) {
      if (data[objectType] && typeof data[objectType] == 'object') {
        collectionsByType[objectType] = Object.keys(data[objectType]).sort();
      }
    }
    return collectionsByType;
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

    const data = this.eventData as Record<string, any>;

    for (const objectType in data) {
      if (data[objectType]) {
        for (const collection in data[objectType]) {
          if (collection === collectionName) {
            return data[objectType][collection];
          }
        }
      }
    }
  }

  /**
   * Get the object type configs for this loader. Override in subclasses
   * to add experiment-specific types or modify defaults.
   */
  protected getObjectTypeConfigs(): ObjectTypeConfig[] {
    return getDefaultObjectTypeConfigs();
  }

  /**
   * Load all object types from event data using the registry configs.
   * @param eventData One event in Phoenix format.
   */
  protected loadObjectTypes(eventData: PhoenixEventData) {
    const configs = this.getObjectTypeConfigs();

    for (const config of configs) {
      const rawData = eventData[config.typeName];
      if (!rawData) continue;

      // Resolve getObject — compound types bind at runtime
      let getObject = config.getObject;
      if (!getObject) {
        if (config.typeName === 'Photons') {
          getObject = this.getCompoundCluster;
        } else if (
          config.typeName === 'Muons' ||
          config.typeName === 'Electrons'
        ) {
          getObject = this.getCompoundTrack;
        } else {
          continue;
        }
      }

      // Preprocess data if needed (e.g. PlanarCaloCells flattening)
      const data = config.preprocessData
        ? config.preprocessData(rawData)
        : rawData;

      // Build scale UI extension from config
      let extendUI: ((tf: GUI, pm: PhoenixMenuNode) => void) | undefined;
      if (config.extendUI) {
        extendUI = (typeFolder: GUI, typeFolderPM: PhoenixMenuNode) => {
          config.extendUI(typeFolder, typeFolderPM, (typeName, value) => {
            this.graphicsLibrary
              .getSceneManager()
              .scaleChildObjects(typeName, value);
          });
        };
      } else if (config.scaleConfig) {
        const sc = config.scaleConfig;
        let scaleFn: (value: number) => void;
        if (sc.scaleMethod === 'scaleJets') {
          scaleFn = (value) =>
            this.graphicsLibrary.getSceneManager().scaleJets(value);
        } else {
          scaleFn = (value) =>
            this.graphicsLibrary
              .getSceneManager()
              .scaleChildObjects(config.typeName, value, sc.scaleAxis);
        }
        extendUI = this.addScaleOptions(sc.key, sc.label, scaleFn);
      }

      this.addObjectType(
        data,
        getObject,
        config.typeName,
        config.concatonateObjs ?? false,
        config.cuts,
        extendUI,
      );
    }
  }

  /**
   * Adds to the event display all collections of a given object type.
   * @param object Contains all collections of a given type (Tracks, Jets, CaloClusters...).
   * @param getObject Function that handles of reconstructing objects of the given type.
   * @param typeName Label for naming the object type.
   * @param concatonateObjs If true, don't process objects individually, but process as a group (e.g. for point hits). Default is false.
   * @param cuts Filters that can be applied to the objects.
   * @param extendEventDataTypeUI A callback to add more options to event data type UI folder.
   */
  protected addObjectType(
    object: any,
    getObject: any,
    typeName: string,
    concatonateObjs: boolean = false,
    cuts?: Cut[],
    extendEventDataTypeUI?: (
      typeFolder: GUI,
      typeFolderPM: PhoenixMenuNode,
    ) => void,
  ) {
    const objectGroup = this.graphicsLibrary.addEventDataTypeGroup(typeName);
    const collectionsList: string[] = this.getObjectTypeCollections(object);

    this.ui.addEventDataTypeFolder(typeName);

    for (const collectionName of collectionsList) {
      const newCuts = _.cloneDeep(cuts);
      // Make a new array ^, otherwise we reuse the same cuts for each collection
      const objectCollection = object[collectionName];

      if (objectCollection.length == 0) {
        console.log(
          `Skipping ${typeName} collection ${collectionName} since it is empty.`,
        );
        continue;
      }

      this.addCollection(
        objectCollection,
        collectionName,
        getObject,
        typeName,
        objectGroup,
        concatonateObjs,
      );

      // collectionCuts is shallow copy
      const collectionCuts = newCuts?.filter(
        (cut) => cut.field in objectCollection[0],
      );

      const collectionColor = new Color(
        object[collectionName][0].color
          ? object[collectionName][0].color
          : 0xffffff,
      );
      this.ui.addCollection(
        typeName,
        collectionName,
        collectionCuts,
        collectionColor,
      );
    }

    const eventDataTypeFolderDatGUI = this.ui
      .getUIMenus()
      .find((menu) => menu instanceof DatGUIMenuUI)
      ?.getEventDataTypeFolder(typeName) as GUI;
    const eventDataTypeFolderPhoenixMenu = this.ui
      .getUIMenus()
      .find((menu) => menu instanceof PhoenixMenuUI)
      ?.getEventDataTypeFolder(typeName) as PhoenixMenuNode;

    extendEventDataTypeUI?.(
      eventDataTypeFolderDatGUI,
      eventDataTypeFolderPhoenixMenu,
    );
  }

  /**
   * Adds to the event display all the objects inside a collection.
   * @param objectCollection Contains the params for every object of the collection.
   * @param collectionName Label to UNIQUELY identify the collection.
   * @param getObject Handles reconstructing the objects of the collection.
   * @param objectGroup Group containing the collections of the same object type.
   * @param concatonateObjs If true, don't process objects individually, but process as a group (e.g. for point hits).
   */
  private addCollection(
    objectCollection: any,
    collectionName: string,
    getObject: (object: any, typeName: string) => Object3D,
    typeName: string,
    objectGroup: Group,
    concatonateObjs: boolean,
  ) {
    const collscene = new Group();
    collscene.name = collectionName;

    if (concatonateObjs) {
      //in this case, we just pass the entire collection in
      const object = getObject.bind(this)(objectCollection, typeName);
      if (object) {
        collscene.add(object);
      }
    } else {
      for (const objectParams of objectCollection) {
        const object = getObject.bind(this)(objectParams, typeName);
        if (object) {
          collscene.add(object);
        }
      }
    }

    objectGroup.add(collscene);
    // console.log("-> Adding a threejs group called "+collscene.name+" with "+collscene.children.length+" children to the group called "+objectGroup.name);
  }

  /**
   * Get collection names of a given object type.
   * @param object Contains all collections of a given type (Tracks, Jets, CaloClusters etc.).
   * @returns List of collection names of an object type (Tracks, Jets, CaloClusters etc.).
   */
  private getObjectTypeCollections(object: any): string[] {
    const collectionsList: string[] = [];

    for (const collectionName in object) {
      if (object[collectionName] !== null) {
        collectionsList.push(collectionName);
      }
    }

    return collectionsList;
  }

  /** Process the compound object of track type (e.g. Muon, Electron, ..) from the given parameters and get it as a group.
   */
  protected getCompoundTrack(params: any, name = ''): Object3D {
    return this.getCompound(params, name, true, false);
  }

  /** Process the compound object of cluster type (e.g. Photon, ..) from the given parameters and get it as a group.
   */
  protected getCompoundCluster(params: any, name = ''): Object3D {
    return this.getCompound(params, name, false, true);
  }

  /**
   * Process the compound object (e.g. Muon, Electron, Photon) from the given parameters and get it as a group.
   * FIXME. This is currently here and not in PhoenixObjects because we need to handle linked objects.
   * @param params Parameters of the Muon.
   * @returns Muon group containing Clusters and Tracks.
   */
  protected getCompound(
    params: any,
    name = '',
    objectIsTrack: boolean = false,
    objectIsCluster: boolean = false,
  ): Object3D {
    const scene = new Group();
    // Try to find a linked cluster if possible, and draw this.
    // If not (and if this makes sense), try to make a cluster from the compound object itself
    if ('LinkedClusters' in params && params.LinkedClusters) {
      for (const clusterID of params.LinkedClusters) {
        const clusterColl = clusterID.split(':')[0];
        const clusterIndex = clusterID.split(':')[1];

        if (
          clusterColl &&
          clusterIndex &&
          this.eventData.CaloClusters &&
          this.eventData.CaloClusters[clusterColl]
        ) {
          const clusterParams =
            this.eventData.CaloClusters[clusterColl][clusterIndex];
          if (clusterParams) {
            const cluster = PhoenixObjects.getCluster(clusterParams);
            cluster.name = name + ' Cluster';
            scene.add(cluster);
          }
        }
      }
    } else if (objectIsCluster) {
      const clusterParams = {
        energy: params?.energy,
        phi: params?.phi,
        eta: params?.eta,
      };
      const cluster = PhoenixObjects.getCluster(clusterParams);
      cluster.name = name + ' Cluster';
      scene.add(cluster);
    }
    // Try to find a linked track if possible, and draw this.
    // If not (and if this makes sense), try to extrapolate the compound object itself
    if ('LinkedTracks' in params && params.LinkedTracks) {
      for (const trackID of params.LinkedTracks) {
        const trackColl = trackID.split(':')[0];
        const trackIndex = trackID.split(':')[1];

        if (
          trackColl &&
          trackIndex &&
          this.eventData.Tracks &&
          this.eventData.Tracks[trackColl]
        ) {
          const trackParams = this.eventData.Tracks[trackColl][trackIndex];
          if (trackParams) {
            const track = PhoenixObjects.getTrack(trackParams);
            if (track) {
              track.name = name + ' Track';
              scene.add(track);
            } else {
              console.log('WARNING: failed to get a track back.');
            }
          }
        }
      }
    } else if (objectIsTrack) {
      // We don't have links to any track, but maybe we can extrapolate something reasonable?
      // ATLAS JiveXML have the following: energy, eta, phi, pt
      const startPos = new Vector3(0, 0, 0);
      const theta = CoordinateHelper.etaToTheta(params.eta);
      const p = params.pt / Math.cos(Math.PI / 2 - theta);

      let q = 0;
      if ('pdgId' in params) {
        q = params.pdgId > 0 ? 1 : -1;
      }

      // dparams = d0, z0, phi, theta, q/p
      const trackparams = { dparams: [0, 0, params.phi, theta, q / p] };

      const track = PhoenixObjects.getTrack(trackparams);
      if (track) {
        track.name = name + ' Track';
        scene.add(track);
      } else {
        console.log('WARNING: failed to get a track back.');
      }
    }
    // uuid for selection of compound obj from the collections info panel
    params.uuid = scene.uuid;
    scene.name = name;
    // add to scene
    return scene;
  }

  /**
   * Get metadata associated to the event (experiment info, time, run, event...).
   * @returns Metadata of the event.
   */
  getEventMetadata(): any[] {
    const metadata = [];

    // Dividing event meta data into groups by keys and label
    // For example, the first array group is for "Run / Event / LS"
    const eventDataPropGroups = [
      [
        { keys: ['runNumber', 'run number'], label: 'Run' },
        { keys: ['eventNumber', 'event number'], label: 'Event' },
        { keys: ['ls'], label: 'LS' },
        { keys: ['lumiBlock'], label: 'LumiBlock' },
      ],
      [{ keys: ['time'], label: 'Data recorded' }],
    ];

    const data = this.eventData as Record<string, any>;
    const eventDataKeys = Object.keys(data);

    // Iterating the group
    for (const eventDataPropGroup of eventDataPropGroups) {
      const combinedProps: { [key: string]: any } = {};
      // Iterating the props inside a group
      for (const eventDataProp of eventDataPropGroup) {
        // Iterating each possible key of a prop
        for (const eventDataPropKey of eventDataProp.keys) {
          if (
            eventDataKeys.includes(eventDataPropKey) &&
            eventDataPropKey in data
          ) {
            combinedProps[eventDataProp.label] = data[eventDataPropKey];
            break;
          }
        }
      }

      if (Object.keys(combinedProps).length > 0) {
        // Joining and pushing the collected combined properties to the actual metadata
        metadata.push({
          label: Object.keys(combinedProps).join(' / '),
          value: Object.values(combinedProps).join(' / '),
        });
      }
    }

    return metadata;
  }

  /**
   * Add label of event object to the labels object.
   * @param label Label to be saved.
   * @param collection Collection the event object is a part of.
   * @param indexInCollection Event object's index in collection.
   * @returns A unique label ID string.
   */
  public addLabelToEventObject(
    label: string,
    collection: string,
    indexInCollection: number,
  ): string {
    const data = this.eventData as Record<string, any>;
    for (const eventDataType in data) {
      if (data?.[eventDataType]?.[collection]) {
        this.labelsObject[eventDataType] =
          this.labelsObject[eventDataType] || {};
        this.labelsObject[eventDataType][collection] =
          this.labelsObject[eventDataType][collection] || {};

        this.labelsObject[eventDataType][collection][indexInCollection] = label;
        const tmp = data[eventDataType][collection][indexInCollection];
        tmp.labelText = label;
        return getLabelTitle(eventDataType, collection, indexInCollection);
      }
    }
    return 'Unknown';
  }

  /**
   * Get the object containing labels.
   * @returns The labels object.
   */
  public getLabelsObject(): { [key: string]: any } {
    return this.labelsObject;
  }

  /**
   * Get function to add options to scale event object type by.
   * @param configKey Key of the scale configuration option (for dat.GUI menu).
   * @param configLabel Label of the scale configuration option.
   * @param scaleFunction Function to scale the objects by.
   * @returns Function which adds scale options to Phoenix menu and dat.GUI menu.
   */
  public addScaleOptions(
    configKey: string,
    configLabel: string,
    scaleFunction: (value: number) => void,
  ) {
    return (typeFolder: GUI, typeFolderPM: PhoenixMenuNode) => {
      // dat.GUI menu
      if (typeFolder) {
        const sizeMenu = typeFolder
          .add({ [configKey]: 1 }, configKey, 0.001, 100)
          .name(configLabel);
        sizeMenu.onChange(scaleFunction);
      }

      // Phoenix menu
      if (typeFolderPM) {
        typeFolderPM.addConfig({
          type: 'slider',
          label: configLabel,
          value: 1,
          min: 0.001,
          step: 0.01,
          max: 100,
          allowCustomValue: true,
          onChange: scaleFunction,
        });
      }
    };
  }
}
