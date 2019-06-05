import {Injectable} from '@angular/core';
import * as Stats from 'stats-js';
import * as dat from 'dat.gui';

@Injectable({
  providedIn: 'root'
})
export class UIService {
  stats;
  gui;
  guiParameters = {rotate: undefined};

  constructor() {
  }

  showUI() {
    this.showStats();
    this.showMenu()
  }

  private showStats() {
    this.stats = Stats();
    this.stats.showPanel(0);
    this.stats.dom.className = 'ui-element';
    this.stats.domElement.style.cssText = 'position: absolute; left: 0px; cursor: pointer; opacity: 0.9; z-index: 10000; bottom: 0px;';
    document.body.appendChild(this.stats.dom);
  }

  updateUI() {
    this.stats.update();
  }

  private showMenu() {
    this.gui = new dat.GUI(  );
    this.gui.domElement.id = 'gui';

    const controlsFolder = this.gui.addFolder('Controls');
    this.guiParameters.rotate = false;
    const autoRotate = controlsFolder.add(this.guiParameters, 'rotate').name('Auto Rotate?').listen();
    autoRotate.onChange((value) => {
      console.log(value);
    });
  }
}
