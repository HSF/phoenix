import { ThreeManager } from '../three';
import { SceneManager } from '../three/scene-manager';
import * as dat from 'dat.gui';

export class DatGUIMenuUI {
  /** dat.GUI menu. */
  private gui: any;
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
  private geomFolder: any;
  /** dat.GUI menu folder containing event related data. */
  private eventFolder: any;
  /** dat.GUI menu folder containing labels. */
  private labelsFolder: any;
  /** If the geometry folder is added or not */
  private geomFolderAdded: boolean = false;

  /** Max changeable position of an object along the x-axis. */
  private maxPositionX = 4000;
  /** Max changeable position of an object along the y-axis. */
  private maxPositionY = 4000;
  /** Max changeable position of an object along the z-axis. */
  private maxPositionZ = 4000;

  /**
   * Create dat.GUI menu with different controls related to detector geometry and event data.
   * @param elementId ID of the wrapper element.
   * @param three The three manager for managing three.js related operations.
   */
  constructor(elementId: string = 'eventDisplay', private three: ThreeManager) {
    this.gui = new dat.GUI();
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
}
