import {Injectable} from '@angular/core';
import {ThreeService} from './three.service';
import {UIService} from './ui.service';
import {Configuration} from './configuration';

@Injectable({
  providedIn: 'root'
})
export class EventdisplayService {

  private graphicsLibrary: ThreeService;
  private ui: UIService;

  constructor() {
    this.graphicsLibrary = new ThreeService();
    this.ui = new UIService(this.graphicsLibrary);
  }

  public init(configuration: Configuration): void {
    this.clearDisplay();
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

  public clearDisplay() {
    this.graphicsLibrary.clearCanvas();
    this.ui.clearUI();
  }

  public loadGeometryFromOBJ(filename: string, name: string, colour, doubleSided: boolean) {
    this.graphicsLibrary.loadOBJFile(filename, name, colour, doubleSided);
    this.ui.addGeometry(name);
  }

  public buildGeometryFromParameters(parameters) {
    this.graphicsLibrary.buildGeometryFromParameters(parameters);
  }

  public buildEventDataFromJSON(eventData: any) {
    this.ui.addEventDataFolder();
    if (eventData.Tracks) {
      this.addEventCollections(eventData.Tracks, this.graphicsLibrary.addTrack, 'Tracks');
    }
  }

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

}
