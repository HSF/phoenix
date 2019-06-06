import {Injectable} from '@angular/core';
import * as Stats from 'stats-js';
import * as dat from 'dat.gui';
import {ThreeService} from './three.service';
import {Configuration} from './configuration';

@Injectable({
  providedIn: 'root'
})
export class UIService {
  stats;
  gui;
  guiParameters = {rotate: undefined, axis: undefined, xClipPosition: undefined, yClipPosition: undefined, zClipPosition: undefined};
  private geomFolder: any;
  private controlsFolder: any;

  constructor(private three: ThreeService) {
  }

  showUI(configuration: Configuration) {
    this.showStats();
    this.showMenu(configuration);
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

  private showMenu(configuration: Configuration) {
    this.gui = new dat.GUI();
    this.gui.domElement.id = 'gui';
    this.controlsFolder = this.gui.addFolder('Controls');

    this.addMenu('rotate', 'Atuto Rotate?', false, (value) => this.three.autoRotate(value));
    this.addMenu('axis', 'Axis', true, (value) => this.three.setAxis(value));
    this.addMenu('clipping', 'Enable Clipping', false, (value) => this.three.setClipping(value));

    this.controlsFolder.add(this.three.getXClipPlane(), 'constant', -configuration.xClipPosition, configuration.xClipPosition)
      .name('xClipPosition');
    this.controlsFolder.add(this.three.getYClipPlane(), 'constant', -configuration.yClipPosition, configuration.yClipPosition)
      .name('yClipPosition');
    this.controlsFolder.add(this.three.getZClipPlane(), 'constant', -configuration.zClipPosition, configuration.zClipPosition)
      .name('zClipPosition');
  }

  private addMenu(fieldName: string, tag: string, defaultValue: boolean, onChange: (value: boolean) => any) {
    onChange(defaultValue);
    this.guiParameters[fieldName] = defaultValue;
    const menu = this.controlsFolder.add(this.guiParameters, fieldName).name(tag).listen();
    menu.onChange(onChange);
  }

  addGeometry(name: string) {
    if (this.geomFolder == null) {
      this.geomFolder = this.gui.addFolder('Geometry');
    }
    this.guiParameters[name] = true;
    const menu = this.geomFolder.add(this.guiParameters, name).name(name).listen();
    menu.onChange((value) => {
      this.three.objectVisibility(name, value);
    });
  }
}
