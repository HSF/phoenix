import { Injectable } from '@angular/core';
import { ThreeService } from './three.service';
import { InfoLoggerService } from './infologger.service';
import { UIService } from './ui.service';
import { Configuration } from './extras/configuration.model';
import { HttpClient } from '@angular/common/http';
import { Camera } from 'three';

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
 * Service for all event display related functions.
 */
@Injectable({
  providedIn: 'root'
})
export class EventdisplayService {

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

  /**
   * Constructor for the event display service.
   * @param graphicsLibrary ThreeService for all three.js related functions.
   * @param ui UIService for all UI related functions.
   * @param http HttpClient for making http requests.
   * @param infoLogger Service for logging data to the information panel.
   */
  constructor(public graphicsLibrary: ThreeService, private ui: UIService, private http: HttpClient, private infoLogger: InfoLoggerService) {
  }

  /**
   * Initializes the components needed to later represent the geometries.
   * @param configuration used to customize different aspects.
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
  }

  /**
   * Initialize the event display with virtual reality environment and controls.
   * @param configuration Configuration for preset views and event data loader.
   */
  public initVR(configuration: Configuration) {
    this.configuration = configuration;
    this.graphicsLibrary.init(configuration, this.infoLogger);
    // Showing the UI elements
    this.ui.showUI(configuration);
    // Animate loop
    const animate = () => {
      this.graphicsLibrary.updateControls();
      this.ui.updateUI();
      this.graphicsLibrary.render();
    };
    this.graphicsLibrary.setVRButton();
    this.graphicsLibrary.setAnimationLoop(animate);
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
   */
  public loadOBJGeometry(filename: string, name: string, color: any, doubleSided: boolean) {
    this.graphicsLibrary.loadOBJGeometry(filename, name, color, doubleSided);
    this.ui.addGeometry(name, color);
    this.infoLogger.add(name, 'Loaded OBJ geometry');
  }

  /**
   * Parses and loads an OBJ geometry from the given content
   * and adds it to the dat.GUI menu.
   * @param content Content of the OBJ geometry.
   * @param name Name given to the geometry.
   */
  public parseOBJGeometry(content: string, name: string) {
    this.graphicsLibrary.parseOBJGeometry(content, name);
    this.ui.addGeometry(name, 0x000fff);
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
   * Loads a GLTF (.gltf) scene/geometry from the given URL
   * and adds it to the dat.GUI menu.
   * @param url URL to the GLTF (.gltf) file.
   * @param name Name of the loaded scene/geometry.
   */
  public loadGLTFGeometry(url: any, name: string) {
    this.graphicsLibrary.loadGLTFGeometry(url, name);
    this.ui.addGeometry(name, 0xff0000);
    this.infoLogger.add(name, 'Loaded GLTF geometry');
  }

  /**
   * Get the main and overlay cameras.
   * @returns An array containing the main and overlay camera.
   */
  public getAllCameras(): Camera[] {
    return this.graphicsLibrary.getAllCameras();
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

    const eventNumber = sceneConfiguration.eventData['event number']
                        ? sceneConfiguration.eventData['event number']
                        : sceneConfiguration.eventData['eventNumber'];
    const runNumber = sceneConfiguration.eventData['run number']
                        ? sceneConfiguration.eventData['run number']
                        : sceneConfiguration.eventData['runNumber'];
    this.infoLogger.add('Scene with event#' + eventNumber + ' and run#' + runNumber, 'Loaded');
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
  public getEventMetadata(): string[] {
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
      parseOBJGeometry: (content: string, name: string) => {
        this.parseOBJGeometry(content, name);
      },
      loadSceneConfiguration: (displayUrl: any) => {
        this.http
          .get(displayUrl, { responseType: 'text' })
          .subscribe((input: any) => {
            this.loadSceneConfiguration(input);
          });
      },
      parseGLTFGeometry: (gltfUrl: any) => {
        this.http
          .get(gltfUrl, { responseType: 'text' })
          .subscribe((input: any) => {
            this.parseGLTFGeometry(input);
          });
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
}
