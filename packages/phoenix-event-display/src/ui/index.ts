import * as Stats from 'stats-js';
import { ThreeManager } from '../three';
import { Configuration } from '../extras/configuration';
import { PresetView } from '../extras/preset-view.model';
import { Cut } from '../extras/cut.model';
import { SceneManager } from '../three/scene-manager';
import { PhoenixMenuNode } from './phoenix-menu/phoenix-menu-node';
import { PrettySymbols } from '../helpers/pretty-symbols';
import { Color } from 'three';
import { StateManager } from '../managers/state-manager';
import { loadFile, saveFile } from '../helpers/file';
import { DatGUIMenuUI } from './dat-gui-ui';

/**
 * Manager for UI related operations including the dat.GUI menu, stats-js and theme settings.
 */
export class UIManager {
  // Functions ending in PM are for Phoenix Menu

  /** The dat.GUI menu. */
  private datGUIMenu: DatGUIMenuUI;
  /** Stats object from stats-js. */
  private stats: any;
  /** Phoenix menu node containing geometries data */
  private geomFolderPM: PhoenixMenuNode;
  /** Phoenix menu node containing event related data. */
  private eventFolderPM: PhoenixMenuNode;
  /** State of the Phoenix menu node containing event related data. */
  private eventFolderPMState: any;
  /** Phoenix menu node containing labels. */
  private labelsFolderPM: PhoenixMenuNode;
  /** If the geometry folder is added or not */
  private geomFolderAdded: boolean = false;
  /** If the labels folder is added or not */
  private labelsFolderAdded: boolean = false;
  /** Configuration options for preset views and event data loader. */
  private configuration: Configuration;
  /** If dark theme is enabled or disabled. */
  private darkTheme: boolean;
  /** Root node of the phoenix menu. */
  private phoenixMenu: PhoenixMenuNode;

  /** Whether the dat.GUI menu is enabled or disabled. */
  private hasDatGUIMenu: boolean;
  /** Whether the phoenix menu is enabled or disabled. */
  private hasPhoenixMenu: boolean;

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
    // Shows the menu that contains the options to interact with the scene.
    if (configuration.enableDatGUIMenu) {
      this.showDatGUIMenu(configuration.elementId);
    }
    // Set root node of phoenix menu
    if (configuration.phoenixMenuRoot) {
      this.showPhoenixMenu(configuration.phoenixMenuRoot);
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
   * Show dat.GUI menu with different controls related to detector geometry and event data.
   * @param elementId ID of the wrapper element.
   */
  private showDatGUIMenu(elementId: string = 'eventDisplay') {
    this.hasDatGUIMenu = true;
    this.datGUIMenu = new DatGUIMenuUI(elementId, this.three);
  }

  /**
   * Show phoenix menu with different controls related to detector geometry and event data.
   * @param phoenixMenuRoot Root node of the phoenix menu.
   */
  private showPhoenixMenu(phoenixMenuRoot: PhoenixMenuNode) {
    this.setPhoenixMenu(phoenixMenuRoot);
    this.hasPhoenixMenu = true;
    this.geomFolderPM = null;
    this.eventFolderPM = null;
    this.labelsFolderPM = null;
  }

  /**
   * Clear the UI by removing the dat.GUI and phoenix menu(s).
   */
  public clearUI() {
    this.datGUIMenu?.clearDatGUI();
    this.clearPhoenixMenu();
    this.geomFolderAdded = false;
    this.labelsFolderAdded = false;
  }

  /**
   * Clear the phoenix menu.
   */
  private clearPhoenixMenu() {
    if (this.phoenixMenu) {
      this.phoenixMenu.truncate();
      this.phoenixMenu = undefined;
    }
    this.geomFolderPM = null;
    this.eventFolderPM = null;
    this.labelsFolderPM = null;
    this.hasPhoenixMenu = false;
  }

  /**
   * Add geometry (detector geometry) folder to the dat.GUI and Phoenix menu.
   */
  public addGeomFolder() {
    this.geomFolderAdded = true;

    if (this.hasDatGUIMenu) {
      this.datGUIMenu.addGeomFolder();
    }

    if (this.hasPhoenixMenu) {
      // Phoenix menu
      if (this.geomFolderPM === null) {
        this.geomFolderPM = this.phoenixMenu.addChild(
          'Detector',
          (value: boolean) => {
            this.three
              .getSceneManager()
              .groupVisibility(SceneManager.GEOMETRIES_ID, value);
          },
          'perspective'
        );
      }
      this.geomFolderPM
        .addConfig('checkbox', {
          label: 'Wireframe',
          isChecked: false,
          onChange: (value: boolean) => {
            this.three.getSceneManager().wireframeGeometries(value);
          },
        })
        .addConfig('slider', {
          label: 'Opacity',
          min: 0,
          max: 1,
          step: 0.01,
          allowCustomValue: true,
          onChange: (value: number) => {
            this.three
              .getSceneManager()
              .setGeometryOpacity(SceneManager.GEOMETRIES_ID, value);
          },
        })
        .addConfig('slider', {
          label: 'Scale',
          min: 0,
          max: 20,
          step: 0.01,
          allowCustomValue: true,
          onChange: (scale: number) => {
            this.three
              .getSceneManager()
              .scaleObject(SceneManager.GEOMETRIES_ID, scale);
          },
        });
    }
  }

  /**
   * Adds geometry to the dat.GUI menu's geometry folder and sets up its configurable options.
   * @param name Name of the geometry.
   * @param color Color of the geometry.
   * @param menuNodeName Name of the node in Phoenix menu to add the geometry to.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   */
  public addGeometry(
    name: string,
    color: any,
    menuNodeName?: string,
    initiallyVisible: boolean = true
  ) {
    if (!this.geomFolderAdded) {
      this.addGeomFolder();
    }

    if (this.hasDatGUIMenu) {
      this.datGUIMenu.addGeometry(name, color, initiallyVisible);
    }

    if (this.hasPhoenixMenu) {
      let parentNode: PhoenixMenuNode = this.geomFolderPM;
      if (menuNodeName) {
        parentNode = this.geomFolderPM.findInTreeOrCreate(menuNodeName);
      }
      // Phoenix menu
      const objFolderPM = parentNode.addChild(name, (value: boolean) => {
        this.three.getSceneManager().objectVisibility(name, value);
      });
      objFolderPM.toggleState = initiallyVisible;
      objFolderPM
        .addConfig('color', {
          label: 'Color',
          color: color ? `#${new Color(color).getHexString()}` : undefined,
          onChange: (value: any) => {
            this.three.getSceneManager().changeObjectColor(name, value);
          },
        })
        .addConfig('slider', {
          label: 'Opacity',
          min: 0,
          max: 1,
          step: 0.05,
          allowCustomValue: true,
          onChange: (opacity: number) => {
            this.three.getSceneManager().setGeometryOpacity(name, opacity);
          },
        });
    }
  }

  /**
   * Functions for event data toggles like show/hide and depthTest.
   */
  public addEventDataFolder() {
    if (this.hasDatGUIMenu) {
      this.datGUIMenu.addEventDataFolder();
    }

    if (this.hasPhoenixMenu) {
      // Phoenix menu
      if (this.eventFolderPM !== null) {
        this.eventFolderPMState = this.eventFolderPM.getNodeState();
        this.eventFolderPM.remove();
      }
      this.eventFolderPM = this.phoenixMenu.addChild(
        'Event Data',
        (value: boolean) => {
          this.three
            .getSceneManager()
            .groupVisibility(SceneManager.EVENT_DATA_ID, value);
        },
        'event-folder'
      );
      this.eventFolderPM.addConfig('checkbox', {
        label: 'Depth Test',
        isChecked: true,
        onChange: (value: boolean) => {
          this.three.eventDataDepthTest(value);
        },
      });
    }
  }

  /**
   * Add folder for event data type like tracks or hits to the dat.GUI and Phoenix menu.
   * @param typeName Name of the type of event data.
   * @returns dat.GUI and Phoenix menu's folder for event data type.
   */
  public addEventDataTypeFolder(
    typeName: string
  ): { typeFolder?: any; typeFolderPM?: PhoenixMenuNode } {
    let typeFolder: any, typeFolderPM: PhoenixMenuNode;

    if (this.hasDatGUIMenu) {
      typeFolder = this.datGUIMenu.addEventDataTypeFolder(typeName);
    }

    // Phoenix menu
    if (this.hasPhoenixMenu) {
      typeFolderPM = this.eventFolderPM.addChild(typeName, (value: boolean) => {
        this.three.getSceneManager().objectVisibility(typeName, value);
      });
    }

    return { typeFolder, typeFolderPM };
  }

  /**
   * Add collection folder and its configurable options to the event data type (tracks, hits etc.) folder.
   * @param typeFolders dat.GUI and Phoenix menu folders of an event data type.
   * @param collectionName Name of the collection to be added in the type of event data (tracks, hits etc.).
   * @param cuts Cuts to the collection of event data that are to be made configurable to filter event data.
   */
  public addCollection(
    typeFolders: { typeFolder: any; typeFolderPM: PhoenixMenuNode },
    collectionName: string,
    cuts?: Cut[],
    collectionColor?: Color
  ) {
    if (this.hasDatGUIMenu) {
      this.datGUIMenu.addCollection(
        typeFolders.typeFolder,
        collectionName,
        cuts,
        collectionColor
      );
    }

    // Phoenix menu
    if (this.hasPhoenixMenu) {
      this.addCollectionPM(
        typeFolders.typeFolderPM,
        collectionName,
        cuts,
        collectionColor
      );
    }
  }

  /**
   * Add collection node and its configurable options to the event data type (tracks, hits etc.) node.
   * @param typeFolder Phoenix menu node of an event data type.
   * @param collectionName Name of the collection to be added in the type of event data (tracks, hits etc.).
   * @param cuts Cuts to the collection of event data that are to be made configurable to filter event data.
   * @param collectionColor Default color of the collection.
   */
  public addCollectionPM(
    typeFolderPM: PhoenixMenuNode,
    collectionName: string,
    cuts?: Cut[],
    collectionColor?: Color
  ) {
    // Phoenix menu
    if (this.hasPhoenixMenu) {
      const collectionNode = typeFolderPM.addChild(
        collectionName,
        (value: boolean) => {
          this.three
            .getSceneManager()
            .objectVisibility(
              collectionName,
              value,
              SceneManager.EVENT_DATA_ID
            );
        }
      );

      collectionNode.addConfig('color', {
        label: 'Color',
        color: collectionColor
          ? `#${collectionColor?.getHexString()}`
          : undefined,
        onChange: (value: any) => {
          this.three.getSceneManager().collectionColor(collectionName, value);
        },
      });

      collectionNode.addConfig('slider', {
        label: 'Opacity',
        min: 0.1,
        step: 0.1,
        max: 1,
        onChange: (value: number) => {
          this.three
            .getSceneManager()
            .setGeometryOpacity(collectionName, value);
        },
      });

      collectionNode.addConfig('checkbox', {
        label: 'Wireframe',
        onChange: (value: boolean) =>
          this.three.getSceneManager().wireframeObjects(collectionName, value),
      });

      if (cuts) {
        collectionNode
          .addConfig('label', {
            label: 'Cuts',
          })
          .addConfig('button', {
            label: 'Reset cuts',
            onClick: () => {
              this.three
                .getSceneManager()
                .groupVisibility(
                  collectionName,
                  true,
                  SceneManager.EVENT_DATA_ID
                );

              for (const cut of cuts) {
                cut.reset();
              }
            },
          });

        // Add range sliders for cuts
        for (const cut of cuts) {
          collectionNode.addConfig('rangeSlider', {
            label: PrettySymbols.getPrettySymbol(cut.field),
            min: cut.minValue,
            max: cut.maxValue,
            step: cut.step,
            value: cut.minValue,
            highValue: cut.maxValue,
            onChange: (values: any) => {
              cut.minValue = values?.value;
              cut.maxValue = values?.highValue;
              this.three
                .getSceneManager()
                .collectionFilter(collectionName, cuts);
            },
          });
        }
      }
    }
  }

  /**
   * Add labels folder to dat.GUI and Phoenix menu.
   */
  public addLabelsFolder() {
    this.labelsFolderAdded = true;

    // Common functions for Phoenix and dat.GUI menus
    const onToggle = (toggleValue: boolean) => {
      this.three
        .getSceneManager()
        .objectVisibility(SceneManager.LABELS_ID, toggleValue);
    };
    const onSizeChange = (scale: number) => {
      const labels = this.three
        .getSceneManager()
        .getObjectsGroup(SceneManager.LABELS_ID);
      labels.children.forEach((singleLabel) => {
        this.three.getSceneManager().scaleObject(singleLabel.name, scale);
      });
    };
    const onColorChange = (value: any) => {
      const labels = this.three
        .getSceneManager()
        .getObjectsGroup(SceneManager.LABELS_ID);
      labels.children.forEach((singleLabel) => {
        this.three.getSceneManager().changeObjectColor(singleLabel.name, value);
      });
    };
    const onSaveLabels = () => {
      const labelsObject = this.configuration?.eventDataLoader?.getLabelsObject();
      if (labelsObject) {
        saveFile(JSON.stringify(labelsObject), 'phoenix-labels.json');
      }
    };
    const onLoadLabels = () => {
      this.loadLabelsFile();
    };

    if (this.hasDatGUIMenu) {
      this.datGUIMenu.addLabelsFolder({
        onToggle,
        onSizeChange,
        onColorChange,
        onSaveLabels,
        onLoadLabels,
      });
    }

    if (this.hasPhoenixMenu && this.labelsFolderPM === null) {
      this.labelsFolderPM = this.phoenixMenu.addChild(
        SceneManager.LABELS_ID,
        onToggle,
        'info'
      );

      this.labelsFolderPM.addConfig('slider', {
        label: 'Size',
        min: 0,
        max: 10,
        step: 0.01,
        allowCustomValue: true,
        onChange: onSizeChange,
      });

      this.labelsFolderPM.addConfig('color', {
        label: 'Color',
        color: '#a8a8a8',
        onChange: onColorChange,
      });

      this.labelsFolderPM.addConfig('button', {
        label: 'Save Labels',
        onClick: onSaveLabels,
      });

      this.labelsFolderPM.addConfig('button', {
        label: 'Load Labels',
        onClick: onLoadLabels,
      });
    }
  }

  /**
   * Add configuration UI for label.
   * @param labelId Unique ID of the label.
   */
  public addLabel(labelId: string) {
    if (!this.labelsFolderAdded) {
      this.addLabelsFolder();
    }

    if (this.hasDatGUIMenu) {
      this.datGUIMenu.addLabel(labelId);
    }

    if (this.hasPhoenixMenu) {
      let labelNode = this.labelsFolderPM.children.find(
        (phoenixMenuNode) => phoenixMenuNode.name === labelId
      );
      if (!labelNode) {
        labelNode = this.labelsFolderPM.addChild(labelId, (value) => {
          this.three.getSceneManager().objectVisibility(labelId, value);
        });

        labelNode.addConfig('color', {
          label: 'Color',
          color: '#a8a8a8',
          onChange: (value: any) => {
            this.three.getSceneManager().changeObjectColor(labelId, value);
          },
        });

        labelNode.addConfig('button', {
          label: 'Remove',
          onClick: () => {
            this.removeLabel(labelId, labelNode);
          },
        });
      }
    }
  }

  /**
   * Remove label from UI, scene and event data loader if it exists.
   * @param labelId A unique label ID string.
   * @param labelNode Phoenix menu node of the label if any.
   */
  public removeLabel(labelId: string, labelNode?: PhoenixMenuNode) {
    if (!labelNode) {
      labelNode = this.labelsFolderPM?.children.find(
        (singleLabelNode) => singleLabelNode.name === labelId
      );
    }

    if (labelNode) {
      this.three.getSceneManager().removeLabel(labelId);
      const objectKeys = labelId.split(' > ');
      // labelsObject[EventDataType][Collection][Index]
      const labelsObject = this.configuration.eventDataLoader?.getLabelsObject();
      delete labelsObject?.[objectKeys[0]]?.[objectKeys[1]]?.[objectKeys[2]];

      labelNode.remove();
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
   * Rotate the clipping on detector geometry.
   * @param angle Angle of rotation of the clipping.
   */
  public rotateClipping(angle: number) {
    this.three.rotateClipping(angle);
    this.stateManager.setClippingAngle(angle);
  }

  /**
   * Set if the detector geometry is to be clipped or not.
   * @param value Set clipping to be true or false.
   */
  public setClipping(value: boolean) {
    this.three.setClipping(value);
    this.stateManager.setClippingEnabled(value);
  }

  /**
   * Detect the current theme and set it.
   */
  public detectColorScheme() {
    let dark = false; // default to light

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

    this.darkTheme = dark;
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
   * Set whether to show the axis or not
   * @param show If the axis is to be shown or not.
   */
  public setShowAxis(show: boolean) {
    this.three.getSceneManager().setAxis(show);
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

  /**
   * Set the phoenix menu to be used by the UI manager.
   * @param phoenixMenu The root node of phoenix menu.
   */
  public setPhoenixMenu(phoenixMenu: PhoenixMenuNode) {
    if (this.phoenixMenu) {
      this.phoenixMenu.truncate();
      this.phoenixMenu = undefined;
    }
    this.phoenixMenu = phoenixMenu;
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
  public loadEventFolderPMState() {
    if (this.eventFolderPMState) {
      this.eventFolderPM.loadStateFromJSON(this.eventFolderPMState);
    }
  }
}
