import {Injectable} from '@angular/core';
import * as Stats from 'stats-js';
import * as dat from 'dat.gui';
import {ThreeService} from './three.service';
import {Configuration} from './configuration';

@Injectable({
  providedIn: 'root'
})
export class UIService {
  private stats;
  private gui;
  private guiParameters = {
    rotate: undefined,
    axis: undefined,
    xClipPosition: undefined,
    yClipPosition: undefined,
    zClipPosition: undefined,
    lowRes: undefined,
    eventData: undefined
  };
  private geomFolder: any;
  private controlsFolder: any;
  private eventFolder: any;
  private domDisplay;

  constructor(private three: ThreeService) {
  }

  public showUI(configuration: Configuration) {
    this.showStats();
    this.showMenu(configuration);
  }

  private showStats() {
    this.stats = Stats();
    this.stats.showPanel(0);
    this.stats.dom.className = 'ui-element';
    this.stats.domElement.style.cssText = 'position: absolute; left: 0px; cursor: pointer; opacity: 0.9; z-index: 10000; bottom: 0px;';
    let canvas = document.getElementById('eventDisplay');
    if (canvas == null) {
      canvas = document.body;
    }
    canvas.appendChild(this.stats.dom);
  }

  public updateUI() {
    this.stats.update();
  }

  private showMenu(configuration: Configuration) {
    this.gui = new dat.GUI();
    this.gui.domElement.id = 'gui';
    let canvas = document.getElementById('eventDisplay');
    if (canvas == null) {
      canvas = document.body;
    }
    canvas.appendChild(this.gui.domElement);
    this.controlsFolder = this.gui.addFolder('Controls');
    this.geomFolder = null;
    this.eventFolder = null;

    this.addMenu('rotate', 'Auto Rotate?', false, (value) => this.three.autoRotate(value));
    this.addMenu('axis', 'Axis', true, (value) => this.three.setAxis(value));
    this.addMenu('clipping', 'Enable Clipping', false, (value) => this.three.setClipping(value));
    this.addMenu('lowRes', 'Low Resolution', false, (value) => this.three.lowerResolution(value));

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

  public clearUI() {
    const gui = document.getElementById('gui');
    if (gui != null) {
      gui.remove();
    }
    this.geomFolder = null;
  }

  public addGeometry(name: string, colour) {
    if (this.geomFolder == null) {
      this.geomFolder = this.gui.addFolder('Geometry');
    }
    this.guiParameters[name] = {show: true, color: colour};
    const objFolder = this.geomFolder.addFolder(name);
    const colorMenu = objFolder.addColor(this.guiParameters[name], 'color').name('Color');
    colorMenu.onChange((value) => this.three.objectColor(name, value));
    const showMenu = objFolder.add(this.guiParameters[name], 'show').name('Show').listen();
    showMenu.onChange((value) => {
      this.three.objectVisibility(name, value);
    });
  }

  public addEventDataFolder() {
    if (this.eventFolder == null) {
      this.eventFolder = this.gui.addFolder('Event Data');
    }
    this.guiParameters.eventData = true;
    const menu = this.eventFolder.add(this.guiParameters, 'eventData').name('Show').listen();
    menu.onChange((value) => {
      this.three.objectVisibility('Event Data', value);
    });
  }

  public addEventDataTypeFolder(objectType: string) {
    return this.eventFolder.addFolder(objectType);
  }

  public addCollection(typeFolder: any, collectionName: string) {
    this.guiParameters[collectionName] = true;
    const menu = typeFolder.add(this.guiParameters, collectionName).name(collectionName).listen();
    menu.onChange((value) => {
      this.three.collectionVisibility(collectionName, value);
    });
  }
}
