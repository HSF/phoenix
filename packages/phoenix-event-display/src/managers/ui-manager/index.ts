import * as Stats from 'stats-js';
import { Color, Object3D } from 'three';
import { ThreeManager } from '../three-manager';
import { Configuration } from '../../lib/types/configuration';
import {
  PresetView,
  ClippingSetting,
} from '../../lib/models/preset-view.model';
import { Cut } from '../../lib/models/cut.model';
import { SceneManager } from '../three-manager/scene-manager';
import { StateManager } from '../../managers/state-manager';
import { loadFile, saveFile } from '../../helpers/file';
import { DatGUIMenuUI } from './dat-gui-ui';
import { PhoenixMenuUI } from './phoenix-menu/phoenix-menu-ui';
import {
  getFromLocalStorage,
  setToLocalStorage,
} from '../../helpers/browser-storage';
import { PhoenixUI } from './phoenix-ui';

/**
 * Manager for UI related operations including the dat.GUI menu, stats-js and theme settings.
 */
export class UIManager {
  // Functions ending in PM are for Phoenix Menu

  /** The dat.GUI menu UI. A wrapper for dat.GUI menu to perform UI related operations. */
  private uiMenus: PhoenixUI<unknown>[] = [];
  /** Stats object from stats-js. */
  private stats: any;
  /** If the geometry folder is added or not */
  private geomFolderAdded: boolean = false;
  /** If the labels folder is added or not */
  private labelsFolderAdded: boolean = false;
  /** Configuration options for preset views and event data loader. */
  private configuration: Configuration;
  /** If dark theme is enabled or disabled. */
  private darkTheme: boolean;

  /** State manager for managing the event display's state. */
  private stateManager: StateManager;

  /**
   * Constructor for the UI manager.
   * @param three Three manager to perform three.js related operations.
   */
  constructor(private three: ThreeManager) {}

  /**
   * Show/load the UI including stats, the dat.GUI menu and theme.
   * @param configuration Configuration options for preset views and event data loader.
   */
  public init(configuration: Configuration) {
    // Clear the existing UI
    this.clearUI();
    // Set the configuration
    this.configuration = configuration;
    // Shows a panel on screen with information about the performance (fps).
    this.showStats(configuration.elementId);

    // UI Menus
    this.uiMenus = [];
    if (configuration.enableDatGUIMenu) {
      this.uiMenus.push(new DatGUIMenuUI(configuration.elementId, this.three));
    }
    if (configuration.phoenixMenuRoot) {
      this.uiMenus.push(
        new PhoenixMenuUI(configuration.phoenixMenuRoot, this.three)
      );
    }

    // Detect UI color scheme
    this.detectColorScheme();
    // State manager
    this.stateManager = new StateManager();
    this.stateManager.setPhoenixMenuRoot(configuration.phoenixMenuRoot);
  }

  /**
   * Show stats including FPS, milliseconds to render a frame, allocated memory etc.
   * @param elementId ID of the wrapper element.
   */
  private showStats(elementId: string = 'eventDisplay') {
    this.stats = Stats();
    this.stats.showPanel(0);
    this.stats.dom.className = 'ui-element';
    this.stats.dom.id = 'statsElement';
    this.stats.domElement.style.cssText =
      'position: absolute; left: 0px; cursor: pointer; opacity: 0.9; z-index: 10; bottom: 0px;';
    let canvas = document.getElementById(elementId);
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
   * Clear the UI by removing the dat.GUI and phoenix menu(s).
   */
  public clearUI() {
    this.uiMenus.forEach((menu) => menu.clear());

    this.geomFolderAdded = false;
    this.labelsFolderAdded = false;
  }

  /**
   * Add geometry (detector geometry) folder to the dat.GUI and Phoenix menu.
   */
  public addGeomFolder() {
    this.geomFolderAdded = true;
    this.uiMenus.forEach((menu) => menu.addGeometryFolder());
  }

  /**
   * Add geometry to the menus geometry folder and set up its configurable options.
   * @param object Object to add to the UI menu.
   * @param menuSubfolder Subfolder in the menu to add the geometry to. Example `Folder > Subfolder`.
   */
  public addGeometry(object: Object3D, menuSubfolder?: string) {
    if (!this.geomFolderAdded) {
      this.addGeomFolder();
    }

    this.uiMenus.forEach((menu) => menu.addGeometry(object, menuSubfolder));
  }

  /**
   * Functions for event data toggles like show/hide and depthTest.
   */
  public addEventDataFolder() {
    this.uiMenus.forEach((menu) => menu.addEventDataFolder());
  }

  /**
   * Add folder for event data type like tracks or hits to the dat.GUI and Phoenix menu.
   * @param typeName Name of the type of event data.
   * @returns dat.GUI and Phoenix menu's folder for event data type.
   */
  public addEventDataTypeFolder(typeName: string): void {
    this.uiMenus.forEach((menu) => menu.addEventDataTypeFolder(typeName));
  }

  /**
   * Add collection folder and its configurable options to the event data type (tracks, hits etc.) folder.
   * @param eventDataType Name of the event data type.
   * @param collectionName Name of the collection to be added in the type of event data (tracks, hits etc.).
   * @param cuts Cuts to the collection of event data that are to be made configurable to filter event data.
   */
  public addCollection(
    eventDataType: string,
    collectionName: string,
    cuts?: Cut[],
    collectionColor?: Color
  ) {
    this.uiMenus.forEach((menu) =>
      menu.addCollection(eventDataType, collectionName, cuts, collectionColor)
    );
  }

  /**
   * Add labels folder to dat.GUI and Phoenix menu.
   */
  public addLabelsFolder() {
    const sceneManager = this.three.getSceneManager();
    this.labelsFolderAdded = true;

    // Common functions for Phoenix and dat.GUI menus
    const onToggle = (toggleValue: boolean) => {
      sceneManager.objectVisibility(
        sceneManager.getObjectByName(SceneManager.LABELS_ID),
        toggleValue
      );
    };
    const onSizeChange = (scale: number) => {
      const labels = sceneManager.getObjectByName(SceneManager.LABELS_ID);
      sceneManager.scaleObject(labels, scale);
    };
    const onColorChange = (value: any) => {
      const labels = sceneManager.getObjectByName(SceneManager.LABELS_ID);
      sceneManager.changeObjectColor(labels, value);
    };
    const onSaveLabels = () => {
      const labelsObject =
        this.configuration?.eventDataLoader?.getLabelsObject();
      if (labelsObject) {
        saveFile(JSON.stringify(labelsObject), 'phoenix-labels.json');
      }
    };
    const onLoadLabels = () => {
      this.loadLabelsFile();
    };

    this.uiMenus.forEach((menu) =>
      menu.addLabelsFolder({
        onToggle,
        onSizeChange,
        onColorChange,
        onSaveLabels,
        onLoadLabels,
      })
    );
  }

  /**
   * Add configuration UI for label.
   * @param labelId Unique ID of the label.
   */
  public addLabel(labelId: string) {
    if (!this.labelsFolderAdded) {
      this.addLabelsFolder();
    }

    this.uiMenus.forEach((menu) =>
      menu?.addLabel(labelId, () => this.removeLabel(labelId))
    );
  }

  /**
   * Remove label from UI, scene and event data loader if it exists.
   * @param labelId A unique label ID string.
   * @param removeFolders Whether to remove label folders from dat.GUI and Phoenix menu.
   */
  public removeLabel(labelId: string, removeFolders?: boolean) {
    this.three.getSceneManager().removeLabel(labelId);
    const objectKeys = labelId.split(' > ');
    // labelsObject[EventDataType][Collection][Index]
    const labelsObject = this.configuration.eventDataLoader?.getLabelsObject();
    delete labelsObject?.[objectKeys[0]]?.[objectKeys[1]]?.[objectKeys[2]];

    if (removeFolders) {
      this.uiMenus.forEach((menu) => menu.removeLabel(labelId));
    }
  }

  /**
   * Sets the visibility of a geometry in the scene.
   * @param name Name of the geometry in the scene
   * @param visible Value for the visibility of the object
   */
  public geometryVisibility(name: string, visible: boolean) {
    const sceneManager = this.three.getSceneManager();
    sceneManager.objectVisibility(sceneManager.getObjectByName(name), visible);
  }

  /**
   * Rotate the starting angle of clipping on detector geometry.
   * @param angle Angle of rotation of the clipping.
   */
  public rotateStartAngleClipping(angle: number) {
    const openingAngle = this.stateManager.getOpeningClippingAngle();
    this.three.setClippingAngle(angle, openingAngle);
    this.stateManager.setStartClippingAngle(angle);
  }

  /**
   * Rotate the opening angle of clipping on detector geometry.
   * @param angle Angle of rotation of the clipping.
   */
  public rotateOpeningAngleClipping(angle: number) {
    const startingAngle = this.stateManager.getStartClippingAngle();
    this.three.setClippingAngle(startingAngle, angle);
    this.stateManager.setOpeningClippingAngle(angle);
  }

  /**
   * Set if the detector geometry is to be clipped or not.
   * @param value Set clipping to be true or false.
   */
  public setClipping(value: boolean) {
    console.log(value);
    this.three.setClipping(value);
    this.stateManager.setClippingEnabled(value);
  }

  /**
   * Detect the current theme and set it.
   */
  public detectColorScheme() {
    let dark = false; // default to light

    // local storage is used to override OS theme settings
    if (getFromLocalStorage('theme')) {
      if (getFromLocalStorage('theme') === 'dark') {
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
    const theme = dark ? 'dark' : 'light';
    setToLocalStorage('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
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
   * Set whether to show the axis or not
   * @param show If the axis is to be shown or not.
   */
  public setShowAxis(show: boolean) {
    this.three.getSceneManager().setAxis(show);
  }

  /**
   * Set whether to show the eta/phi or not
   * @param show If the grid is to be shown or not.
   */
  public setShowGrid(show: boolean) {
    this.three.getSceneManager().setEtaPhiGrid(show);
  }

  /**
   * Get preset views from the configuration.
   * @returns Available preset views.
   */
  public getPresetViews(): PresetView[] {
    return this.configuration?.presetViews;
  }

  /**
   * Change camera view to a preset view.
   * @param view Preset view to which the camera has to be transformed.
   */
  public displayView(view: PresetView) {
    this.three.animateCameraTransform(view.cameraPos, view.cameraTarget, 1000);
    if (view.clipping != ClippingSetting.NotForced) {
      this.rotateStartAngleClipping(view.clippingStartAngle);
      this.rotateOpeningAngleClipping(view.clippingOpeningAngle);
      this.setClipping(view.clipping == ClippingSetting.On);
    }
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

  /**
   * Enable keyboard controls for some UI manager operations.
   */
  public enableKeyboardControls() {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const isTyping = ['input', 'textarea'].includes(
        (e.target as HTMLElement)?.tagName.toLowerCase()
      );

      if (!isTyping && e.shiftKey) {
        switch (e.code) {
          case 'KeyT': // shift + "t"
            this.setDarkTheme(!this.getDarkTheme());
            break;
        }

        // Shortcut keys for preset views (shift + 1...9)
        if (this.configuration?.presetViews) {
          if (e.code.startsWith('Digit')) {
            const index = parseInt(e.code.slice(-1)) - 1;
            if (this.configuration.presetViews?.[index]) {
              this.displayView(this.configuration.presetViews[index]);
            }
          }
        }
      }
    });
  }

  /**
   * Load labels from a file.
   */
  private loadLabelsFile() {
    const eventDataLoader = this.configuration?.eventDataLoader;
    const labelsObject = eventDataLoader?.getLabelsObject();
    if (eventDataLoader && labelsObject) {
      loadFile((data) => {
        const labelsObject = JSON.parse(data);
        for (const eventDataType of Object.keys(labelsObject)) {
          for (const collection of Object.keys(labelsObject[eventDataType])) {
            const collectionObject = eventDataLoader.getCollection(collection);
            for (const labelIndex of Object.keys(
              labelsObject[eventDataType][collection]
            )) {
              const label = labelsObject[eventDataType][collection][labelIndex];
              const objectUuid = collectionObject[labelIndex].uuid;
              const labelId = eventDataLoader.addLabelToEventObject(
                label,
                collection,
                Number(labelIndex)
              );
              this.addLabel(labelId);
              this.three.addLabelToObject(label, objectUuid, labelId);
            }
          }
        }
      });
    }
  }

  /**
   * Load previous state of the event data folder in Phoenix menu if any.
   */
  public loadEventFolderPhoenixMenuState() {
    const phoenixMenuUI = this.uiMenus.find(
      (uiMenu) => uiMenu instanceof PhoenixMenuUI
    ) as PhoenixMenuUI;
    phoenixMenuUI?.loadEventFolderState();
  }

  /**
   * Get all the UI menus.
   * @returns An array containing UI menus. (Phoenix menu, dat.GUI menu etc.)
   */
  public getUIMenus(): PhoenixUI<unknown>[] {
    return this.uiMenus;
  }
}
