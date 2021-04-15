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
}
