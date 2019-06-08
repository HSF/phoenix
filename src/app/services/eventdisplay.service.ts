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

  init(configuration: Configuration): void {
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


  loadGeometryFromOBJ(filename: string, name: string, colour, doubleSided: boolean) {
    this.graphicsLibrary.loadOBJFile(filename, name, colour, doubleSided);
    this.ui.addGeometry(name);
  }

  clearDisplay() {
    this.graphicsLibrary.clearCanvas();
    this.ui.clearUI();
  }


  buildGeometryFromParameters(parameters) {
    this.graphicsLibrary.buildGeometryFromParameters(parameters);
  }
}
