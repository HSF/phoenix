import { ThreeManager } from './three/index';
import { UIManager } from './ui/index';
import { InfoLogger } from './info-logger';
import { Configuration } from './extras/configuration';
import { StateManager } from './managers/state-manager';
import { JiveXMLLoader } from './loaders/jivexml-loader';
import { LoadingManager } from './managers/loading-manager';
import { PhoenixLoader } from './loaders/phoenix-loader';

declare global {
  /**
   * Window interface for adding objects to the window object.
   */
  interface Window {
    /** EventDisplay object containing event display related functions. */
    EventDisplay: any;
  }
}

/**
 * Phoenix event display class for managing detector geometries and event data.
 */
export class EventDisplay {
  /** Configuration for preset views and event data loader. */
  private configuration: Configuration;
  /** An object containing event data. */
  private eventsData: any;
  /** Array containing callbacks to be called when events change. */
  private onEventsChange: ((events: any) => void)[] = [];
  /** Array containing callbacks to be called when the displayed event changes. */
  private onDisplayedEventChange: ((nowDisplayingEvent: any) => void)[] = [];
  /** Three manager for three.js operations. */
  private graphicsLibrary: ThreeManager;
  /** Info logger for storing event display logs. */
  private infoLogger: InfoLogger;
  /** UI manager for UI menu. */
  private ui: UIManager;
  /** Loading manager for loadable resources */
  private loadingManager: LoadingManager;

  /**
   * Create the Phoenix event display and intitialize all the elements.
   * @param configuration Configuration used to customize different aspects.
   */
  constructor(configuration?: Configuration) {
    this.loadingManager = new LoadingManager();
    this.infoLogger = new InfoLogger();
    this.graphicsLibrary = new ThreeManager(this.infoLogger);
    this.ui = new UIManager(this.graphicsLibrary);
    if (configuration) {
      this.init(configuration);
    }
  }

  /**
   * Initialize all the Phoenix event display elements.
   * @param configuration Configuration used to customize different aspects.
   */
  public init(configuration: Configuration) {
    this.configuration = configuration;

    // Initialize the three manager with configuration
    this.graphicsLibrary.init(configuration);
    // Initialize the UI with configuration
    this.ui.init(configuration);
    // Set up for the state manager
    new StateManager().setEventDisplay(this);

    // Animate loop
    const uiLoop = () => {
      this.ui.updateUI();
    };
    this.graphicsLibrary.setAnimationLoop(uiLoop);

    // Allow adding elements through console
    this.enableEventDisplayConsole();
    // Allow keyboard controls
    this.enableKeyboardControls();
    // Initialize event with data from URL if there is any
    this.initEventFromURL(
      configuration.defaultEventFile?.eventFile,
      configuration.defaultEventFile?.eventType
    );
  }

  /**
   * Initialize VR.
   * @param onSessionEnded Callback when the VR session ends.
   */
  public initVR(onSessionEnded?: () => void) {
    this.graphicsLibrary.initVRSession(onSessionEnded);
  }

  /**
   * End VR and remove VR settings.
   */
  public endVR() {
    this.graphicsLibrary.endVRSession();
  }

  /**
   * Receives an object containing all the eventKeys and saves it.
   * Then it loads by default the first event.
   * @param eventsData Object containing the event data.
   * @returns Array of strings containing the keys of the eventsData object.
   */
  public parsePhoenixEvents(eventsData: any): string[] {
    this.eventsData = eventsData;
    const eventKeys = this.configuration.eventDataLoader.getEventsList(eventsData);
    this.loadEvent(eventKeys[0]);
    this.onEventsChange.forEach(callback => callback(eventKeys));
    return eventKeys;
  }

  /**
   * Receives an object containing one event and builds the different collections
   * of physics objects.
   * @param eventData Object containing the event data.
   */
  public buildEventDataFromJSON(eventData: any) {
    // Creating UI folder
    this.ui.addEventDataFolder();
    // Clearing existing event data
    this.graphicsLibrary.clearEventData();
    // Build data and add to scene
    this.configuration.eventDataLoader.buildEventData(eventData, this.graphicsLibrary, this.ui, this.infoLogger);
    this.onDisplayedEventChange.forEach((callback) => callback(eventData));
  }

  /**
   * Receives a string representing the key of an event and loads
   * the event associated with that key.
   * @param eventKey String that represents the event in the eventsData object.
   */
  public loadEvent(eventKey: any) {
    const event = this.eventsData[eventKey];

    if (event) {
      this.buildEventDataFromJSON(event);
    }
  }

  /**
   * Get the three manager responsible for three.js functions.
   * @returns The three.js manager.
   */
  public getThreeManager() {
    return this.graphicsLibrary;
  }

  /**
   * Get the UI manager responsible for UI related functions.
   * @returns The UI manager.
   */
  public getUIManager() {
    return this.ui;
  }

  /**
   * Get the info logger containing event display logs.
   * @returns The info logger instance being used by the event display.
   */
  public getInfoLogger() {
    return this.infoLogger;
  }

  /**
   * Get the loading manager for managing loadable items.
   * @returns The loading manager.
   */
  public getLoadingManager() {
    return this.loadingManager;
  }

  // **********************
  // * LOADING GEOMETRIES *
  // **********************

  /**
   * Loads an OBJ (.obj) geometry from the given filename
   * and adds it to the dat.GUI menu.
   * @param filename Path to the geometry.
   * @param name Name given to the geometry.
   * @param color Color to initialize the geometry.
   * @param menuNodeName Name of the node in Phoenix menu to add the geometry to.
   * @param doubleSided If true, render both sides of the material.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   * @param setFlat Whether object should be flat-shaded or not.
   * @returns Promise for loading the geometry.
   */
  public loadOBJGeometry(
    filename: string,
    name: string, color: any,
    menuNodeName?: string, doubleSided?: boolean,
    initiallyVisible: boolean = true,
    setFlat: boolean = true
  ): Promise<unknown> {
    this.loadingManager.addLoadableItem(`obj_geom_${name}`);
    this.ui.addGeometry(name, color, menuNodeName, initiallyVisible);
    this.infoLogger.add(name, 'Loaded OBJ geometry');
    return this.graphicsLibrary.loadOBJGeometry(filename, name, color, doubleSided, initiallyVisible, setFlat);
  }

  /**
   * Parses and loads an OBJ geometry from the given content
   * and adds it to the dat.GUI menu.
   * @param content Content of the OBJ geometry.
   * @param name Name given to the geometry.
   * @param menuNodeName Name of the node in Phoenix menu to add the geometry to.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   */
  public parseOBJGeometry(content: string, name: string,
    menuNodeName?: string, initiallyVisible: boolean = true) {
    this.loadingManager.addLoadableItem(`parse_obj_${name}`);
    this.graphicsLibrary.parseOBJGeometry(content, name, initiallyVisible);
    this.ui.addGeometry(name, 0x000fff, menuNodeName, initiallyVisible);
  }

  /**
   * Exports scene to OBJ file format.
   */
  public exportToOBJ() {
    this.graphicsLibrary.exportSceneToOBJ();
    this.infoLogger.add('Exported scene to OBJ');
  }

  /**
   * Parse and load an event from the Phoenix file format (.phnx).
   * @param input Content containing the JSON with event data
   * and other configuration.
   * @returns Promise for loading the geometry.
   */
  public parsePhoenixDisplay(input: any): Promise<unknown> {
    const phoenixScene = JSON.parse(input);

    if (phoenixScene.sceneConfiguration && phoenixScene.scene) {
      // Creating UI folder
      this.ui.addEventDataFolder();
      // Clearing existing event data
      this.graphicsLibrary.clearEventData();
      // Add to scene
      this.loadSceneConfiguration(phoenixScene.sceneConfiguration);

      this.loadingManager.addLoadableItem(`parse_phnx_${name}`);
      return this.graphicsLibrary.parsePhnxScene(phoenixScene.scene);
    }
  }

  /**
   * Exports scene as phoenix format, allowing to load it later and recover the saved configuration.
   */
  public exportPhoenixDisplay() {
    this.graphicsLibrary.exportPhoenixScene();
  }

  /**
   * Parses and loads a geometry in GLTF (.gltf) format.
   * @param input Data of the GLTF (.gltf) file.
   * @param name Name given to the geometry.
   * @returns Promise for loading the geometry.
   */
  public parseGLTFGeometry(input: string | ArrayBuffer, name: string): Promise<unknown> {
    this.loadingManager.addLoadableItem(`parse_gltf_${name}`);
    this.ui.addGeometry(name, undefined);
    this.infoLogger.add(name, 'Parsed GLTF geometry');
    return this.graphicsLibrary.parseGLTFGeometry(input, name);
  }

  /**
   * Loads a GLTF (.gltf) scene/geometry from the given URL.
   * and adds it to the dat.GUI menu.
   * @param url URL to the GLTF (.gltf) file.
   * @param name Name of the loaded scene/geometry.
   * @param menuNodeName Name of the node in Phoenix menu to add the geometry to.
   * @param scale Scale of the geometry.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   * @returns Promise for loading the geometry.
   */
  public loadGLTFGeometry(
    url: any, name: string,
    menuNodeName?: string,
    scale?: number,
    initiallyVisible: boolean = true
  ): Promise<unknown> {
    this.loadingManager.addLoadableItem(`gltf_geom_${name}`);
    this.ui.addGeometry(name, undefined, menuNodeName, initiallyVisible);
    this.infoLogger.add(name, 'Loaded GLTF geometry');
    return this.graphicsLibrary.loadGLTFGeometry(url, name, scale, initiallyVisible);
  }

  /**
   * Loads geometries from JSON.
   * @param json JSON or URL to JSON file of the geometry.
   * @param name Name of the geometry or group of geometries.
   * @param menuNodeName Name of the node in Phoenix menu to add the geometry to.
   * @param scale Scale of the geometry.
   * @param doubleSided Renders both sides of the material.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   * @returns Promise for loading the geometry.
   */
  public loadJSONGeometry(
    json: string | object, name: string,
    menuNodeName?: string,
    scale?: number, doubleSided?: boolean,
    initiallyVisible: boolean = true
  ): Promise<unknown> {
    this.loadingManager.addLoadableItem(`json_geom_${name}`);
    this.ui.addGeometry(name, undefined, menuNodeName, initiallyVisible);
    this.infoLogger.add(name, 'Loaded JSON geometry');
    return this.graphicsLibrary.loadJSONGeometry(json, name, scale, doubleSided, initiallyVisible);
  }

  /**
   * Load JSON geometry from JSRoot.
   * @param JSROOT JSRoot object containing all the JSROOT functions.
   * @param url URL of the JSRoot geometry file.
   * @param name Name of the geometry.
   * @param menuNodeName Name of the node in Phoenix menu to add the geometry to.
   * @param scale Scale of the geometry.
   * @param doubleSided Renders both sides of the material.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   */
  public loadRootJSONGeometry(
    JSROOT: any, url: string,
    name: string, menuNodeName?: string,
    scale?: number, doubleSided?: boolean,
    initiallyVisible: boolean = true
  ) {
    this.loadingManager.addLoadableItem('root_json_geom');
    JSROOT.NewHttpRequest(url, 'object', (obj: any) => {
      this.loadJSONGeometry(JSROOT.GEO.build(obj, { dflt_colors: true }).toJSON(),
        name, menuNodeName, scale, doubleSided, initiallyVisible);
      this.loadingManager.itemLoaded('root_json_geom');
    }).send();
  }

  /**
   * Load ROOT geometry from JSRoot.
   * @param JSROOT JSRoot object containing all the JSROOT functions.
   * @param url URL of the JSRoot file.
   * @param objectName Name of the object inside the ".root" file.
   * @param name Name of the geometry.
   * @param menuNodeName Name of the node in Phoenix menu to add the geometry to.
   * @param scale Scale of the geometry.
   * @param doubleSided Renders both sides of the material.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   */
  public loadRootGeometry(JSROOT: any, url: string, objectName: string,
    name: string, menuNodeName?: string, scale?: number, doubleSided?: boolean,
    initiallyVisible: boolean = true) {
    if (url.indexOf('.root') > 0) {
      JSROOT.OpenFile(url, (file: any) => {
        file.ReadObject(objectName, (obj: any) => {
          this.loadJSONGeometry(JSROOT.GEO.build(obj, { dflt_colors: true }).toJSON(),
            name, menuNodeName, scale, doubleSided, initiallyVisible);
        });
      });
    }
  }

  /**
   * Build Geometry from thr passed parameters, where 
   * @param parameters 
   */
  public buildGeometryFromParameters(parameters: any): void {
    this.graphicsLibrary.addGeometryFromParameters(parameters);
  }

  /**
   * Zoom all the cameras by a specific zoom factor.
   * The factor may either be greater (zoom in) or smaller (zoom out) than 1.
   * @param zoomFactor The factor to zoom by.
   * @param zoomTime The time it takes for a zoom animation to complete.
   */
  public zoomTo(zoomFactor: number, zoomTime: number) {
    this.graphicsLibrary.zoomTo(zoomFactor, zoomTime);
  }



  /**
   * Processes event data and geometry for Loading the scene
   * from Phoenix file format (.phnx).
   * @param sceneConfiguration Scene configuration containingevent data and detector geometry.
   */
  private loadSceneConfiguration(sceneConfiguration: { eventData: {}; geometries: [] }) {
    for (const objectType of Object.keys(sceneConfiguration.eventData)) {
      const typeFolder = this.ui.addEventDataTypeFolder(objectType);
      const typeFolderPM = this.ui.addEventDataTypeFolderPM(objectType);
      const collections = sceneConfiguration.eventData[objectType];
      for (const collection of collections) {
        this.ui.addCollection(typeFolder, collection);
        this.ui.addCollectionPM(typeFolderPM, collection);
      }
    }

    for (const geom of sceneConfiguration.geometries) {
      this.ui.addGeometry(geom, '#ffffff');
    }
  }

  /**
   * Get all the objects inside a collection.
   * @param collectionName Key of the collection that will be retrieved.
   * @returns Object containing all physics objects from the desired collection.
   */
  public getCollection(collectionName: string) {
    return this.configuration.eventDataLoader.getCollection(collectionName);
  }

  /**
   * Get the different collections for the current stored event.
   * @returns List of strings, each representing a collection of the event displayed.
   */
  public getCollections(): string[] {
    return this.configuration.eventDataLoader.getCollections();
  }

  /**
   * Add a callback to onDisplayedEventChange array to call
   * the callback on changes to the displayed event.
   * @param callback Callback to be added to the onDisplayedEventChange array.
   */
  public listenToDisplayedEventChange(callback: (event) => any) {
    this.onDisplayedEventChange.push(callback);
  }

  /**
   * Add a callback to onEventsChange array to call
   * the callback on changes to the events.
   * @param callback Callback to be added to the onEventsChange array.
   */
  public listenToLoadedEventsChange(callback: (events) => any) {
    this.onEventsChange.push(callback);
  }

  /**
   * Get metadata associated to the displayed event (experiment info, time, run, event...).
   * @returns Metadata of the displayed event.
   */
  public getEventMetadata(): any[] {
    return this.configuration.eventDataLoader.getEventMetadata();
  }

  /**
   * Enables calling specified event display methods in console.
   */
  private enableEventDisplayConsole() {
    // Defining an EventDisplay object in window to access methods through console
    window.EventDisplay = {
      loadGLTFGeometry: (sceneUrl: string, name: string) => {
        this.loadGLTFGeometry(sceneUrl, name);
      },
      loadOBJGeometry: (filename: string, name: string, colour: any,
        menuNodeName: string, doubleSided: boolean) => {
        this.loadOBJGeometry(filename, name, colour, menuNodeName, doubleSided);
      },
      loadJSONGeometry: (json: string | object, name: string, menuNodeName: string,
        scale?: number, doubleSided?: boolean, initiallyVisible: boolean = true) => {
        this.loadJSONGeometry(json, name, menuNodeName, scale, doubleSided, initiallyVisible);
      },
      buildGeometryFromParameters: (parameters: object) => this.buildGeometryFromParameters(parameters)
    };
  }

  /**
   * Sets the renderer to be used to render the event display on the overlayed canvas.
   * @param overlayCanvas An HTML canvas on which the overlay renderer is to be set.
   */
  public renderOverlay(overlayCanvas: HTMLCanvasElement) {
    this.graphicsLibrary.setOverlayRenderer(overlayCanvas);
  }

  /**
   * Initializes the object which will show information of the selected geometry/event data.
   * @param selectedObject Object to display the data.
   */
  public allowSelection(selectedObject: { name: string, attributes: any[] }) {
    this.graphicsLibrary.setSelectedObjectDisplay(selectedObject);
  }

  /**
   * Toggles the ability of selecting geometries/event data by clicking on the screen.
   * @param enable Value to enable or disable the functionality.
   */
  public enableSelecting(enable: boolean) {
    this.graphicsLibrary.enableSelecting(enable);
  }

  /**
   * Fixes the camera position of the overlay view.
   * @param fixed Whether the overlay view is to be fixed or not.
   */
  public fixOverlayView(fixed: boolean) {
    this.graphicsLibrary.fixOverlayView(fixed);
  }

  /**
   * Get the uuid of the currently selected object.
   * @returns uuid of the currently selected object.
   */
  public getActiveObjectId(): any {
    return this.graphicsLibrary.getActiveObjectId();
  }

  /**
   * Move the camera to look at the object with the given uuid
   * and highlight it.
   * @param uuid uuid of the object.
   */
  public lookAtObject(uuid: string) {
    this.graphicsLibrary.lookAtObject(uuid);
    this.graphicsLibrary.highlightObject(uuid);
  }

  /**
   * Highlight the object with the given uuid by giving it an outline.
   * @param uuid uuid of the object.
   */
  public highlightObject(uuid: string) {
    this.graphicsLibrary.highlightObject(uuid);
  }

  /**
   * Enable keyboard controls for the event display.
   */
  public enableKeyboardControls() {
    this.ui.enableKeyboardControls();
    this.graphicsLibrary.enableKeyboardControls();
  }

  /**
   * Animate the camera through the event scene.
   * @param startPos Start position of the translation animation.
   * @param tweenDuration Duration of each tween in the translation animation.
   * @param onAnimationEnd Callback when the last animation ends.
   */
  public animateThroughEvent(startPos: number[],
    tweenDuration: number,
    onAnimationEnd?: () => void) {
    this.graphicsLibrary
      .animateThroughEvent(startPos, tweenDuration, onAnimationEnd);
  }

  /**
   * Animate the propagation and generation of event data with particle collison.
   * @param tweenDuration Duration of the animation tween.
   * @param onEnd Function to call when all animations have ended.
   */
  public animateEventWithCollision(tweenDuration: number, onEnd?: () => void) {
    this.graphicsLibrary.animateEventWithCollision(tweenDuration, onEnd);
  }

  /**
   * Animate the propagation and generation of event data
   * using clipping planes after particle collison.
   * @param tweenDuration Duration of the animation tween.
   * @param onEnd Function to call when all animations have ended.
   */
  public animateClippingWithCollision(tweenDuration: number, onEnd?: () => void) {
    this.graphicsLibrary.animateClippingWithCollision(tweenDuration, onEnd);
  }

  /**
   * Initialize the event display with event data and configuration from URL.
   * (Only JiveXML and JSON)
   * @param defaultEventPath Default event path to fallback to if none in URL.
   * @param defaultEventType Default event type to fallback to if none in URL.
   */
  public initEventFromURL(defaultEventPath?: string, defaultEventType?: string) {
    const locationHref = window.location.href;
    const urlParams = new URLSearchParams(locationHref.substr(locationHref.lastIndexOf('?')));

    let file: string, type: string;

    if (!urlParams.get('file') || !urlParams.get('type')) {
      file = defaultEventPath;
      type = defaultEventType;
    } else {
      file = urlParams.get('file');
      type = urlParams.get('type').toLowerCase();
    }

    // Load config from URL
    const loadConfig = () => {
      if (urlParams.get('config') && ('fetch' in window)) {
        this.loadingManager.addLoadableItem('url_config');
        fetch(urlParams.get('config'))
          .then(res => res.json())
          .then(jsonState => {
            const stateManager = new StateManager();
            stateManager.loadStateFromJSON(jsonState);
          }).finally(() => {
            this.loadingManager.itemLoaded('url_config');
          });
      }
    }

    if (file && type && ('fetch' in window)) {
      this.loadingManager.addLoadableItem('url_event');
      fetch(file)
        .then(res => type === 'jivexml' ? res.text() : res.json())
        .then((res: object | string) => {
          if (type === 'jivexml') {
            const loader = new JiveXMLLoader();
            this.configuration.eventDataLoader = loader;
            // Parse the JSON to extract events and their data
            loader.process(res);
            const eventData = loader.getEventData();
            this.buildEventDataFromJSON(eventData);
          } else {
            this.configuration.eventDataLoader = new PhoenixLoader();
            this.parsePhoenixEvents(res);
          }
        }).catch((error) => {
          this.getInfoLogger().add('Could not find the file specified in URL.', 'Error');
          console.error('Could not find the file specified in URL.', error);
        }).finally(() => {
          // Load config from URL after loading the event
          loadConfig();
          this.loadingManager.itemLoaded('url_event');
        });
    } else {
      loadConfig();
    }
  }

  /**
   * Add label to object and save the configuration.
   * @param label Label to add to the event object.
   * @param collection Collection the event object is a part of.
   * @param indexInCollection Event object's index in collection.
   * @param uuid UUID of the three.js object.
   */
  public addLabelToObject(label: string, collection: string, indexInCollection: number, uuid: string) {
    this.configuration.eventDataLoader.addLabelOfEventObject(label, collection, indexInCollection);
    this.graphicsLibrary.addLabelToObject(label, uuid);
  }
}
