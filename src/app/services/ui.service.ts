import { Injectable } from '@angular/core';
import * as Stats from 'stats-js';
import * as dat from 'dat.gui';
import { ThreeService } from './three.service';
import { Configuration } from './extras/configuration.model';
import { PresetView } from './extras/preset-view.model';
import { Cut } from './extras/cut.model';
import { SceneManager } from './three/scene-manager';

@Injectable({
  providedIn: 'root'
})
export class UIService {

  private stats;
  private gui;
  private guiParameters = {
    rotate: undefined,
    axis: undefined,
    lowRes: undefined,
    eventData: undefined,
    geometries: undefined
  };
  private geomFolder: any;
  private controlsFolder: any;
  private eventFolder: any;
  private viewFolder: any;
  private configuration: Configuration;
  private canvas: HTMLElement;
  private darkTheme: boolean;

  private maxPositionX = 4000;
  private maxPositionY = 4000;
  private maxPositionZ = 4000;

  constructor(private three: ThreeService) {
  }

  public showUI(configuration: Configuration) {
    // Shows a panel on screen with information about the performance (fps).
    this.showStats();
    // Shows the menu that contains the options to interact with the scene.
    this.showMenu(configuration);
    // Detect UI color scheme
    this.detectColorScheme();
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
    this.geomFolder = null;
    this.eventFolder = null;

  }

  public clearUI() {
    const gui = document.getElementById('gui');
    if (gui != null) {
      gui.remove();
    }
    this.geomFolder = null;
  }

  public addGeomFolder() {
    if (this.geomFolder == null) {
      this.geomFolder = this.gui.addFolder(SceneManager.GEOMETRIES_ID);
    }
    this.guiParameters.geometries = { show: true, closeClippedGeometries: false };
    // A boolean toggle for showing/hiding the geometries is added to the 'Geometry' folder.
    const showGeometriesMenu = this.geomFolder.add(this.guiParameters.geometries, 'show').name('Show').listen();
    showGeometriesMenu.onChange((value) => {
      this.three.getSceneManager().objectVisibility(SceneManager.GEOMETRIES_ID, value);
    });
    // A boolean toggle for closing sections created by clipping.
    const closeClippedGeometriesMenu = this.geomFolder.add(this.guiParameters.geometries, 'closeClippedGeometries').name('Close Clipped').listen();
    closeClippedGeometriesMenu.onChange((value) => {
      this.three.getSceneManager().closeClippedGeometries(value);
    });
  }

  public addGeometry(name: string, colour) {
    if (this.geomFolder == null) {
      this.addGeomFolder();
    }
    // A new folder for the object is added to the 'Geometry' folder
    this.guiParameters[name] = {
      show: true, color: colour, x: 0, y: 0, z: 0, detectorOpacity: 1.0, remove: this.removeOBJ(name), scale: 1
    };
    const objFolder = this.geomFolder.addFolder(name);
    // A color picker is added to the object's folder
    const colorMenu = objFolder.addColor(this.guiParameters[name], 'color').name('Color');
    colorMenu.onChange((value) => this.three.getSceneManager().OBJGeometryColor(name, value));

    const opacity = objFolder.add(this.guiParameters[name], 'detectorOpacity', 0.0, 1.0).name('Opacity');
    opacity.onFinishChange((newValue) => this.three.getSceneManager().setGeometryOpacity(name, newValue));


    // A boolean toggle for showing/hiding the object is added to its folder
    const showMenu = objFolder.add(this.guiParameters[name], 'show').name('Show').listen();
    showMenu.onChange((value) => this.three.getSceneManager().objectVisibility(name, value));
    // Scale slider
    const scaleMenu = objFolder.add(this.guiParameters[name], 'scale', 0, 1000).name('Scale');
    scaleMenu.onChange((value) => {
      this.three.getSceneManager().scaleObject(name, value);
    });
    // Controls for positioning.
    // const position = this.three.getObjectPosition(name);
    objFolder.add(this.guiParameters[name], 'x', -this.maxPositionX, this.maxPositionX)
      .name('X').onChange((value) => this.three.getSceneManager().getObjectPosition(name).setX(value));
    objFolder.add(this.guiParameters[name], 'y', -this.maxPositionY, this.maxPositionY)
      .name('Y').onChange((value) => this.three.getSceneManager().getObjectPosition(name).setY(value));
    objFolder.add(this.guiParameters[name], 'z', -this.maxPositionZ, this.maxPositionZ)
      .name('Z').onChange((value) => this.three.getSceneManager().getObjectPosition(name).setZ(value));
    // Controls for deleting the obj
    objFolder.add(this.guiParameters[name], 'remove').name('Remove');
  }

  private removeOBJ(name: string) {
    return () => {
      const folder = this.geomFolder.__folders[name];
      if (folder) {
        this.geomFolder.removeFolder(folder);
      }
      this.three.getSceneManager().removeGeometry(name);
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
    this.guiParameters.eventData = { show: true, depthTest: true };
    // A boolean toggle for showing/hiding the event data is added to the 'Event Data' folder.
    const menu = this.eventFolder.add(this.guiParameters.eventData, 'show').name('Show').listen();
    menu.onChange((value) => this.three.getSceneManager().objectVisibility('EventData', value));
    // A boolean toggle for enabling/disabling depthTest of event data.
    const depthTestMenu = this.eventFolder.add(this.guiParameters.eventData, 'depthTest').name('Depth Test').listen();
    depthTestMenu.onChange((value) => this.three.eventDataDepthTest(value));
  }

  public getEventDataFolder() {
    return this.eventFolder;
  }

  public addEventDataTypeFolder(objectType: string) {
    const typeFolder = this.eventFolder.addFolder(objectType);
    this.guiParameters.eventData[objectType] = true;
    const menu = typeFolder.add(this.guiParameters.eventData, objectType).name('Show').listen();
    menu.onChange((value) => this.three.getSceneManager().objectVisibility(objectType, value));
    return typeFolder;
  }

  public addCollection(typeFolder: any, collectionName: string, cuts?: Cut[]) {
    // A new folder for the collection is added to the 'Event Data' folder
    this.guiParameters[collectionName] = {
      show: true, color: 0x000000,
      resetCut: () => this.three.getSceneManager().groupVisibility(collectionName, true)
    };
    const collFolder = typeFolder.addFolder(collectionName);
    // A boolean toggle for showing/hiding the collection is added to its folder
    const showMenu = collFolder.add(this.guiParameters[collectionName], 'show').name('Show').listen();
    showMenu.onChange((value) => this.three.getSceneManager().objectVisibility(collectionName, value));
    // A color picker is added to the collection's folder
    const colorMenu = collFolder.addColor(this.guiParameters[collectionName], 'color').name('Color');
    colorMenu.onChange((value) => this.three.getSceneManager().collectionColor(collectionName, value));
    // Cuts menu
    if (cuts) {
      const cutsFolder = collFolder.addFolder('Cuts');
      cutsFolder.add(this.guiParameters[collectionName], 'resetCut').name('Reset cuts');
      for (const cut of cuts) {
        const minCut = cutsFolder.add(cut, 'minValue', cut.minValue, cut.maxValue).name('min ' + cut.field);
        minCut.onChange((value) => {
          this.three.getSceneManager().collectionFilter(collectionName, cut);
        });
        const maxCut = cutsFolder.add(cut, 'maxValue', cut.minValue, cut.maxValue).name('max ' + cut.field);
        maxCut.onChange((value) => {
          this.three.getSceneManager().collectionFilter(collectionName, cut);
        });
      }
    }
  }

  public rotateClipping(angle: number) {
    this.three.rotateClipping(angle);
  }

  public setClipping(value: boolean) {
    this.three.setClipping(value);
  }

  public detectColorScheme() {
    let dark = false;    // default to light

    // local storage is used to override OS theme settings
    if (localStorage.getItem('theme')) {
      if (localStorage.getItem('theme') === 'dark') {
        dark = true;
      }
    } else if (!window.matchMedia) {
      // matchMedia method not supported
    } else if (matchMedia('(prefers-color-scheme: dark)').matches) {
      // OS theme setting detected as dark
      dark = true;
    }

    this.darkTheme = dark;
    // dark theme preferred, set document with a `data-theme` attribute
    this.setDarkTheme(dark);
  }

  public setDarkTheme(dark: boolean) {
    if (dark) {
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    this.three.getSceneManager().darkBackground(dark);
  }

  public getDarkTheme() {
    return this.darkTheme;
  }

  public setAutoRotate(rotate: boolean) {
    this.three.autoRotate(rotate);
  }

  public getPresetViews(): PresetView[] {
    if (this.configuration) {
      return this.configuration.presetViews;
    }
  }

  public displayView(view: PresetView) {
    this.three.animateCameraTransform(view.cameraPos, [0, 0, 0], 1000);
  }

  public toggleOrthographicView(orthographic: boolean) {
    this.three.swapCameras(orthographic);
  }

  public setOverlayRenderer(overlayCanvas: HTMLCanvasElement) {
    this.three.setOverlayRenderer(overlayCanvas);
  }

}
