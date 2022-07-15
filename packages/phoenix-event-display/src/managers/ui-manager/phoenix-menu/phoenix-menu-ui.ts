import {
  BufferGeometry,
  Color,
  Mesh,
  MeshPhongMaterial,
  Object3D,
} from 'three';
import { SceneManager } from '../../three-manager/scene-manager';
import { ThreeManager } from '../../three-manager';
import { PhoenixMenuNode } from './phoenix-menu-node';
import { Cut } from '../../../lib/models/cut.model';
import { PrettySymbols } from '../../../helpers/pretty-symbols';
import { ColorByOptionKeys, ColorOptions } from '../color-options';
import { PhoenixUI } from '../phoenix-ui';

/**
 * A wrapper class for Phoenix menu to perform UI related operations.
 */
export class PhoenixMenuUI implements PhoenixUI<PhoenixMenuNode> {
  /** Phoenix menu node containing geometries data */
  private geomFolder: PhoenixMenuNode;
  /** Phoenix menu node containing event related data. */
  private eventFolder: PhoenixMenuNode;
  /** State of the Phoenix menu node containing event related data. */
  private eventFolderState: any;
  /** Phoenix menu node containing labels. */
  private labelsFolder: PhoenixMenuNode;
  /** Manager for managing functions of the three.js scene. */
  private sceneManager: SceneManager;

  /**
   * Create Phoenix menu UI with different controls related to detector geometry and event data.
   * @param phoenixMenuRoot Root node of the Phoenix menu.
   * @param three The three manager for managing three.js related operations.
   */
  constructor(
    private phoenixMenuRoot: PhoenixMenuNode,
    private three: ThreeManager
  ) {
    this.geomFolder = null;
    this.eventFolder = null;
    this.labelsFolder = null;
    this.sceneManager = three.getSceneManager();
  }

  /**
   * Clear the menu by removing all folders.
   */
  public clear() {
    if (this.phoenixMenuRoot) {
      this.phoenixMenuRoot.truncate();
      this.phoenixMenuRoot = undefined;
    }

    this.geomFolder = null;
    this.eventFolder = null;
    this.labelsFolder = null;
  }

  /**
   * Add geometry (detector geometry) folder to the menu.
   */
  public addGeometryFolder() {
    // Phoenix menu
    if (this.geomFolder === null) {
      this.geomFolder = this.phoenixMenuRoot.addChild(
        'Detector',
        (value) => {
          this.sceneManager.groupVisibility(SceneManager.GEOMETRIES_ID, value);
        },
        'perspective'
      );
    }

    this.geomFolder
      .addConfig('checkbox', {
        label: 'Wireframe',
        isChecked: false,
        onChange: (value) => {
          this.sceneManager.wireframeGeometries(value);
        },
      })
      .addConfig('slider', {
        label: 'Opacity',
        min: 0,
        max: 1,
        step: 0.01,
        allowCustomValue: true,
        onChange: (value) => {
          this.sceneManager.setGeometryOpacity(
            this.sceneManager.getObjectByName(SceneManager.GEOMETRIES_ID),
            value
          );
        },
      })
      .addConfig('slider', {
        label: 'Scale',
        min: 0,
        max: 20,
        step: 0.01,
        allowCustomValue: true,
        onChange: (scale) => {
          this.sceneManager.scaleObject(
            this.sceneManager.getObjectByName(SceneManager.GEOMETRIES_ID),
            scale
          );
        },
      });
  }

  /**
   * Add geometry to the menu's geometry folder and set up its configurable options.
   * @param object Object to add to the UI menu.
   * @param menuSubfolder Subfolder in the menu to add the geometry to. Example `Folder > Subfolder`.
   */
  public addGeometry(object: Object3D, menuSubfolder?: string) {
    const { name, material, visible } = object as Mesh<
      BufferGeometry,
      MeshPhongMaterial
    >;
    const color = material?.color;

    let parentNode: PhoenixMenuNode = this.geomFolder;
    if (menuSubfolder) {
      parentNode = this.geomFolder.findInTreeOrCreate(menuSubfolder);
    }

    // find out where the actual object name starts, providing that the name
    // is hierarchical and contents higher level menu names too
    var nameStart = name.lastIndexOf(' > ');
    if (nameStart < 0) {
      nameStart = 0; // case where there is no hierarchy
    } else {
      nameStart += 3; // skip the last ' > '
    }
    const objFolder = parentNode.addChild(
      name.substring(nameStart),
      (value: boolean) => {
        this.sceneManager.objectVisibility(object, value);
      }
    );

    objFolder.toggleState = visible;

    objFolder
      .addConfig('color', {
        label: 'Color',
        color: color ? `#${new Color(color).getHexString()}` : undefined,
        onChange: (value) => {
          this.sceneManager.changeObjectColor(object, value);
        },
      })
      .addConfig('slider', {
        label: 'Opacity',
        min: 0,
        max: 1,
        step: 0.05,
        allowCustomValue: true,
        onChange: (opacity) => {
          this.sceneManager.setGeometryOpacity(object, opacity);
        },
      })
      .addConfig('button', {
        label: 'Remove',
        onClick: () => {
          objFolder.remove();
          this.sceneManager.removeGeometry(object);
        },
      });
  }

  /**
   * Add event data folder with functions for event data toggles like show/hide and depthTest.
   */
  public addEventDataFolder() {
    // Phoenix menu
    if (this.eventFolder !== null) {
      this.eventFolderState = this.eventFolder.getNodeState();
      this.eventFolder.remove();
    }
    this.eventFolder = this.phoenixMenuRoot.addChild(
      'Event Data',
      (value: boolean) => {
        this.sceneManager.groupVisibility(SceneManager.EVENT_DATA_ID, value);
      },
      'event-folder'
    );
    this.eventFolder.addConfig('checkbox', {
      label: 'Depth Test',
      isChecked: true,
      onChange: (value) => {
        this.three.eventDataDepthTest(value);
      },
    });
  }

  /**
   * Add folder for event data type like tracks or hits to the menu.
   * @param typeName Name of the type of event data.
   */
  public addEventDataTypeFolder(typeName: string): void {
    this.eventFolder.addChild(typeName, (value: boolean) => {
      this.sceneManager.objectVisibility(
        this.sceneManager
          .getObjectByName(SceneManager.EVENT_DATA_ID)
          .getObjectByName(typeName),
        value
      );
    });
  }

  /**
   * Add collection folder and its configurable options to the event data type (tracks, hits etc.) folder.
   * @param eventDataType Name of the event data type.
   * @param collectionName Name of the collection to be added in the type of event data (tracks, hits etc.).
   * @param cuts Cuts to the collection of event data that are to be made configurable to filter event data.
   * @param collectionColor Default color of the collection.
   */
  public addCollection(
    eventDataType: string,
    collectionName: string,
    cuts?: Cut[],
    collectionColor?: Color
  ) {
    const typeFolder = this.eventFolder.children.find(
      (eventDataTypeNode) => eventDataTypeNode.name === eventDataType
    );

    if (!typeFolder) {
      return;
    }

    const collectionNode = typeFolder.addChild(
      collectionName,
      (value: boolean) => {
        const collectionObject = this.sceneManager
          .getObjectByName(SceneManager.EVENT_DATA_ID)
          .getObjectByName(collectionName);
        this.sceneManager.objectVisibility(collectionObject, value);
      }
    );

    const drawOptionsNode = collectionNode.addChild('Draw Options');

    drawOptionsNode.addConfig('slider', {
      label: 'Opacity',
      min: 0.1,
      step: 0.1,
      max: 1,
      onChange: (value) => {
        this.sceneManager.setGeometryOpacity(
          this.sceneManager
            .getObjectByName(SceneManager.EVENT_DATA_ID)
            .getObjectByName(collectionName),
          value
        );
      },
    });

    drawOptionsNode.addConfig('checkbox', {
      label: 'Wireframe',
      onChange: (value) =>
        this.sceneManager.wireframeObjects(
          this.sceneManager
            .getObjectByName(SceneManager.EVENT_DATA_ID)
            .getObjectByName(collectionName),
          value
        ),
    });

    if (cuts && cuts.length > 0) {
      const cutsOptionsNode = collectionNode.addChild('Cut Options');

      cutsOptionsNode
        .addConfig('label', {
          label: 'Cuts',
        })
        .addConfig('button', {
          label: 'Reset cuts',
          onClick: () => {
            this.sceneManager.groupVisibility(
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
        cutsOptionsNode.addConfig('rangeSlider', {
          label: PrettySymbols.getPrettySymbol(cut.field),
          min: cut.minValue,
          max: cut.maxValue,
          step: cut.step,
          value: cut.minValue,
          highValue: cut.maxValue,
          onChange: ({ value, highValue }) => {
            cut.minValue = value;
            cut.maxValue = highValue;
            this.sceneManager.collectionFilter(collectionName, cuts);
          },
        });
      }
    }

    const colorByOptions: ColorByOptionKeys[] = [];

    // Extra config options specific to tracks
    if (typeFolder.name === 'Tracks') {
      colorByOptions.push(
        ColorByOptionKeys.CHARGE,
        ColorByOptionKeys.MOM,
        ColorByOptionKeys.VERTEX
      );
    }

    new ColorOptions(
      this.three.getColorManager(),
      collectionNode,
      collectionColor,
      colorByOptions
    );
  }

  /**
   * Add labels folder to the menu.
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

    this.labelsFolder = this.phoenixMenuRoot.addChild(
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
   * Add folder for configuration of label.
   * @param labelId Unique ID of the label.
   * @param onRemoveLabel Function called when label is removed.
   */
  public addLabel(labelId: string, onRemoveLabel?: () => void) {
    let labelNode = this.labelsFolder.children.find(
      (phoenixMenuNode) => phoenixMenuNode.name === labelId
    );

    if (labelNode) {
      return;
    }

    labelNode = this.labelsFolder.addChild(labelId, (value) => {
      const labelObject = this.sceneManager
        .getObjectByName(SceneManager.LABELS_ID)
        .getObjectByName(labelId);
      this.sceneManager.objectVisibility(labelObject, value);
    });

    labelNode.addConfig('color', {
      label: 'Color',
      color: '#a8a8a8',
      onChange: (value) => {
        this.sceneManager.changeObjectColor(
          this.sceneManager.getObjectByName(labelId),
          value
        );
      },
    });

    labelNode.addConfig('button', {
      label: 'Remove',
      onClick: () => {
        onRemoveLabel?.();
        this.removeLabel(labelId, labelNode);
      },
    });
  }

  /**
   * Remove label from the menu and scene if it exists.
   * @param labelId A unique label ID string.
   * @param labelFolderReference Reference to the label folder.
   */
  public removeLabel(labelId: string, labelNode?: PhoenixMenuNode) {
    if (!labelNode) {
      labelNode = this.labelsFolder?.children.find(
        (singleLabelNode) => singleLabelNode.name === labelId
      );
    }

    labelNode?.remove();
  }

  /**
   * Get the folder of the event data type.
   * @param typeName Name of the event data type.
   * @returns Folder of the event data type.
   */
  public getEventDataTypeFolder(typeName: string): PhoenixMenuNode {
    return this.eventFolder.children.find(
      (eventDataTypeNode) => eventDataTypeNode.name === typeName
    );
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
