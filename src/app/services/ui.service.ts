import { Injectable } from '@angular/core';
import * as Stats from 'stats-js';
import * as dat from 'dat.gui';
import { ThreeService } from './three.service';
import { Configuration } from './extras/configuration.model';
import { PresetView } from './extras/preset-view.model';
import { Cut } from './extras/cut.model';
import { SceneManager } from './three/scene-manager';
import { ExperimentControlNode } from '../components/experiment-controls/experiment-control-node/experiment-control-node';

/**
 * Service for UI related operations including the dat.GUI menu, stats-js and theme settings.
 */
@Injectable({
  providedIn: 'root'
})
export class UIService {

  /** Stats object from stats-js. */
  private stats: any;
  /** dat.GUI menu. */
  private gui: any;
  /** Options for the dat.GUI menu. */
  private guiParameters = {
    rotate: undefined,
    axis: undefined,
    lowRes: undefined,
    eventData: undefined,
    geometries: undefined
  };
  /** dat.GUI menu folder containing geometries data. */
  private geomFolder: any;
  /** dat.GUI menu folder containing event related data. */
  private eventFolder: any;
  /** Experiment controls node containing geometries data */
  private geomFolderEC: ExperimentControlNode;
  /** Experiment controls node containing event related data */
  private eventFolderEC: ExperimentControlNode;
  /** Configuration options for preset views and event data loader. */
  private configuration: Configuration;
  /** Canvas in which event display is rendered. */
  private canvas: HTMLElement;
  /** If dark theme is enabled or disabled. */
  private darkTheme: boolean;

  /** Max changeable position of an object along the x-axis. */
  private maxPositionX = 4000;
  /** Max changeable position of an object along the y-axis. */
  private maxPositionY = 4000;
  /** Max changeable position of an object along the z-axis. */
  private maxPositionZ = 4000;
  /** Root node of the experiment controls. */
  private experimentControls: ExperimentControlNode;

  /**
   * Constructor for the UI service.
   * @param three Three service to perform three.js related operations.
   */
  constructor(private three: ThreeService) {
  }

  /**
   * Show/load the UI including stats, the dat.GUI menu and theme.
   * @param configuration Configuration options for preset views and event data loader.
   */
  public showUI(configuration: Configuration) {
    // Shows a panel on screen with information about the performance (fps).
    this.showStats();
    // Shows the menu that contains the options to interact with the scene.
    this.showMenu(configuration);
    // Detect UI color scheme
    this.detectColorScheme();
    // Set root node of experiment controls
    this.setExperimentControls(configuration.experimentControlsRoot);
  }

  /**
   * Show stats including FPS, milliseconds to render a frame, allocated memory etc.
   */
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

  /**
   * Update the UI by updating stats for each frame.
   */
  public updateUI() {
    this.stats.update();
  }

  /**
   * Show dat.GUI menu with different controls related to detector geometry and event data.
   * @param configuration Configuration options for the menu.
   */
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

  /**
   * Clear the UI by removing the dat.GUI menu.
   */
  public clearUI() {
    const gui = document.getElementById('gui');
    if (gui != null) {
      gui.remove();
    }
    this.geomFolder = null;
  }

  /**
   * Add geometry (detector geometry) folder to the dat.GUI menu.
   */
  public addGeomFolder() {
    if (this.geomFolder == null) {
      this.geomFolder = this.gui.addFolder(SceneManager.GEOMETRIES_ID);
      if (this.experimentControls) {
        // Experiment controls
        this.geomFolderEC = this.experimentControls.addChild('Detector', (value: boolean) => {
          this.three.getSceneManager().objectVisibilityChildren(SceneManager.GEOMETRIES_ID, value);
        });
      }
    }
    this.guiParameters.geometries = { show: true, wireframe: false };
    // A boolean toggle for showing/hiding the geometries is added to the 'Geometry' folder.
    const showGeometriesMenu = this.geomFolder.add(this.guiParameters.geometries, 'show').name('Show').listen();
    showGeometriesMenu.onChange((value) => {
      this.three.getSceneManager().objectVisibility(SceneManager.GEOMETRIES_ID, value);
    });
    // A boolean toggle for enabling/disabling the geometries' wireframing.
    const wireframeGeometriesMenu = this.geomFolder.add(this.guiParameters.geometries, 'wireframe').name('Wireframe').listen();
    wireframeGeometriesMenu.onChange((value) => {
      this.three.getSceneManager().wireframeGeometries(value);
    });

    if (this.experimentControls) {
      // Experiment controls
      this.geomFolderEC.addConfig('slider', {
        label: 'Opacity',
        min: 0, max: 1, step: 0.01,
        onChange: (value: number) => {
          this.three.getSceneManager().setGeometryOpacity(SceneManager.GEOMETRIES_ID, value);
        }
      }).addConfig('checkbox', {
        label: 'Wireframe',
        isChecked: false,
        onChange: (value: boolean) => {
          this.three.getSceneManager().wireframeGeometries(value);
        }
      });
    }
  }

  /**
   * Sets the visibility of a geometry in the scene.
   * @param name Name of the geometry in the scene
   * @param visible Value for the visibility of the object
   */
  public geometryVisibility(name: string, visible: boolean) {
    this.three.getSceneManager().objectVisibility(name, visible);
  }

  /**
   * Adds geometry to the dat.GUI menu's geometry folder and sets up its configurable options.
   * @param name Name of the geometry.
   * @param colour Color of the geometry.
   */
  public addGeometry(name: string, colour: any) {
    if (this.geomFolder == null || this.geomFolderEC == null) {
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

    if (this.experimentControls) {
      // Experiment controls
      const objFolderEC = this.geomFolderEC.addChild(name, (value: boolean) => {
        this.three.getSceneManager().objectVisibility(name, value);
      });
      objFolderEC.addConfig('slider', {
        label: 'Opacity',
        min: 0, max: 1, step: 0.05,
        onChange: (opacity: number) => {
          this.three.getSceneManager().setGeometryOpacity(name, opacity);
        }
      }).addConfig('slider', {
        label: 'Scale',
        min: 0, max: 1000,
        allowCustomValue: true,
        onChange: (scale: number) => {
          this.three.getSceneManager().scaleObject(name, scale);
        }
      });
    }
  }

  /**
   * Remove object from the dat.GUI menu.
   * @param name Name of the object to be removed.
   */
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
   * Functions for event data toggles like show/hide and depthTest.
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

    if (this.experimentControls) {
      // Experiment controls
      if (this.eventFolderEC) {
        this.eventFolderEC.remove();
      }
      this.eventFolderEC = this.experimentControls.addChild('Event Data', (value: boolean) => {
        this.three.getSceneManager().objectVisibility('EventData', value);
      });
      this.eventFolderEC.addConfig('checkbox', {
        label: 'Depth Test',
        isChecked: true,
        onChange: (value: boolean) => {
          this.three.eventDataDepthTest(value);
        }
      });
    }
  }

  /**
   * Get the event data folder in dat.GUI menu.
   * @returns Event data folder.
   */
  public getEventDataFolder(): any {
    return this.eventFolder;
  }

  /**
   * Add folder for event data type like tracks or hits to the dat.GUI menu.
   * @param typeName Name of the type of event data.
   * @param extendEventDataTypeUI A callback to add more options to event data type UI folder.
   * @returns dat.GUI menu's folder for event data type.
   */
  public addEventDataTypeFolder(typeName: string,
    extendEventDataTypeUI?: (typeFolder: any) => void): any {
    const typeFolder = this.eventFolder.addFolder(typeName);
    this.guiParameters.eventData[typeName] = true;
    const menu = typeFolder.add(this.guiParameters.eventData, typeName).name('Show').listen();
    menu.onChange((value) => this.three.getSceneManager().objectVisibility(typeName, value));

    extendEventDataTypeUI?.(typeFolder);

    return typeFolder;
  }

  /**
   * Add child for event data type like tracks or hits to the experiment controls.
   * @param typeName Name of the type of event data.
   * @param extendEventDataTypeUI A callback to add more options to event data type UI folder.
   * @returns Experiment control node for event data type.
   */
  public addEventDataTypeFolderEC(typeName: string,
    extendEventDataTypeUI?: (typeFolder: any, typeFolderEC: ExperimentControlNode) => void): ExperimentControlNode {
      // Experiment controls
      if (this.experimentControls) {
        const typeFolderEC = this.eventFolderEC.addChild(typeName, (value: boolean) => {
          this.three.getSceneManager().objectVisibility(typeName, value);
        });
        
        extendEventDataTypeUI?.(undefined, typeFolderEC);

        return typeFolderEC;
      }

    return undefined;
  }

  /**
   * Add collection folder and its configurable options to the event data type (tracks, hits etc.) folder.
   * @param typeFolder dat.GUI menu folder of an event data type.
   * @param collectionName Name of the collection to be added in the type of event data (tracks, hits etc.).
   * @param cuts Cuts to the collection of event data that are to be made configurable to filter event data.
   */
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

  /**
   * Add collection node and its configurable options to the event data type (tracks, hits etc.) node.
   * @param typeFolder Experiment control node of an event data type.
   * @param collectionName Name of the collection to be added in the type of event data (tracks, hits etc.).
   * @param cuts Cuts to the collection of event data that are to be made configurable to filter event data.
   */
  public addCollectionEC(typeFolderEC: ExperimentControlNode, collectionName: string, cuts?: Cut[]) {
    // Experiment controls
    if (this.experimentControls) {
      const collectionNode = typeFolderEC.addChild(collectionName, (value: boolean) => {
        this.three.getSceneManager().objectVisibility(collectionName, value);
      });
  
      if (cuts) {
        collectionNode.addConfig('label', {
          label: 'Cuts'
        }).addConfig('button', {
          label: 'Reset cuts',
          onClick: () => {
            this.three.getSceneManager().groupVisibility(collectionName, true);
          }
        });
        for (const cut of cuts) {
          collectionNode.addConfig('slider', {
            label: 'Min ' + cut.field,
            min: cut.minValue, max: cut.maxValue,
            allowCustomValue: true,
            onChange: (value: number) => {
              cut.minValue = value;
              this.three.getSceneManager().collectionFilter(collectionName, cut);
            }
          }).addConfig('slider', {
            label: 'Max ' + cut.field,
            min: cut.minValue, max: cut.maxValue,
            allowCustomValue: true,
            onChange: (value: number) => {
              cut.maxValue = value;
              this.three.getSceneManager().collectionFilter(collectionName, cut);
            }
          });
        }
      }
    }
  }

  /**
   * Rotate the clipping on detector geometry.
   * @param angle Angle of rotation of the clipping.
   */
  public rotateClipping(angle: number) {
    this.three.rotateClipping(angle);
  }

  /**
   * Set if the detector geometry is to be clipped or not.
   * @param value Set clipping to be true or false.
   */
  public setClipping(value: boolean) {
    this.three.setClipping(value);
  }

  /**
   * Detect the current theme and set it.
   */
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

  /**
   * Set if the theme is to be dark or light.
   * @param dark If the theme is to be dark or light. True for dark and false for light theme.
   */
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

  /**
   * Get if the theme is dark or not.
   * @returns If the theme is dark or not.
   */
  public getDarkTheme(): boolean {
    return this.darkTheme;
  }

  /**
   * Set autorotate for the orbit controls.
   * @param rotate If the autorotate is to be set or not.
   */
  public setAutoRotate(rotate: boolean) {
    this.three.autoRotate(rotate);
  }

  /**
   * Get preset views from the configuration.
   * @returns Available preset views.
   */
  public getPresetViews(): PresetView[] {
    if (this.configuration) {
      return this.configuration.presetViews;
    }
  }

  /**
   * Change camera view to a preset view.
   * @param view Preset view to which the camera has to be transformed.
   */
  public displayView(view: PresetView) {
    this.three.animateCameraTransform(view.cameraPos, [0, 0, 0], 1000);
  }

  /**
   * Toggle orthographic/perspective view.
   * @param orthographic If the camera is to be orthographic or perspective.
   */
  public toggleOrthographicView(orthographic: boolean) {
    this.three.swapCameras(orthographic);
  }

  /**
   * Set the renderer for the secondary overlay canvas.
   * @param overlayCanvas Canvas for which the overlay renderer is to be set.
   */
  public setOverlayRenderer(overlayCanvas: HTMLCanvasElement) {
    this.three.setOverlayRenderer(overlayCanvas);
  }

  // **********************
  // * EXPERIMENT CONTROLS *
  // **********************

  public setExperimentControls(experimentControls: ExperimentControlNode) {
    this.experimentControls = experimentControls;
  }

}
