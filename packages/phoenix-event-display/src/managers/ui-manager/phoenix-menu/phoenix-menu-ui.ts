import {
  BufferGeometry,
  Color,
  Group,
  Mesh,
  MeshPhongMaterial,
  Object3D,
} from 'three';
import { SceneManager } from '../../three-manager/scene-manager';
import { ThreeManager } from '../../three-manager/index';
import { PhoenixMenuNode } from './phoenix-menu-node';
import { Cut } from '../../../lib/models/cut.model';
import { ColorByOptionKeys, ColorOptions } from '../color-options';
import type { PhoenixUI } from '../phoenix-ui';
import type { ConfigSelect } from './config-types';

/**
 * Information about a geometry that has been removed from the scene and menu.
 */
interface RemovedGeometry {
  /** Unique ID of the removed geometry. */
  id: string;
  /** Display name of the removed geometry. */
  name: string;
  /** Three.js 3D object of the geometry. */
  object: Object3D;
  /** Subfolder in the menu where the geometry was located. */
  menuSubfolder?: string;
  /** Three.js parent object before removal. */
  parent3D?: Object3D;
}

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
  /** Track per-collection extend-to-radius state for Phoenix menu */
  private collectionExtendState: {
    [key: string]: { enabled: boolean; radius: number };
  } = {};

  /** Registry of active cuts per collection name for re-application on event switch. */
  private collectionCuts: { [collectionName: string]: Cut[] } = {};

  /** List of geometries that have been removed and can be restored. */
  private removedGeometries: RemovedGeometry[] = [];

  /** Callback fired when UI state / visibility / cuts change. */
  public onStateChange?: () => void;

  /**
   * Create Phoenix menu UI with different controls related to detector geometry and event data.
   * @param phoenixMenuRoot Root node of the Phoenix menu.
   * @param three The three manager for managing three.js related operations.
   */
  constructor(
    private phoenixMenuRoot: PhoenixMenuNode,
    private three: ThreeManager,
  ) {
    this.sceneManager = three.getSceneManager();
  }

  /**
   * Clear the menu by removing all folders.
   */
  public clear() {
    if (this.phoenixMenuRoot) {
      this.phoenixMenuRoot.truncate();
    }

    this.eventFolderState = undefined;
    this.removedGeometries = [];
  }

  /**
   * Add geometry (detector geometry) folder to the menu.
   */
  public addGeometryFolder() {
    // Phoenix menu
    if (this.eventFolderState === undefined) {
      this.geomFolder = this.phoenixMenuRoot.addChild(
        'Detector',
        (value) => {
          this.sceneManager.groupVisibility(SceneManager.GEOMETRIES_ID, value);
        },
        'perspective',
      );
    }

    this.geomFolder
      .addConfig({
        type: 'checkbox',
        label: 'Wireframe',
        isChecked: false,
        onChange: (value) => {
          this.sceneManager.wireframeGeometries(value);
        },
      })
      .addConfig({
        type: 'slider',
        label: 'Opacity',
        min: 0,
        max: 1,
        step: 0.01,
        allowCustomValue: true,
        onChange: (value) => {
          this.sceneManager.setGeometryOpacity(
            this.sceneManager.getObjectByName(
              SceneManager.GEOMETRIES_ID,
            ) as Mesh,
            value,
          );
        },
      })
      .addConfig({
        type: 'slider',
        label: 'Scale',
        min: 0,
        max: 20,
        step: 0.01,
        allowCustomValue: true,
        onChange: (scale) => {
          this.sceneManager.scaleObject(
            this.sceneManager.getObjectByName(SceneManager.GEOMETRIES_ID),
            scale,
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
    let nameStart = name.lastIndexOf(' > ');
    if (nameStart < 0) {
      nameStart = 0; // case where there is no hierarchy
    } else {
      nameStart += 3; // skip the last ' > '
    }
    const objFolder = parentNode.addChild(
      name.substring(nameStart),
      (value: boolean) => {
        this.sceneManager.objectVisibility(object, value);
      },
    );

    objFolder.toggleState = visible;

    objFolder
      .addConfig({
        type: 'color',
        label: 'Color',
        color: color ? `#${new Color(color).getHexString()}` : undefined,
        onChange: (value) => {
          this.sceneManager.changeObjectColor(object, value);
        },
      })
      .addConfig({
        type: 'slider',
        label: 'Opacity',
        min: 0,
        max: 1,
        step: 0.05,
        allowCustomValue: true,
        onChange: (opacity) => {
          this.sceneManager.setGeometryOpacity(object as Mesh, opacity);
        },
      })
      .addConfig({
        type: 'button',
        label: 'Remove',
        onClick: () => {
          this.removeGeometry(object, objFolder, menuSubfolder);
        },
      });
  }

  /**
   * Remove a geometry from the scene and the menu, and track it for restoration.
   * @param object Geometry object to be removed.
   * @param objFolder Phoenix menu node of the geometry object.
   * @param menuSubfolder Subfolder in the menu where the geometry was located.
   */
  public removeGeometry(
    object: Object3D,
    objFolder?: PhoenixMenuNode,
    menuSubfolder?: string,
  ) {
    const parent3D = object.parent;
    if (objFolder) {
      objFolder.remove();
    } else {
      const rawName = object.name || '';
      const nameStart = rawName.lastIndexOf(' > ');
      const nodeName =
        nameStart < 0 ? rawName : rawName.substring(nameStart + 3);
      const node = this.geomFolder?.findInTree(nodeName);
      node?.remove();
    }

    this.sceneManager?.removeGeometry(object);

    const rawName = object.name || '';
    let nameStart = rawName.lastIndexOf(' > ');
    if (nameStart < 0) {
      nameStart = 0;
    } else {
      nameStart += 3;
    }
    const baseName = rawName.substring(nameStart) || rawName || 'Geometry';
    const displayName = menuSubfolder
      ? `${baseName} (${menuSubfolder})`
      : baseName;

    let finalDisplayName = displayName;
    let counter = 1;
    while (this.removedGeometries.some((g) => g.name === finalDisplayName)) {
      counter++;
      finalDisplayName = `${displayName} (${counter})`;
    }

    this.removedGeometries.push({
      id: object.uuid,
      name: finalDisplayName,
      object,
      menuSubfolder,
      parent3D,
    });

    this.updateRemovedGeometriesConfig();
    this.onStateChange?.();
  }

  /**
   * Update the removed geometries section in the top level geometry configuration.
   */
  private updateRemovedGeometriesConfig() {
    if (!this.geomFolder) {
      return;
    }

    this.geomFolder.removeConfigsByGroup('removed-geometries');

    if (this.removedGeometries.length === 0) {
      return;
    }

    if (this.removedGeometries.length === 1) {
      const item = this.removedGeometries[0];
      this.geomFolder.addConfig({
        type: 'label',
        label: 'Removed Geometry',
        group: 'removed-geometries',
      });
      this.geomFolder.addConfig({
        type: 'button',
        label: `Restore ${item.name}`,
        group: 'removed-geometries',
        onClick: () => {
          this.restoreGeometry(item.id);
        },
      });
    } else {
      this.geomFolder.addConfig({
        type: 'label',
        label: 'Removed Geometries',
        group: 'removed-geometries',
      });

      let selectedId = this.removedGeometries[0].id;
      const options = this.removedGeometries.map((g) => g.name);

      const selectConfig: ConfigSelect = {
        type: 'select',
        label: 'Restore',
        group: 'removed-geometries',
        options: options,
        value: options[0],
        onChange: (selectedOption) => {
          const found = this.removedGeometries.find(
            (g) => g.name === selectedOption,
          );
          if (found) {
            selectedId = found.id;
            selectConfig.value = selectedOption;
          }
        },
      };
      this.geomFolder.addConfig(selectConfig);

      this.geomFolder.addConfig({
        type: 'button',
        label: 'Restore Selected',
        group: 'removed-geometries',
        onClick: () => {
          this.restoreGeometry(selectedId);
        },
      });

      this.geomFolder.addConfig({
        type: 'button',
        label: 'Restore All',
        group: 'removed-geometries',
        onClick: () => {
          this.restoreAllGeometries();
        },
      });
    }
  }

  /**
   * Restore a previously removed geometry back to the scene and the menu.
   * @param idOrName UUID or display name of the geometry to restore.
   */
  public restoreGeometry(idOrName: string) {
    const index = this.removedGeometries.findIndex(
      (g) => g.id === idOrName || g.name === idOrName,
    );
    if (index === -1) {
      return;
    }

    const [removed] = this.removedGeometries.splice(index, 1);
    const { object, menuSubfolder, parent3D } = removed;

    if (parent3D && parent3D.parent) {
      parent3D.add(object);
    } else {
      const geometries = this.sceneManager?.getGeometries?.() as Group;
      if (geometries?.add) {
        geometries.add(object);
      }
    }
    object.visible = true;

    this.addGeometry(object, menuSubfolder);
    this.updateRemovedGeometriesConfig();
    this.onStateChange?.();
  }

  /**
   * Restore all previously removed geometries back to the scene and the menu.
   */
  public restoreAllGeometries() {
    const toRestore = [...this.removedGeometries];
    this.removedGeometries = [];

    for (const removed of toRestore) {
      const { object, menuSubfolder, parent3D } = removed;
      if (parent3D && parent3D.parent) {
        parent3D.add(object);
      } else {
        const geometries = this.sceneManager?.getGeometries?.() as Group;
        if (geometries?.add) {
          geometries.add(object);
        }
      }
      object.visible = true;

      this.addGeometry(object, menuSubfolder);
    }

    this.updateRemovedGeometriesConfig();
    this.onStateChange?.();
  }

  /**
   * Get the list of currently removed geometries.
   * @returns Array of removed geometry descriptors.
   */
  public getRemovedGeometries(): {
    id: string;
    name: string;
    object: Object3D;
  }[] {
    return this.removedGeometries.map(({ id, name, object }) => ({
      id,
      name,
      object,
    }));
  }

  /**
   * Add event data folder with functions for event data toggles like show/hide and depthTest.
   */
  public addEventDataFolder() {
    // Phoenix menu
    if (this.eventFolder) {
      this.eventFolderState = this.eventFolder.getNodeState();
      this.eventFolder.remove();
    }
    this.collectionCuts = {};

    this.eventFolder = this.phoenixMenuRoot.addChild(
      'Event Data',
      (value: boolean) => {
        this.sceneManager.groupVisibility(SceneManager.EVENT_DATA_ID, value);
      },
      'event-folder',
    );
    this.eventFolder.addConfig({
      type: 'checkbox',
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
          .getObjectByName(typeName) as Object3D,
        value,
      );
      this.onStateChange?.();
    });
  }

  /**
   * Add collection folder and its configurable options to the event data type (tracks, hits etc.) folder.
   * @param eventDataType Name of the event data type.
   * @param collectionName Name of the collection to be added in the type of event data (tracks, hits etc.).
   * @param cuts Cuts to the collection of event data that are to be made configurable to filter event data.
   * @param collectionColor Default color of the collection.
   * @param colorByOptions Options to color the collection by. If not provided, defaults based on the event data type are used.
   */
  public addCollection(
    eventDataType: string,
    collectionName: string,
    cuts?: Cut[],
    collectionColor?: Color,
    colorByOptions?: ColorByOptionKeys[],
  ) {
    const typeFolder = this.eventFolder.children.find(
      (eventDataTypeNode) => eventDataTypeNode.name === eventDataType,
    );

    if (!typeFolder) {
      return;
    }

    const collectionNode = typeFolder.addChild(
      collectionName,
      (value: boolean) => {
        const collectionObject = this.sceneManager
          .getObjectByName(SceneManager.EVENT_DATA_ID)
          ?.getObjectByName(collectionName);
        if (collectionObject)
          this.sceneManager.objectVisibility(collectionObject, value);
        this.onStateChange?.();
      },
    );

    this.addDrawOptions(collectionNode, collectionName, typeFolder.name);

    // Always register cuts for this collection if any were provided.
    // This ensures the registry has the Cut instances so StateManager
    // can serialize active cuts (minCutActive / maxCutActive) even if
    // the initial cuts array was empty or the user only moves sliders later.
    if (cuts !== undefined) {
      this.collectionCuts[collectionName] = cuts;
      if (cuts.length > 0) {
        this.addCutOptions(collectionNode, collectionName, cuts);
      }
    }

    if (colorByOptions === undefined) {
      colorByOptions = [];

      // Extra config options specific to tracks
      if (typeFolder.name === 'Tracks') {
        colorByOptions.push(
          ColorByOptionKeys.CHARGE,
          ColorByOptionKeys.MOM,
          ColorByOptionKeys.VERTEX,
        );
      }
    }

    new ColorOptions(
      this.three.getColorManager(),
      collectionNode,
      collectionColor ? collectionColor : new Color(),
      colorByOptions,
    );
  }

  /**
   * Add Cut Options folder to the menu.
   * @param collectionNode The parent node to attach folder to
   * @param collectionName The name of the collection
   */
  private addCutOptions(
    collectionNode: PhoenixMenuNode,
    collectionName: string,
    cuts: Cut[],
  ) {
    const cutsOptionsNode = collectionNode.addChild(
      'Cut Options',
      undefined,
      'cut-options',
    );

    cutsOptionsNode
      .addConfig({
        type: 'label',
        label: 'Cuts',
      })
      .addConfig({
        type: 'button',
        label: 'Reset cuts',
        onClick: () => {
          this.sceneManager.groupVisibility(
            collectionName,
            true,
            SceneManager.EVENT_DATA_ID,
          );

          for (const cut of cuts) {
            cut.reset();
          }
          this.onStateChange?.();
        },
      });

    // Add range sliders for cuts
    for (const cut of cuts) {
      cutsOptionsNode.addConfig(
        cut.getConfigRangeSlider(() => {
          this.sceneManager.collectionFilter(collectionName, cuts);
          this.onStateChange?.();
        }),
      );
    }
  }

  /**
   * Add Draw Options folder to the menu.
   * @param collectionNode The parent node to attach folder to
   * @param collectionName The name of the collection
   * @param eventDataType Name of the event data type of the collection.
   */
  private addDrawOptions(
    collectionNode: PhoenixMenuNode,
    collectionName: string,
    eventDataType?: string,
  ) {
    const drawOptionsNode = collectionNode.addChild(
      'Draw Options',
      undefined,
      'draw-options',
    );

    drawOptionsNode.addConfig({
      type: 'slider',
      label: 'Opacity',
      min: 0.1,
      step: 0.1,
      max: 1,
      onChange: (value) => {
        const eventDataObject = this.sceneManager.getObjectByName(
          SceneManager.EVENT_DATA_ID,
        );
        if (eventDataObject) {
          const collectionObject =
            eventDataObject.getObjectByName(collectionName);
          if (collectionObject) {
            this.sceneManager.setGeometryOpacity(
              collectionObject as Mesh,
              value,
            );
          }
        }
      },
    });

    drawOptionsNode.addConfig({
      type: 'checkbox',
      label: 'Wireframe',
      onChange: (value) =>
        this.sceneManager.wireframeObjects(
          this.sceneManager
            .getObjectByName(SceneManager.EVENT_DATA_ID)
            ?.getObjectByName(collectionName) as Object3D,
          value,
        ),
    });

    if (eventDataType === 'Tracks') {
      drawOptionsNode.addConfig({
        type: 'slider',
        label: 'Line width scale',
        value: 1,
        min: 0.1,
        max: 10,
        step: 0.1,
        allowCustomValue: true,
        onChange: (value: number) =>
          this.three.setCollectionLineWidthScale(collectionName, Number(value)),
      });
    }

    // Extension controls for tracks: add checkbox and radius slider
    // Maintain state in this.collectionExtendState
    if (!this.collectionExtendState[collectionName]) {
      this.collectionExtendState[collectionName] = {
        enabled: false,
        radius: 1500,
      };
    }
    drawOptionsNode.addConfig({
      type: 'checkbox',
      label: 'Extend to radius',
      isChecked: this.collectionExtendState[collectionName].enabled,
      onChange: (value: boolean) => {
        this.collectionExtendState[collectionName].enabled = value;
        const radius = this.collectionExtendState[collectionName].radius;
        this.three.extendCollectionTracks(collectionName, radius, value);
      },
    });

    drawOptionsNode.addConfig({
      type: 'slider',
      label: 'Extend radius',
      min: 100,
      max: 5000,
      step: 10,
      allowCustomValue: true,
      onChange: (value: number) => {
        this.collectionExtendState[collectionName].radius = value;
        if (this.collectionExtendState[collectionName].enabled) {
          this.three.extendCollectionTracks(collectionName, value, true);
        }
      },
    });
  }

  /**
   * Add labels folder to the menu.
   * @param configFunctions Functions to attach to the labels folder configuration.
   */
  public addLabelsFolder(configFunctions: any) {
    if (this.labelsFolder) {
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
      'info',
    );

    this.labelsFolder.addConfig({
      type: 'slider',
      label: 'Size',
      min: 0,
      max: 10,
      step: 0.01,
      allowCustomValue: true,
      onChange: onSizeChange,
    });

    this.labelsFolder.addConfig({
      type: 'color',
      label: 'Color',
      color: '#a8a8a8',
      onChange: onColorChange,
    });

    this.labelsFolder.addConfig({
      type: 'button',
      label: 'Save Labels',
      onClick: onSaveLabels,
    });

    this.labelsFolder.addConfig({
      type: 'button',
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
      (phoenixMenuNode) => phoenixMenuNode.name === labelId,
    );

    if (labelNode) {
      return;
    }

    labelNode = this.labelsFolder.addChild(labelId, (value) => {
      const labelObject = this.sceneManager
        .getObjectByName(SceneManager.LABELS_ID)
        .getObjectByName(labelId);
      if (labelObject) this.sceneManager.objectVisibility(labelObject, value);
    });

    labelNode.addConfig({
      type: 'color',
      label: 'Color',
      color: '#a8a8a8',
      onChange: (value) => {
        this.sceneManager.changeObjectColor(
          this.sceneManager.getObjectByName(labelId),
          value,
        );
      },
    });

    labelNode.addConfig({
      type: 'button',
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
        (singleLabelNode) => singleLabelNode.name === labelId,
      );
    }

    labelNode?.remove();
  }

  /**
   * Get the folder of the event data type.
   * @param typeName Name of the event data type.
   * @returns Folder of the event data type.
   */
  public getEventDataTypeFolder(typeName: string): PhoenixMenuNode | undefined {
    return this.eventFolder.children.find(
      (eventDataTypeNode) => eventDataTypeNode.name === typeName,
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
  /**
   * Re-applies all active cuts to their collections after an event switch.
   * Called by UIManager after buildEventData() completes.
   */
  public reapplyCollectionCuts(): void {
    for (const [collectionName, cuts] of Object.entries(this.collectionCuts)) {
      this.sceneManager.collectionFilter(collectionName, cuts);
    }
    this.onStateChange?.();
  }

  /**
   * Returns the active cut registry keyed by collection name.
   * Used by StateManager for cut state serialization on Save State.
   * @returns A reference to the collectionCuts registry.
   */
  public getCollectionCuts(): { [collectionName: string]: Cut[] } {
    return this.collectionCuts;
  }

  /**
   * Set cuts for a specific collection in the registry.
   * Used by StateManager when restoring cut state from Load State.
   * @param collectionName Name of the collection.
   * @param cuts Array of Cut instances to register.
   */
  public setCollectionCuts(collectionName: string, cuts: Cut[]): void {
    this.collectionCuts[collectionName] = cuts;
  }
}
