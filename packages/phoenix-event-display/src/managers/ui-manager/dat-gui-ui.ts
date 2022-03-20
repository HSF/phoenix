import { GUI } from 'dat.gui';
import { Color } from 'three';
import { ThreeManager } from '../three-manager';
import { SceneManager } from '../three-manager/scene-manager';
import { Cut } from '../../extras/cut.model';
import { PhoenixUI } from './phoenix-ui';

/**
 * A wrapper class for dat.GUI menu to perform UI related operations.
 */
export class DatGUIMenuUI implements PhoenixUI<GUI> {
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

  public clear() {
    const gui = document.getElementById('gui');
    if (gui != null) {
      gui.remove();
    }
    this.geomFolder = null;
  }

  public addGeometryFolder() {
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

  public addGeometry(
    name: string,
    color: Color,
    initiallyVisible?: boolean,
    _menuSubfolder?: string
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
        randomColor: () =>
          this.three.getColorManager().collectionColorRandom(collectionName),
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
        this.three.getColorManager().collectionColor(collectionName, value)
      );
      colorMenu.setValue(collectionColor?.getHex());
      collFolder
        .add(this.guiParameters[collectionName], 'randomColor')
        .name('Random Color');

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

  public addLabel(labelId: string, onRemoveLabel?: () => void) {
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
      onRemoveLabel?.();
      this.removeLabelFolder(labelId, labelItem);
    };
    labelItem.add(this.guiParameters[labelId], 'removeLabel').name('Remove');
  }

  public removeLabelFolder(labelId: string, labelItemFolder?: GUI) {
    if (!labelItemFolder) {
      labelItemFolder = this.labelsFolder.__folders[labelId];
    }

    if (labelItemFolder) {
      this.labelsFolder.removeFolder(labelItemFolder);
    }
  }
}
