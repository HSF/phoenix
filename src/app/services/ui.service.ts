import {Injectable} from '@angular/core';
import * as Stats from 'stats-js';
import * as dat from 'dat.gui';
import {ThreeService} from './three.service';
import {Configuration} from './loaders/configuration.model';
import {PresetView} from './extras/preset-view.model';

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
  private viewFolder: any;
  private configuration: Configuration;
  private canvas: HTMLElement;

  constructor(private three: ThreeService) {
  }

  public showUI(configuration: Configuration) {
    // Shows a panel on screen with information about the performance (fps).
    this.showStats();
    // Shows the menu that contains the options to interact with the scene.
    this.showMenu(configuration);
  }

  private showStats() {
    this.stats = Stats();
    this.stats.showPanel(0);
    this.stats.dom.className = 'ui-element';
    this.stats.domElement.style.cssText = 'position: absolute; left: 0px; cursor: pointer; opacity: 0.9; z-index: 10; bottom: 0px;';
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
    this.configuration = configuration;
    this.gui = new dat.GUI();
    this.gui.domElement.id = 'gui';
    this.canvas = document.getElementById('eventDisplay');
    if (this.canvas == null) {
      this.canvas = document.body;
    }
    this.canvas.appendChild(this.gui.domElement);
    this.controlsFolder = this.gui.addFolder('Controls');
    this.geomFolder = null;
    this.eventFolder = null;

    this.addMenu('rotate', 'Auto Rotate?', false, (value) => this.three.autoRotate(value));
    this.addMenu('axis', 'Axis', true, (value) => this.three.setAxis(value));
    this.addMenu('lowRes', 'Low Resolution', false, (value) => this.three.lowerResolution(value));
    this.addMenu('darkBg', 'Dark Background', false, (value) => this.three.darkBackground(value));
    this.addMenu('clipping', 'Enable Clipping', false, (value) => this.three.setClipping(value));

    this.controlsFolder.add(this.three.getXClipPlane(), 'constant', -configuration.xClipPosition, configuration.xClipPosition)
      .name('xClipPosition');
    this.controlsFolder.add(this.three.getYClipPlane(), 'constant', -configuration.yClipPosition, configuration.yClipPosition)
      .name('yClipPosition');
    this.controlsFolder.add(this.three.getZClipPlane(), 'constant', -configuration.zClipPosition, configuration.zClipPosition)
      .name('zClipPosition');

    // View parameters
    this.viewFolder = this.controlsFolder.addFolder('View');
    this.addToggle(this.viewFolder, 'useOrtho', 'Orthographic View', false, (value) => this.three.swapCameras(value));
    this.addButton(this.viewFolder, 'Align X', () => this.three.alignCameraWithAxis("X"));
    this.addButton(this.viewFolder, 'Align Y', () => this.three.alignCameraWithAxis("Y"));
    this.addButton(this.viewFolder, 'Align Z', () => this.three.alignCameraWithAxis("Z"));

    if (configuration.anyPresetView()) {
      this.displayPresetViews(configuration.presetViews);
    }
  }

  private displayPresetViews(presetViews: PresetView[]) {
    const presetViewFolder = this.gui.addFolder('Preset Views');
    const presetIconsUl = document.createElement('div');
    presetIconsUl.className = 'preset-views';
    presetViews.forEach((view) => {
      // For menu
      view.setView = this.three.setCameraPos(view.cameraPos);
      presetViewFolder.add(view, 'setView').name(view.name);
      // For icons
      const viewElement = document.createElement('img');
      viewElement.setAttribute('src', view.getIconURL());
      viewElement.addEventListener('click', this.three.setCameraPos(view.cameraPos));
      presetIconsUl.append(viewElement);
    });
    const element = document.getElementById('optionsPanel');
    if (element) {
      element.appendChild(presetIconsUl);
    } else {
      this.canvas.append(presetIconsUl);
    }
  }

  /**
   * Adds a boolean toggle to the 'Controls' folder.
   * @param fieldName Name of the field that will be changed.
   * @param tag Name that will be shown next to the toggle.
   * @param defaultValue initial value that will be set.
   * @param onChange function that will be executed when the toggle is pressed.
   */
  private addMenu(fieldName: string, tag: string, defaultValue: boolean, onChange: (value: boolean) => any) {
    onChange(defaultValue);
    this.guiParameters[fieldName] = defaultValue;
    const menu = this.controlsFolder.add(this.guiParameters, fieldName).name(tag).listen();
    menu.onChange(onChange);
  }

  /**
   * Adds a boolean toggle to the any level of a GUI.
   * @param guiLevel Name of the folder that you want to apppend to.
   * @param fieldName Name of the field that will be changed.
   * @param tag Name that will be shown next to the toggle.
   * @param defaultValue initial value that will be set.
   * @param onChange function that will be executed when the toggle is pressed.
   * @returns {any} Reference to the created object.
   * @private
   */
  private addToggle(guiLevel: any, fieldName: string, tag: string, defaultValue: boolean, onChange: (value: boolean) => any): any {
    this.guiParameters[fieldName] = defaultValue;
    const menu = guiLevel.add(this.guiParameters, fieldName).name(tag);
    menu.onChange(onChange);
    onChange(defaultValue);

    return menu;
  }

   /**
   * Adds a button to any level of a GUI.
   * @param guiLevel Parent GUI level, where a button wuill be inserted.
   * @param name Name that will be shown on a button.
   * @param onClick Function that will be called once the button is pressed.
   * @returns {any} Reference to the created object.
   * @private
   */
  private addButton(guiLevel: any, name: string, onClick: () => any): any{
    let buttonObject = {};
    buttonObject[name] = onClick;

    let button = guiLevel.add(buttonObject, name);
    return button;
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
    // A new folder for the object is added to the 'Geometry' folder
    this.guiParameters[name] = {show: true, color: colour, x: 0, y: 0, z: 0, remove: this.removeOBJ(name)};
    const objFolder = this.geomFolder.addFolder(name);
    // A color picker is added to the object's folder
    const colorMenu = objFolder.addColor(this.guiParameters[name], 'color').name('Color');
    colorMenu.onChange((value) => this.three.objColor(name, value));
    // A boolean toggle for showing/hiding the object is added to its folder
    const showMenu = objFolder.add(this.guiParameters[name], 'show').name('Show').listen();
    showMenu.onChange((value) => this.three.objectVisibility(name, value));
    // Controls for positioning.
    // const position = this.three.getObjectPosition(name);
    objFolder.add(this.guiParameters[name], 'x', -this.configuration.maxPositionX, this.configuration.maxPositionX)
      .name('X').onChange((value) => this.three.getObjectPosition(name).setX(value));
    objFolder.add(this.guiParameters[name], 'y', -this.configuration.maxPositionY, this.configuration.maxPositionY)
      .name('Y').onChange((value) => this.three.getObjectPosition(name).setY(value));
    objFolder.add(this.guiParameters[name], 'z', -this.configuration.maxPositionZ, this.configuration.maxPositionZ)
      .name('Z').onChange((value) => this.three.getObjectPosition(name).setZ(value));
    // Controls for deleting the obj
    objFolder.add(this.guiParameters[name], 'remove').name('Remove');
  }

  private removeOBJ(name: string) {
    return () => {
      const folder = this.geomFolder.__folders[name];
      if (folder) {
        this.geomFolder.removeFolder(folder);
      }
      this.three.removeObject(name);
    };
  }

  /**
   * Functions for event data toggles.
   */
  public addEventDataFolder() {
    // If there is already an event data folder it is deleted and creates a new one.
    if (this.eventFolder != null) {
      this.gui.removeFolder(this.eventFolder);
    }
    // A new folder for the Event Data is added to the GUI.
    this.eventFolder = this.gui.addFolder('Event Data');
    this.guiParameters.eventData = {show: true};
    // A boolean toggle for showing/hiding the event data is added to the 'Event Data' folder.
    const menu = this.eventFolder.add(this.guiParameters.eventData, 'show').name('Show').listen();
    menu.onChange((value) => this.three.objectVisibility('EventData', value));
  }

  public addEventDataTypeFolder(objectType: string) {
    const typeFolder = this.eventFolder.addFolder(objectType);
    this.guiParameters.eventData[objectType] = true;
    const menu = typeFolder.add(this.guiParameters.eventData, objectType).name('Show').listen();
    menu.onChange((value) => this.three.objectVisibility(objectType, value));
    return typeFolder;
  }

  public addCollection(typeFolder: any, collectionName: string) {
    // A new folder for the collection is added to the 'Event Data' folder
    this.guiParameters[collectionName] = {show: true, color: 0x000000};
    const collFolder = typeFolder.addFolder(collectionName);
    // A boolean toggle for showing/hiding the collection is added to its folder
    const showMenu = collFolder.add(this.guiParameters[collectionName], 'show').name('Show').listen();
    showMenu.onChange((value) => this.three.objectVisibility(collectionName, value));
    // A color picker is added to the collection's folder
    const colorMenu = collFolder.addColor(this.guiParameters[collectionName], 'color').name('Color');
    colorMenu.onChange((value) => this.three.collectionColor(collectionName, value));
  }


}
