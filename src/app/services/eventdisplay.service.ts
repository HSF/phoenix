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

  public loadGeometryFromOBJ(filename: string, name: string, colour, doubleSided: boolean) {
    this.graphicsLibrary.loadOBJFile(filename, name, colour, doubleSided);
    this.ui.addGeometry(name, colour);
  }

  public loadGeometryFromOBJContent(content: string, name: string) {
    this.graphicsLibrary.loadOBJFromContent(content, name);
    this.ui.addGeometry(name, 0x000fff);
  }

  public buildGeometryFromParameters(parameters) {
    this.graphicsLibrary.buildGeometryFromParameters(parameters);
  }

  public buildEventDataFromJSON(eventData: any) {
    this.ui.addEventDataFolder();
    if (eventData.Tracks) {
      this.addEventCollections(eventData.Tracks, this.graphicsLibrary.addTrack, 'Tracks');
    }
    if (eventData.Jets) {
      this.addEventCollections(eventData.Jets, this.graphicsLibrary.addJet, 'Jets');
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
