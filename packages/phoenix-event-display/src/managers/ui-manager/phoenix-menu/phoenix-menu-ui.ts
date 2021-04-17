import { SceneManager } from '../../three-manager/scene-manager';
import { ThreeManager } from '../../three-manager';
import { PhoenixMenuNode } from './phoenix-menu-node';
import { Color } from 'three';
import { Cut } from '../../../extras/cut.model';
import { PrettySymbols } from '../../../helpers/pretty-symbols';

/**
 * A wrapper class for Phoenix menu to perform UI related operations.
 */
export class PhoenixMenuUI {
  /** Root node of the phoenix menu. */
  private phoenixMenu: PhoenixMenuNode;
  /** Phoenix menu node containing geometries data */
  private geomFolder: PhoenixMenuNode;
  /** Phoenix menu node containing event related data. */
  private eventFolder: PhoenixMenuNode;
  /** State of the Phoenix menu node containing event related data. */
  private eventFolderState: any;
  /** Phoenix menu node containing labels. */
  private labelsFolder: PhoenixMenuNode;

  /**
   * Create Phoenix menu UI with different controls related to detector geometry and event data.
   * @param three The three manager for managing three.js related operations.
   */
  constructor(phoenixMenu: PhoenixMenuNode, private three: ThreeManager) {
    if (this.phoenixMenu) {
      this.phoenixMenu.truncate();
      this.phoenixMenu = undefined;
    }
    this.phoenixMenu = phoenixMenu;

    this.geomFolder = null;
    this.eventFolder = null;
    this.labelsFolder = null;
  }

  /**
   * Clear the Phoenix menu.
   */
  public clearPhoenixMenu() {
    if (this.phoenixMenu) {
      this.phoenixMenu.truncate();
      this.phoenixMenu = undefined;
    }
    this.geomFolder = null;
    this.eventFolder = null;
    this.labelsFolder = null;
  }

  /**
   * Add geometry (detector geometry) folder to the Phoenix menu.
   */
  public addGeomFolder() {
    // Phoenix menu
    if (this.geomFolder === null) {
      this.geomFolder = this.phoenixMenu.addChild(
        'Detector',
        (value: boolean) => {
          this.three
            .getSceneManager()
            .groupVisibility(SceneManager.GEOMETRIES_ID, value);
        },
        'perspective'
      );
    }
    this.geomFolder
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
    let parentNode: PhoenixMenuNode = this.geomFolder;
    if (menuNodeName) {
      parentNode = this.geomFolder.findInTreeOrCreate(menuNodeName);
    }

    const objFolder = parentNode.addChild(name, (value: boolean) => {
      this.three.getSceneManager().objectVisibility(name, value);
    });

    objFolder.toggleState = initiallyVisible;

    objFolder
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
      })
      .addConfig('button', {
        label: 'Remove',
        onClick: () => {
          objFolder.remove();
          this.three.getSceneManager().removeGeometry(name);
        },
      });
  }

  /**
   * Functions for event data toggles like show/hide and depthTest.
   */
  public addEventDataFolder() {
    // Phoenix menu
    if (this.eventFolder !== null) {
      this.eventFolderState = this.eventFolder.getNodeState();
      this.eventFolder.remove();
    }
    this.eventFolder = this.phoenixMenu.addChild(
      'Event Data',
      (value: boolean) => {
        this.three
          .getSceneManager()
          .groupVisibility(SceneManager.EVENT_DATA_ID, value);
      },
      'event-folder'
    );
    this.eventFolder.addConfig('checkbox', {
      label: 'Depth Test',
      isChecked: true,
      onChange: (value: boolean) => {
        this.three.eventDataDepthTest(value);
      },
    });
  }

  /**
   * Add folder for event data type like tracks or hits to the Phoenix menu.
   * @param typeName Name of the type of event data.
   * @returns Phoenix menu's folder for event data type.
   */
  public addEventDataTypeFolder(typeName: string): PhoenixMenuNode {
    return this.eventFolder.addChild(typeName, (value: boolean) => {
      this.three.getSceneManager().objectVisibility(typeName, value);
    });
  }

  /**
   * Add collection node and its configurable options to the event data type (tracks, hits etc.) node.
   * @param typeFolder Phoenix menu node of an event data type.
   * @param collectionName Name of the collection to be added in the type of event data (tracks, hits etc.).
   * @param cuts Cuts to the collection of event data that are to be made configurable to filter event data.
   * @param collectionColor Default color of the collection.
   */
  public addCollection(
    typeFolder: PhoenixMenuNode,
    collectionName: string,
    cuts?: Cut[],
    collectionColor?: Color
  ) {
    const collectionNode = typeFolder.addChild(
      collectionName,
      (value: boolean) => {
        this.three
          .getSceneManager()
          .objectVisibility(collectionName, value, SceneManager.EVENT_DATA_ID);
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
        this.three.getSceneManager().setGeometryOpacity(collectionName, value);
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
            this.three.getSceneManager().collectionFilter(collectionName, cuts);
          },
        });
      }
    }
  }

  /**
   * Add labels folder to Phoenix menu.
   * @param configFunctions Functions to attach to the labels folder configuration.
   */
  public addLabelsFolder(configFunctions: any) {
    if (this.labelsFolder !== null) {
      return;
    }

    const {
      onToggle,
      onSizeChange,
      onColorChange,
      onSaveLabels,
      onLoadLabels,
    } = configFunctions;

    this.labelsFolder = this.phoenixMenu.addChild(
      SceneManager.LABELS_ID,
      onToggle,
      'info'
    );

    this.labelsFolder.addConfig('slider', {
      label: 'Size',
      min: 0,
      max: 10,
      step: 0.01,
      allowCustomValue: true,
      onChange: onSizeChange,
    });

    this.labelsFolder.addConfig('color', {
      label: 'Color',
      color: '#a8a8a8',
      onChange: onColorChange,
    });

    this.labelsFolder.addConfig('button', {
      label: 'Save Labels',
      onClick: onSaveLabels,
    });

    this.labelsFolder.addConfig('button', {
      label: 'Load Labels',
      onClick: onLoadLabels,
    });
  }

  /**
   * Add configuration UI for label.
   * @param labelId Unique ID of the label.
   * @param removeLabel Function to remove label from the scene.
   */
  public addLabel(labelId: string, removeLabel?: () => void) {
    let labelNode = this.labelsFolder.children.find(
      (phoenixMenuNode) => phoenixMenuNode.name === labelId
    );
    if (!labelNode) {
      labelNode = this.labelsFolder.addChild(labelId, (value) => {
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
          removeLabel?.();
          this.removeLabelNode(labelId, labelNode);
        },
      });
    }
  }

  /**
   * Remove label from UI, scene and event data loader if it exists.
   * @param labelId A unique label ID string.
   * @param labelNode Phoenix menu node of the label if any.
   */
  public removeLabelNode(labelId: string, labelNode?: PhoenixMenuNode) {
    if (!labelNode) {
      labelNode = this.labelsFolder?.children.find(
        (singleLabelNode) => singleLabelNode.name === labelId
      );
    }

    labelNode?.remove();
  }

  /**
   * Load previous state of the event data folder in Phoenix menu if any.
   */
  public loadEventFolderState() {
    if (this.eventFolderState) {
      this.eventFolder.loadStateFromJSON(this.eventFolderState);
    }
  }
}
