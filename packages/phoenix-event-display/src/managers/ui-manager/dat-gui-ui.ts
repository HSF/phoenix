import { GUI } from 'dat.gui';
import { Color } from 'three';
import { ThreeManager } from '../three-manager';
import { SceneManager } from '../three-manager/scene-manager';
import { Cut } from '../../extras/cut.model';

/**
 * A wrapper class for dat.GUI menu to perform UI related operations.
 */
export class DatGUIMenuUI {
  /** dat.GUI menu. */
  private gui: GUI;
  /** Options for the dat.GUI menu. */
  private guiParameters = {
    rotate: undefined,
    axis: undefined,
    lowRes: undefined,
    eventData: undefined,
    geometries: undefined,
    labels: undefined,
  };
  /** dat.GUI menu folder containing geometries data. */
  private geomFolder: GUI;
  /** dat.GUI menu folder containing event related data. */
  private eventFolder: GUI;
  /** dat.GUI menu folder containing labels. */
  private labelsFolder: GUI;

  /** Max changeable position of an object along the x-axis. */
  private maxPositionX = 4000;
  /** Max changeable position of an object along the y-axis. */
  private maxPositionY = 4000;
  /** Max changeable position of an object along the z-axis. */
  private maxPositionZ = 4000;

  /**
   * Create dat.GUI menu UI with different controls related to detector geometry and event data.
   * @param elementId ID of the wrapper element.
   * @param three The three manager for managing three.js related operations.
   */
  constructor(elementId: string = 'eventDisplay', private three: ThreeManager) {
    this.gui = new GUI();
    this.gui.domElement.id = 'gui';
    this.gui.domElement.style.cssText =
      'position: absolute; right: 0; top: 2rem; z-index: 11;';
    const canvas = document.getElementById(elementId) ?? document.body;
    canvas.appendChild(this.gui.domElement);
    this.geomFolder = null;
    this.eventFolder = null;
    this.labelsFolder = null;
  }

  /**
   * Clear the dat.GUI menu.
   */
  public clearDatGUI() {
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
    if (this.geomFolder === null) {
      this.geomFolder = this.gui.addFolder(SceneManager.GEOMETRIES_ID);
    }
    this.guiParameters.geometries = { show: true, wireframe: false };
    // A boolean toggle for showing/hiding the geometries is added to the 'Geometry' folder.
    const showGeometriesMenu = this.geomFolder
      .add(this.guiParameters.geometries, 'show')
      .name('Show')
      .listen();
    showGeometriesMenu.onChange((value) => {
      this.three
        .getSceneManager()
        .objectVisibility(SceneManager.GEOMETRIES_ID, value);
    });
    // A boolean toggle for enabling/disabling the geometries' wireframing.
    const wireframeGeometriesMenu = this.geomFolder
      .add(this.guiParameters.geometries, 'wireframe')
      .name('Wireframe')
      .listen();
    wireframeGeometriesMenu.onChange((value) => {
      this.three.getSceneManager().wireframeGeometries(value);
    });
  }

  /**
   * Adds geometry to the dat.GUI menu's geometry folder and sets up its configurable options.
   * @param name Name of the geometry.
   * @param color Color of the geometry.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   */
  public addGeometry(
    name: string,
    color: any,
    initiallyVisible: boolean = true
  ) {
    // A new folder for the object is added to the 'Geometry' folder
    this.guiParameters[name] = {
      show: initiallyVisible,
      color: color ?? '#000000',
      x: 0,
      y: 0,
      z: 0,
      detectorOpacity: 1.0,
      remove: this.removeOBJ(name),
      scale: 1,
    };

    const objFolder = this.geomFolder.addFolder(name);
    // A color picker is added to the object's folder
    const colorMenu = objFolder
      .addColor(this.guiParameters[name], 'color')
      .name('Color');
    colorMenu.onChange((value) =>
      this.three.getSceneManager().changeObjectColor(name, value)
    );

    const opacity = objFolder
      .add(this.guiParameters[name], 'detectorOpacity', 0.0, 1.0)
      .name('Opacity');
    opacity.onFinishChange((newValue) =>
      this.three.getSceneManager().setGeometryOpacity(name, newValue)
    );

    // A boolean toggle for showing/hiding the object is added to its folder
    const showMenu = objFolder
      .add(this.guiParameters[name], 'show')
      .name('Show')
      .listen();
    showMenu.onChange((value) =>
      this.three.getSceneManager().objectVisibility(name, value)
    );
    // Scale slider
    const scaleMenu = objFolder
      .add(this.guiParameters[name], 'scale', 0, 1000)
      .name('Scale');
    scaleMenu.onChange((value) => {
      this.three.getSceneManager().scaleObject(name, value);
    });
    // Controls for positioning.
    // const position = this.three.getObjectPosition(name);
    objFolder
      .add(this.guiParameters[name], 'x', -this.maxPositionX, this.maxPositionX)
      .name('X')
      .onChange((value) =>
        this.three.getSceneManager().getObjectPosition(name).setX(value)
      );
    objFolder
      .add(this.guiParameters[name], 'y', -this.maxPositionY, this.maxPositionY)
      .name('Y')
      .onChange((value) =>
        this.three.getSceneManager().getObjectPosition(name).setY(value)
      );
    objFolder
      .add(this.guiParameters[name], 'z', -this.maxPositionZ, this.maxPositionZ)
      .name('Z')
      .onChange((value) =>
        this.three.getSceneManager().getObjectPosition(name).setZ(value)
      );
    // Controls for deleting the obj
    objFolder.add(this.guiParameters[name], 'remove').name('Remove');
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
    // If there is already an event data folder it is deleted and we create a new one.
    if (this.eventFolder !== null) {
      this.gui.removeFolder(this.eventFolder);
    }

    // A new folder for the Event Data is added to the GUI.
    this.eventFolder = this.gui.addFolder('Event Data');
    this.guiParameters.eventData = { show: true, depthTest: true };
    // A boolean toggle for showing/hiding the event data is added to the 'Event Data' folder.
    const menu = this.eventFolder
      .add(this.guiParameters.eventData, 'show')
      .name('Show')
      .listen();
    menu.onChange((value) =>
      this.three
        .getSceneManager()
        .objectVisibility(SceneManager.EVENT_DATA_ID, value)
    );

    // A boolean toggle for enabling/disabling depthTest of event data.
    const depthTestMenu = this.eventFolder
      .add(this.guiParameters.eventData, 'depthTest')
      .name('Depth Test')
      .listen();
    depthTestMenu.onChange((value) => this.three.eventDataDepthTest(value));
  }

  /**
   * Add folder for event data type like tracks or hits to the dat.GUI menu.
   * @param typeName Name of the type of event data.
   * @returns dat.GUI menu's folder for event data type.
   */
  public addEventDataTypeFolder(typeName: string): GUI {
    const typeFolder = this.eventFolder.addFolder(typeName);
    this.guiParameters.eventData[typeName] = true;
    const menu = typeFolder
      .add(this.guiParameters.eventData, typeName)
      .name('Show')
      .listen();
    menu.onChange((value) =>
      this.three.getSceneManager().objectVisibility(typeName, value)
    );

    return typeFolder;
  }

  /**
   * Add collection folder and its configurable options to the event data type (tracks, hits etc.) folder.
   * @param typeFolder dat.GUI menu folder of an event data type.
   * @param collectionName Name of the collection to be added in the type of event data (tracks, hits etc.).
   * @param cuts Cuts to the collection of event data that are to be made configurable to filter event data.
   * @param collectionColor Color of the collection.
   */
  public addCollection(
    typeFolder: GUI,
    collectionName: string,
    cuts?: Cut[],
    collectionColor?: Color
  ) {
    if (typeFolder) {
      // A new folder for the collection is added to the 'Event Data' folder
      this.guiParameters[collectionName] = {
        show: true,
        color: 0x000000,
        resetCut: () =>
          this.three
            .getSceneManager()
            .groupVisibility(collectionName, true, SceneManager.EVENT_DATA_ID),
      };
      const collFolder = typeFolder.addFolder(collectionName);
      // A boolean toggle for showing/hiding the collection is added to its folder
      const showMenu = collFolder
        .add(this.guiParameters[collectionName], 'show')
        .name('Show')
        .listen();
      showMenu.onChange((value) =>
        this.three
          .getSceneManager()
          .objectVisibility(collectionName, value, SceneManager.EVENT_DATA_ID)
      );
      // A color picker is added to the collection's folder
      const colorMenu = collFolder
        .addColor(this.guiParameters[collectionName], 'color')
        .name('Color');
      colorMenu.onChange((value) =>
        this.three.getSceneManager().collectionColor(collectionName, value)
      );
      colorMenu.setValue(collectionColor?.getHex());
      // Cuts menu
      if (cuts) {
        const cutsFolder = collFolder.addFolder('Cuts');
        cutsFolder
          .add(this.guiParameters[collectionName], 'resetCut')
          .name('Reset cuts');
        for (const cut of cuts) {
          const minCut = cutsFolder
            .add(cut, 'minValue', cut.minValue, cut.maxValue)
            .name('min ' + cut.field);
          minCut.onChange((value) => {
            this.three.getSceneManager().collectionFilter(collectionName, cuts);
          });
          const maxCut = cutsFolder
            .add(cut, 'maxValue', cut.minValue, cut.maxValue)
            .name('max ' + cut.field);
          maxCut.onChange((value) => {
            this.three.getSceneManager().collectionFilter(collectionName, cuts);
          });
        }
      }
    }
  }

  /**
   * Add labels folder to dat.GUI menu.
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

    this.labelsFolder = this.gui.addFolder(SceneManager.LABELS_ID);

    this.guiParameters.labels = {
      show: true,
      size: 1,
      color: '#a8a8a8',
      saveLabels: onSaveLabels,
      loadLabels: onLoadLabels,
    };

    const showMenu = this.labelsFolder
      .add(this.guiParameters.labels, 'show')
      .name('Show')
      .listen();
    showMenu.onChange(onToggle);

    const labelsSizeMenu = this.labelsFolder
      .add(this.guiParameters.labels, 'size', 0, 10)
      .name('Size');
    labelsSizeMenu.onFinishChange(onSizeChange);

    const colorMenu = this.labelsFolder
      .addColor(this.guiParameters.labels, 'color')
      .name('Color');
    colorMenu.onChange(onColorChange);

    this.labelsFolder
      .add(this.guiParameters.labels, 'saveLabels')
      .name('Save Labels');
    this.labelsFolder
      .add(this.guiParameters.labels, 'loadLabels')
      .name('Load Labels');
  }

  /**
   * Add configuration UI for label.
   * @param labelId Unique ID of the label.
   * @param removeLabel Function to remove label from the scene.
   */
  public addLabel(labelId: string, removeLabel?: () => void) {
    this.guiParameters[labelId] = {
      show: true,
      color: 0xafafaf,
    };

    const labelItem = this.labelsFolder.addFolder(labelId);

    const visibilityToggle = labelItem
      .add(this.guiParameters[labelId], 'show')
      .name('Show')
      .listen();
    visibilityToggle.onChange((value) => {
      this.three
        .getSceneManager()
        .objectVisibility(labelId, value, SceneManager.LABELS_ID);
    });

    const colorMenu = labelItem
      .addColor(this.guiParameters[labelId], 'color')
      .name('Çolor');
    colorMenu.onChange((color) =>
      this.three.getSceneManager().changeObjectColor(labelId, color)
    );

    this.guiParameters[labelId]['removeLabel'] = () => {
      removeLabel?.();
      this.removeLabel(labelId, labelItem);
    };
    labelItem.add(this.guiParameters[labelId], 'removeLabel').name('Remove');
  }

  /**
   * Remove label from UI, scene and event data loader if it exists.
   * @param labelId A unique label ID string.
   * @param labelItemFolder dat.GUI folder of the label if any.
   */
  public removeLabel(labelId: string, labelItemFolder?: GUI) {
    if (!labelItemFolder) {
      labelItemFolder = this.labelsFolder.__folders[labelId];
    }

    if (labelItemFolder) {
      this.labelsFolder.removeFolder(labelItemFolder);
    }
  }
}
