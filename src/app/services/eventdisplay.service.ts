import {Injectable} from '@angular/core';
import {ThreeService} from './three.service';
import {UIService} from './ui.service';

@Injectable({
  providedIn: 'root'
})
export class EventdisplayService {

  constructor(private graphicsLibrary: ThreeService, private ui: UIService) {
  }

  init(): void {
    this.graphicsLibrary.clearCanvas();
    this.graphicsLibrary.init();
    // Showing the UI elements
    this.ui.showUI();
    // Animate loop
    const animate = () => {
      requestAnimationFrame(animate);
      this.graphicsLibrary.updateControls();
      this.ui.updateUI();
      this.graphicsLibrary.render();
    };
    animate();
  }


  loadGeometryFromOBJ(filename: string, name: string, colour) {
    this.graphicsLibrary.loadOBJFile(filename, name, colour);
    this.ui.addGeometry(name);
  }

  clearDisplay() {
    this.graphicsLibrary.clearCanvas();
  }
}
