import {Injectable} from '@angular/core';
import {ThreeService} from './three.service';
import {UIService} from './ui.service';
import {Configuration} from './configuration';

@Injectable({
  providedIn: 'root'
})
export class EventdisplayService {

  constructor(private graphicsLibrary: ThreeService, private ui: UIService) {
  }

  /**
   * Initializes the components needed to later represent the geometries.
   * @param configuration used to customize different aspects.
   */
  public init(configuration: Configuration): void {
    this.graphicsLibrary.init(configuration);
    // Showing the UI elements
    this.ui.showUI(configuration);
    // Animate loop
    const animate = () => {
      requestAnimationFrame(animate);
      this.graphicsLibrary.updateControls();
      this.ui.updateUI();
      this.graphicsLibrary.render();
    };
    animate();
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
   * Receives an object containing the event data and builds the different collections
   * of physics objects.
   * @param eventData object containing the event data.
   */
  public buildEventDataFromJSON(eventData: any) {
    this.ui.addEventDataFolder();
    if (eventData.Tracks) {
      this.addEventCollections(eventData.Tracks, this.graphicsLibrary.addTrack, 'Tracks');
    }
    if (eventData.Jets) {
      this.addEventCollections(eventData.Jets, this.graphicsLibrary.addJet, 'Jets');
    }
  }

  /**
   * Adds all the collections of a given object type.
   * @param addObject function that will handle building every object from the parameters.
   */
  private addEventCollections(collections: any, addObject: any, objectType: string) {
    const typeFolder = this.ui.addEventDataTypeFolder(objectType);
    for (const collname of Object.keys(collections)) {
      const collection = collections[collname];
      if (collection != null) {
        this.graphicsLibrary.addCollection(collection, collname, addObject);
        this.ui.addCollection(typeFolder, collname);
      }
    }
  }

  public buildGeometryFromParameters(parameters) {
    this.graphicsLibrary.buildGeometryFromParameters(parameters);
  }

}
