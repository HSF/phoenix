import { Group, Object3D } from 'three';
import { GUI } from 'dat.gui';
import { EventDataLoader } from './event-data-loader';
import { UIManager } from '../managers/ui-manager';
import { ThreeManager } from '../managers/three-manager';
import { Cut } from '../extras/cut.model';
import { PhoenixObjects } from './objects/phoenix-objects';
import { InfoLogger } from '../helpers/info-logger';
import { PhoenixMenuNode } from '../managers/ui-manager/phoenix-menu/phoenix-menu-node';
import { LoadingManager } from '../managers/loading-manager';
import { StateManager } from '../managers/state-manager';

/**
 * Loader for processing and loading an event.
 */
export class PhoenixLoader implements EventDataLoader {
  /** ThreeService to perform three.js related functions. */
  private graphicsLibrary: ThreeManager;
  /** UIService to perform UI related functions. */
  private ui: UIManager;
  /** Event data processed by the loader. */
  protected eventData: any;
  /** Loading manager for loadable resources */
  protected loadingManager: LoadingManager;
  /** Loading manager for loadable resources */
  protected stateManager: StateManager;
  /** Object containing event object labels. */
  protected labelsObject: { [key: string]: any } = {};

  /**
   * Create the Phoenix loader.
   */
  constructor() {
    this.loadingManager = new LoadingManager();
    this.stateManager = new StateManager();
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
    eventData: any,
    graphicsLibrary: ThreeManager,
    ui: UIManager,
    infoLogger: InfoLogger
  ): void {
    this.graphicsLibrary = graphicsLibrary;
    this.ui = ui;
    this.eventData = eventData;

    // Replacing tracks with tracks through Runge-Kutta
    // TODO - make this configurable? Or possibly automatic if tracks have <2 positions to draw?
    // Object.assign(this.eventData.Tracks, this.getTracksWithRungeKutta(this.eventData['Tracks']));

    // initiate load
    this.loadObjectTypes(eventData);

    const eventNumber = eventData['event number']
      ? eventData['event number']
      : eventData['eventNumber'];
    const runNumber = eventData['run number']
      ? eventData['run number']
      : eventData['runNumber'];
    infoLogger.add('Event#' + eventNumber + ' from run#' + runNumber, 'Loaded');

    this.stateManager.eventMetadata = {
      runNumber,
      eventNumber,
    };
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
      if (
        this.eventData[objectType] &&
        typeof this.eventData[objectType] === 'object'
      ) {
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
    // PI with 2 fraction digits
    const pi = parseFloat(Math.PI.toFixed(2));

    if (eventData.Tracks) {
      // (Optional) Cuts can be added to any physics object.
      const cuts: Cut[] = [
        new Cut('phi', -pi, pi, 0.01),
        new Cut('eta', -4, 4, 0.1),
        new Cut('chi2', 0, 100),
        new Cut('dof', 0, 100),
        new Cut('pT', 0, 50, 0.1),
      ];

      this.addObjectType(
        eventData.Tracks,
        PhoenixObjects.getTrack,
        'Tracks',
        false,
        cuts
      );
      // infoLogger.add('Got ' + Object.keys(eventData.Tracks).length + ' Track collections.');
    }

    if (eventData.Jets) {
      // (Optional) Cuts can be added to any physics object.
      const cuts = [
        new Cut('phi', -pi, pi, 0.01),
        new Cut('eta', -5.0, 5.0, 0.1),
        new Cut('energy', 0, 100000, 100),
      ];

      const addJetsSizeOption = (
        typeFolder: any,
        typeFolderPM: PhoenixMenuNode
      ) => {
        const scaleJets = (value: number) => {
          this.graphicsLibrary.getSceneManager().scaleJets(value);
        };
        if (typeFolder) {
          const sizeMenu = typeFolder
            .add({ jetsScale: 100 }, 'jetsScale', 1, 200)
            .name('Jets Size (%)');
          sizeMenu.onChange(scaleJets);
        }
        // Phoenix menu
        if (typeFolderPM) {
          typeFolderPM.addConfig('slider', {
            label: 'Jets Size (%)',
            value: 100,
            min: 1,
            max: 200,
            allowCustomValue: true,
            onChange: scaleJets,
          });
        }
      };

      this.addObjectType(
        eventData.Jets,
        PhoenixObjects.getJet,
        'Jets',
        false,
        cuts,
        addJetsSizeOption
      );
    }

    if (eventData.Hits) {
      // Cannot currently cut on just a position array.
      this.addObjectType(eventData.Hits, PhoenixObjects.getHits, 'Hits', true);
    }

    if (eventData.CaloClusters) {
      // (Optional) Cuts can be added to any physics object.
      const cuts = [
        new Cut('phi', -pi, pi, 0.01),
        new Cut('eta', -5.0, 5.0),
        new Cut('energy', 0, 10000),
      ];

      const addCaloClusterOptions = (
        typeFolder: GUI,
        typeFolderPM: PhoenixMenuNode
      ) => {
        const scaleCaloClusters = (value: number) => {
          this.graphicsLibrary
            .getSceneManager()
            .scaleChildObjects('CaloClusters', value / 100, 'z');
        };

        if (typeFolder) {
          const sizeMenu = typeFolder
            .add({ caloClustersScale: 100 }, 'caloClustersScale', 1, 400)
            .name('CaloClusters Size (%)');
          sizeMenu.onChange(scaleCaloClusters);
        }
        // Phoenix menu
        if (typeFolderPM) {
          typeFolderPM.addConfig('slider', {
            label: 'CaloClusters Size (%)',
            value: 100,
            min: 1,
            max: 400,
            allowCustomValue: true,
            onChange: scaleCaloClusters,
          });
        }
      };

      this.addObjectType(
        eventData.CaloClusters,
        PhoenixObjects.getCluster,
        'CaloClusters',
        false,
        cuts,
        addCaloClusterOptions
      );
    }

    if (eventData.PlanarCaloCells) {
      // (Optional) Cuts can be added to any physics object.
      // const cuts = [
      //   new Cut('energy', 0, 10000)
      // ];

      const addPlanarCaloCellsOptions = (
        typeFolder: GUI,
        typeFolderPM: PhoenixMenuNode
      ) => {
        const scalePlanarCaloCells = (value: number) => {
          this.graphicsLibrary
            .getSceneManager()
            .scaleChildObjects('PlanarCaloCells', value / 100, 'z');
        };

        if (typeFolder) {
          const sizeMenu = typeFolder
            .add({ PlanarCaloCellsScale: 100 }, 'PlanarCaloCellsScale', 1, 400)
            .name('PlanarCaloCells Size (%)');
          sizeMenu.onChange(scalePlanarCaloCells);
        }

        if (typeFolderPM) {
          typeFolderPM.addConfig('slider', {
            label: 'PlanarCaloCells Size (%)',
            value: 100,
            min: 1,
            max: 400,
            allowCustomValue: true,
            onChange: scalePlanarCaloCells,
          });
        }
      };

      // this.addObjectType(
      //   eventData.PlanarCaloCells,
      //   PhoenixObjects.getPlanarCaloCell,
      //   'PlanarCaloCells',
      //   false,
      //   cuts,
      //   addPlanarCaloCellsOptions
      // );

      const { typeFolder, typeFolderPM } = this.ui.addEventDataTypeFolder(
        'PlanarCaloCells'
      );
      const objectGroup = this.graphicsLibrary.addEventDataTypeGroup(
        'PlanarCaloCells'
      );

      const collectionsList: string[] = this.getObjectTypeCollections(
        eventData.PlanarCaloCells
      );

      for (const collectionName of collectionsList) {
        const objectCollection =
          eventData.PlanarCaloCells[collectionName]['cells'];
        console.log(
          ` PlanarCaloCells collection ${collectionName} has ${objectCollection.length} constituents.`
        );

        if (objectCollection.length == 0) {
          console.log('Skipping');
          return;
        }

        const plane = eventData.PlanarCaloCells[collectionName]['plane'];

        const getPlane = (caloCells: any) => {
          return PhoenixObjects.getPlanarCaloCell(caloCells, plane);
        };

        this.addCollection(
          objectCollection,
          collectionName,
          getPlane,
          objectGroup,
          false
        );

        //cuts = cuts?.filter((cut) => cut.field in objectCollection[0]);
        this.ui.addCollection({ typeFolder, typeFolderPM }, collectionName);
      }
    }

    if (eventData.Muons) {
      const cuts = [
        new Cut('phi', -pi, pi, 0.01),
        new Cut('eta', -4, 4, 0.1),
        new Cut('energy', 0, 10000),
        new Cut('pT', 0, 50),
      ];
      this.addObjectType(eventData.Muons, this.getMuon, 'Muons', false, cuts);
    }

    // if (eventData.Photons) {
    //   this.addObjectType(eventData.Photons, PhoenixObjects.getPhotons, 'Photons');
    // }

    // if (eventData.Electrons) {
    //   this.addObjectType(eventData.Photons, PhoenixObjects.getElectrons, 'Electrons');
    // }

    if (eventData.Vertices) {
      const cuts = [new Cut('vertexType', 0, 5)];
      this.addObjectType(
        eventData.Vertices,
        PhoenixObjects.getVertex,
        'Vertices',
        false,
        cuts
      );
    }

    if (eventData.MissingEnergy) {
      const addMETSizeOption = (
        typeFolder: GUI,
        typeFolderPM: PhoenixMenuNode
      ) => {
        const scaleMET = (value: number) => {
          this.graphicsLibrary
            .getSceneManager()
            .scaleChildObjects('MissingEnergy', value);
        };
        if (typeFolder) {
          const sizeMenu = typeFolder
            .add({ jetsScale: 100 }, 'Scale', 1, 200)
            .name('Size (%)');
          sizeMenu.onChange(scaleMET);
        }
        // Phoenix menu
        if (typeFolderPM) {
          typeFolderPM.addConfig('slider', {
            label: 'Size (%)',
            value: 100,
            min: 1,
            max: 200,
            allowCustomValue: true,
            onChange: scaleMET,
          });
        }
      };
      this.addObjectType(
        eventData.MissingEnergy,
        PhoenixObjects.getMissingEnergy,
        'MissingEnergy',
        false,
        [],
        addMETSizeOption
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
      typeFolderPM?: PhoenixMenuNode
    ) => void
  ) {
    const { typeFolder, typeFolderPM } = this.ui.addEventDataTypeFolder(
      typeName
    );
    const objectGroup = this.graphicsLibrary.addEventDataTypeGroup(typeName);

    const collectionsList: string[] = this.getObjectTypeCollections(object);

    for (const collectionName of collectionsList) {
      const objectCollection = object[collectionName];
      console.log(
        `${typeName} collection ${collectionName} has ${objectCollection.length} constituents.`
      );

      if (objectCollection.length == 0) {
        console.log('Skipping');
        return;
      }

      this.addCollection(
        objectCollection,
        collectionName,
        getObject,
        objectGroup,
        concatonateObjs
      );

      cuts = cuts?.filter((cut) => cut.field in objectCollection[0]);
      this.ui.addCollection({ typeFolder, typeFolderPM }, collectionName, cuts);
    }

    extendEventDataTypeUI?.(typeFolder, typeFolderPM);
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
    getObject: (object: any) => Object3D,
    objectGroup: Group,
    concatonateObjs: boolean
  ) {
    const collscene = new Group();
    collscene.name = collectionName;

    if (concatonateObjs) {
      //in this case, we just pass the entire collection in
      const object = getObject.bind(this)(objectCollection);
      if (object) {
        collscene.add(object);
      }
    } else {
      for (const objectParams of objectCollection) {
        const object = getObject.bind(this)(objectParams);
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
    if ('LinkedClusters' in muonParams) {
      for (const clusterID of muonParams.LinkedClusters) {
        const clusterColl = clusterID.split(':')[0];
        const clusterIndex = clusterID.split(':')[1];

        if (
          clusterColl &&
          clusterIndex &&
          this.eventData.CaloClusters &&
          this.eventData.CaloClusters[clusterColl]
        ) {
          const clusterParams = this.eventData.CaloClusters[clusterColl][
            clusterIndex
          ];
          if (clusterParams) {
            const cluster = PhoenixObjects.getCluster(clusterParams);
            muonScene.add(cluster);
          }
        }
      }
    }
    if ('LinkedTracks' in muonParams) {
      for (const trackID of muonParams.LinkedTracks) {
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
            muonScene.add(track);
          }
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
        { keys: ['lumiBlock'], label: 'LumiBlock' },
      ],
      [{ keys: ['time'], label: 'Data recorded' }],
    ];

    const eventDataKeys = Object.keys(this.eventData);

    // Iterating the group
    for (const eventDataPropGroup of eventDataPropGroups) {
      let combinedProps = {};
      // Iterating the props inside a group
      for (const eventDataProp of eventDataPropGroup) {
        // Iterating each possible key of a prop
        for (const eventDataPropKey of eventDataProp.keys) {
          if (
            eventDataKeys.includes(eventDataPropKey) &&
            this.eventData[eventDataPropKey]
          ) {
            combinedProps[eventDataProp.label] = this.eventData[
              eventDataPropKey
            ];
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
    indexInCollection: number
  ): string {
    for (const eventDataType of Object.keys(this.eventData)) {
      if (
        this.eventData[eventDataType] &&
        Object.keys(this.eventData[eventDataType]).includes(collection)
      ) {
        this.labelsObject[eventDataType] =
          this.labelsObject[eventDataType] || {};
        this.labelsObject[eventDataType][collection] =
          this.labelsObject[eventDataType][collection] || {};

        this.labelsObject[eventDataType][collection][indexInCollection] = label;

        return `${eventDataType} > ${collection} > ${indexInCollection}`;
      }
    }
  }

  /**
   * Get the object containing labels.
   * @returns The labels object.
   */
  public getLabelsObject(): object {
    return this.labelsObject;
  }
}
