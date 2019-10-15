import {Injectable} from '@angular/core';
import {ThreeService} from './three.service';
import {UIService} from './ui.service';
import {Configuration} from './extras/configuration.model';

@Injectable({
  providedIn: 'root'
})
export class EventdisplayService {
  private configuration: Configuration;
  private eventsData: any;
  private frameID: number;

  constructor(public graphicsLibrary: ThreeService, private ui: UIService) {
  }

  /**
   * Initializes the components needed to later represent the geometries.
   * @param configuration used to customize different aspects.
   */
  public init(configuration: Configuration): void {
    this.configuration = configuration;
    this.graphicsLibrary.init(configuration);
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
  }

  public initVR(configuration: Configuration) {
    this.graphicsLibrary.init(configuration);
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
   * Loads an OBJ file and adds it to the scene and to the UI menu.
   * @param filename URL of the OBJ file to load.
   * @param name to display the geometry in the UI.
   */
  public loadGeometryFromOBJ(filename: string, name: string, colour, doubleSided: boolean) {
    this.graphicsLibrary.loadOBJFile(filename, name, colour, doubleSided);
    this.ui.addGeometry(name, colour);
  }

  /**
   * Receives the content of an OBJ file and adds it to the scene and to the UI menu.
   * @param content string representing the OBJ file.
   * @param name to display the geometry in the UI.
   */
  public loadGeometryFromOBJContent(content: string, name: string) {
    this.graphicsLibrary.loadOBJFromContent(content, name);
    this.ui.addGeometry(name, 0x000fff);
  }

  /**
   * Receives an object containing all the eventKeys and saves it.
   * Then it loads by default the first event.
   * @param eventsData array of strings containing the keys of the eventsData object.
   */
  public loadEventsFromJSON(eventsData: any): string[] {
    this.eventsData = eventsData;
    const eventKeys = this.configuration.getEventDataLoader().getEventsList(eventsData);
    this.loadEvent(eventKeys[0]);

    return eventKeys;
  }

  /**
   * Receives a string representing the key of an event and loads
   * the event associated with that key.
   * @param eventKey string that represents the event in the eventsData object.
   */
  public loadEvent(eventKey: any) {
    const event = this.eventsData[eventKey];

    if (event) {
      this.buildEventDataFromJSON(event);
    }
  }

  /**
   * Receives an object containing one event and builds the different collections
   * of physics objects.
   * @param eventData object containing the event data.
   */
  public buildEventDataFromJSON(eventData: any) {
    // Creating UI folder
    this.ui.addEventDataFolder();
    // Clearing existing event data
    this.graphicsLibrary.clearEventData();
    // Build data and add to scene
    this.configuration.getEventDataLoader().buildEventData(eventData, this.graphicsLibrary, this.ui);
  }

  public buildGeometryFromParameters(parameters) {
    this.graphicsLibrary.buildGeometryFromParameters(parameters);
  }


  public allowSelection(selectedObject: any) {
    if (document.getElementById('three-canvas')) {
      document.getElementById('three-canvas').addEventListener('click',
        (event) => this.graphicsLibrary.onDocumentMouseDown.bind(this.graphicsLibrary)(event, selectedObject));
    }
  }

  public exportToOBJ() {
    this.graphicsLibrary.exportSceneToOBJ();
  }

  public saveDisplay() {
    this.graphicsLibrary.exportPhoenixScene();
  }

  public loadGLTF(input: any) {
    const scene = JSON.parse(input);
    this.graphicsLibrary.loadScene(scene);

  }

  public loadGLTFDetector(url: any) {
    this.graphicsLibrary.loadGLTFDetector(url);
  }

  public loadDisplay(input: any) {
    const phoenixScene = JSON.parse(input);

    if (phoenixScene.sceneConfiguration && phoenixScene.scene) {
      // Creating UI folder
      this.ui.addEventDataFolder();
      // Clearing existing event data
      this.graphicsLibrary.clearEventData();
      // Add to scene
      this.loadSceneConfiguration(phoenixScene.sceneConfiguration);
      this.graphicsLibrary.loadScene(phoenixScene.scene);
    }
  }

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

  renderOverlay(overlayPanel: boolean) {
    this.graphicsLibrary.renderOverlay(overlayPanel);
  }

  getCollection(value: string) {
    return this.configuration.getEventDataLoader().getCollection(value);
  }

  getCollections(): string[] {
    return this.configuration.getEventDataLoader().getCollections();
  }

  setDetectorOpacity(detectorOpacity: number) {
    this.graphicsLibrary.setDetectorOpacity(detectorOpacity);
  }
}
