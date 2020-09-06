import { ThreeManager } from './three';
import { UIManager } from './ui-manager';
import { InfoLogger } from './info-logger';
import { Configuration } from './extras/configuration.model';

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
export default class EventDisplay {
  /** Configuration for preset views and event data loader. */
  private configuration: Configuration;
  /** An object containing event data. */
  private eventsData: any;
  /** Frame ID of the current animation frame. */
  private frameID: number;
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

  /**
   * Constructor for the phoenix event display.
   */
  constructor() {
    this.graphicsLibrary = new ThreeManager();
    this.infoLogger = new InfoLogger();
    this.ui = new UIManager(this.graphicsLibrary);
  }

  /**
   * Initializes the components needed to later represent the geometries.
   * @param configuration Configuration used to customize different aspects.
   */
  public init(configuration: Configuration) {
    this.configuration = configuration;
    this.graphicsLibrary.init(configuration, this.infoLogger);
    // Showing the UI elements
    this.ui.showUI(configuration);
    if (this.frameID) {
      cancelAnimationFrame(this.frameID);
    }
    // Animate loop
    const animate = () => {
      this.frameID = requestAnimationFrame(animate);
      this.graphicsLibrary.updateControls();
      this.ui.updateUI();
      this.graphicsLibrary.render();
    };
    animate();

    // Allow adding elements through console
    this.enableEventDisplayConsole();
    // Allow keyboard controls
    this.enableKeyboardControls();
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
    const eventKeys = this.configuration.getEventDataLoader().getEventsList(eventsData);
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
    this.configuration.getEventDataLoader().buildEventData(eventData, this.graphicsLibrary, this.ui, this.infoLogger);
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

  // **********************
  // * LOADING GEOMETRIES *
  // **********************

  /**
   * Loads an OBJ (.obj) geometry from the given filename
   * and adds it to the dat.GUI menu.
   * @param filename Path to the geometry.
   * @param name Name given to the geometry.
   * @param color Color to initialize the geometry.
   * @param doubleSided Renders both sides of the material.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   */
  public loadOBJGeometry(filename: string, name: string, color: any,
    doubleSided?: boolean, initiallyVisible: boolean = true) {
    this.graphicsLibrary.loadOBJGeometry(filename, name, color, doubleSided, initiallyVisible);
    this.ui.addGeometry(name, color, initiallyVisible);
    this.infoLogger.add(name, 'Loaded OBJ geometry');
  }

  /**
   * Parses and loads an OBJ geometry from the given content
   * and adds it to the dat.GUI menu.
   * @param content Content of the OBJ geometry.
   * @param name Name given to the geometry.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   */
  public parseOBJGeometry(content: string, name: string, initiallyVisible: boolean = true) {
    this.graphicsLibrary.parseOBJGeometry(content, name, initiallyVisible);
    this.ui.addGeometry(name, 0x000fff, initiallyVisible);
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
   */
  public parsePhoenixDisplay(input: any) {
    const phoenixScene = JSON.parse(input);

    if (phoenixScene.sceneConfiguration && phoenixScene.scene) {
      // Creating UI folder
      this.ui.addEventDataFolder();
      // Clearing existing event data
      this.graphicsLibrary.clearEventData();
      // Add to scene
      this.loadSceneConfiguration(phoenixScene.sceneConfiguration);
      this.graphicsLibrary.parseGLTFGeometry(phoenixScene.scene);
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
   * @param input JSON containing the scene as in GLTF (.gltf) format.
   */
  public parseGLTFGeometry(input: any) {
    const scene = JSON.parse(input);
    this.graphicsLibrary.parseGLTFGeometry(scene);
  }

  /**
   * Loads a GLTF (.gltf) scene/geometry from the given URL.
   * and adds it to the dat.GUI menu.
   * @param url URL to the GLTF (.gltf) file.
   * @param name Name of the loaded scene/geometry.
   * @param scale Scale of the geometry.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   */
  public loadGLTFGeometry(url: any, name: string,
    scale?: number, initiallyVisible: boolean = true) {
    this.graphicsLibrary.loadGLTFGeometry(url, name, scale, initiallyVisible);
    this.ui.addGeometry(name, 0xff0000, initiallyVisible);
    this.infoLogger.add(name, 'Loaded GLTF geometry');
  }

  /**
   * Loads geometries from JSON.
   * @param json JSON or URL to JSON file of the geometry.
   * @param name Name of the geometry or group of geometries.
   * @param scale Scale of the geometry.
   * @param doubleSided Renders both sides of the material.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   */
  public loadJSONGeometry(json: string | object, name: string,
    scale?: number, doubleSided?: boolean, initiallyVisible: boolean = true) {
    this.graphicsLibrary.loadJSONGeometry(json, name, scale, doubleSided, initiallyVisible);
    this.ui.addGeometry(name, 0xff0000, initiallyVisible);
    this.infoLogger.add(name, 'Loaded JSON geometry');
  }

  /**
   * Load JSON geometry from JSRoot.
   * @param JSROOT JSRoot object containing all the JSROOT functions.
   * @param url URL of the JSRoot geometry file.
   * @param name Name of the geometry.
   * @param scale Scale of the geometry.
   * @param doubleSided Renders both sides of the material.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   */
  public loadRootJSONGeometry(JSROOT: any, url: string, name: string,
    scale?: number, doubleSided?: boolean, initiallyVisible: boolean = true) {
    JSROOT.NewHttpRequest(url, 'object', (obj: any) => {
      this.loadJSONGeometry(JSROOT.GEO.build(obj, { dflt_colors: true }).toJSON(),
        name, scale, doubleSided, initiallyVisible);
    }).send();
  }

  /**
   * Load ROOT geometry from JSRoot.
   * @param JSROOT JSRoot object containing all the JSROOT functions.
   * @param url URL of the JSRoot file.
   * @param objectName Name of the object inside the ".root" file.
   * @param name Name of the geometry.
   * @param scale Scale of the geometry.
   * @param doubleSided Renders both sides of the material.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   */
  public loadRootGeometry(JSROOT: any, url: string, objectName: string,
    name: string, scale?: number, doubleSided?: boolean, initiallyVisible: boolean = true) {
    if (url.indexOf('.root') > 0) {
      JSROOT.OpenFile(url, (file: any) => {
        file.ReadObject(objectName, (obj: any) => {
          this.loadJSONGeometry(JSROOT.GEO.build(obj, { dflt_colors: true }).toJSON(),
            name, scale, doubleSided, initiallyVisible);
        });
      });
    }
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
      const collections = sceneConfiguration.eventData[objectType];
      for (const collection of collections) {
        this.ui.addCollection(typeFolder, collection);
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
    return this.configuration.getEventDataLoader().getCollection(collectionName);
  }

  /**
   * Get the different collections for the current stored event.
   * @returns List of strings, each representing a collection of the event displayed.
   */
  public getCollections(): string[] {
    return this.configuration.getEventDataLoader().getCollections();
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
    return this.configuration.getEventDataLoader().getEventMetadata();
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
      loadOBJGeometry: (filename: string, name: string, colour: any, doubleSided: boolean) => {
        this.loadOBJGeometry(filename, name, colour, doubleSided);
      },
      loadJSONGeometry: (json: string | object, name: string,
        scale?: number, doubleSided?: boolean, initiallyVisible: boolean = true) => {
        this.loadJSONGeometry(json, name, scale, doubleSided, initiallyVisible);
      }
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
}
