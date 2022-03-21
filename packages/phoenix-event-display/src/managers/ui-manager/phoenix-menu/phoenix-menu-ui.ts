import { Color } from 'three';
import { SceneManager } from '../../three-manager/scene-manager';
import { ThreeManager } from '../../three-manager';
import { PhoenixMenuNode } from './phoenix-menu-node';
import { Cut } from '../../../extras/cut.model';
import { PrettySymbols } from '../../../helpers/pretty-symbols';
import { ColorByOptionKeys, ColorOptions } from '../color-options';
import { PhoenixUI } from '../phoenix-ui';

/**
 * A wrapper class for Phoenix menu to perform UI related operations.
 */
export class PhoenixMenuUI implements PhoenixUI<PhoenixMenuNode> {
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

  public clear() {
    if (this.phoenixMenu) {
      this.phoenixMenu.truncate();
      this.phoenixMenu = undefined;
    }
    this.geomFolder = null;
    this.eventFolder = null;
    this.labelsFolder = null;
  }

  public addGeometryFolder() {
    // Phoenix menu
    if (this.geomFolder === null) {
      this.geomFolder = this.phoenixMenu.addChild(
        'Detector',
        (value) => {
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
        onChange: (value) => {
          this.three.getSceneManager().wireframeGeometries(value);
        },
      })
      .addConfig('slider', {
        label: 'Opacity',
        min: 0,
        max: 1,
        step: 0.01,
        allowCustomValue: true,
        onChange: (value) => {
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
        onChange: (scale) => {
          this.three
            .getSceneManager()
            .scaleObject(SceneManager.GEOMETRIES_ID, scale);
        },
      });
  }

  public addGeometry(
    name: string,
    color: any,
    initiallyVisible: boolean = true,
    menuNodeName?: string
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
        onChange: (value) => {
          this.three.getSceneManager().changeObjectColor(name, value);
        },
      })
      .addConfig('slider', {
        label: 'Opacity',
        min: 0,
        max: 1,
        step: 0.05,
        allowCustomValue: true,
        onChange: (opacity) => {
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
      onChange: (value) => {
        this.three.eventDataDepthTest(value);
      },
    });
  }

  public addEventDataTypeFolder(typeName: string): PhoenixMenuNode {
    return this.eventFolder.addChild(typeName, (value: boolean) => {
      this.three.getSceneManager().objectVisibility(typeName, value);
    });
  }

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
        this.three
          .getSceneManager()
          .objectVisibility(collectionName, value, SceneManager.EVENT_DATA_ID);
      }
    );

    const drawOptionsNode = collectionNode.addChild('Draw Options');

    drawOptionsNode.addConfig('slider', {
      label: 'Opacity',
      min: 0.1,
      step: 0.1,
      max: 1,
      onChange: (value) => {
        this.three.getSceneManager().setGeometryOpacity(collectionName, value);
      },
    });

    drawOptionsNode.addConfig('checkbox', {
      label: 'Wireframe',
      onChange: (value) =>
        this.three.getSceneManager().wireframeObjects(collectionName, value),
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
            this.three.getSceneManager().collectionFilter(collectionName, cuts);
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
        onChange: (value) => {
          this.three.getSceneManager().changeObjectColor(labelId, value);
        },
      });

      labelNode.addConfig('button', {
        label: 'Remove',
        onClick: () => {
          removeLabel?.();
          this.removeLabel(labelId, labelNode);
        },
      });
    }
  }

  public removeLabel(labelId: string, labelNode?: PhoenixMenuNode) {
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
