import { EventEmitter } from '@angular/core';
import { Tween, update as tweenUpdate } from '@tweenjs/tween.js';
import {
  Group,
  Object3D,
  Vector3,
  Plane,
  Quaternion,
  Material,
  AmbientLight,
  DirectionalLight,
  AxesHelper,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  Euler,
  PerspectiveCamera,
  Vector2,
  Raycaster,
  Intersection,
  Event,
} from 'three';
import html2canvas from 'html2canvas';
import { Configuration } from '../../lib/types/configuration';
import { ControlsManager } from './controls-manager';
import { RendererManager } from './renderer-manager';
import { ExportManager } from './export-manager';
import { ImportManager } from './import-manager';
import { SelectionManager } from './selection-manager';
import { SceneManager } from './scene-manager';
import { AnimationPreset, AnimationsManager } from './animations-manager';
import { InfoLogger } from '../../helpers/info-logger';
import { EffectsManager } from './effects-manager';
import { StateManager } from '../state-manager';
import { LoadingManager } from '../loading-manager';
import { ActiveVariable } from '../../helpers/active-variable';
import { ColorManager } from './color-manager';
import { XRManager, XRSessionType } from './xr/xr-manager';
import { VRManager } from './xr/vr-manager';
import { ARManager } from './xr/ar-manager';
import { GeometryUIParameters } from '../../lib/types/geometry-ui-parameters';

(function () {
  const _updateMatrixWorld = Object3D.prototype.updateMatrixWorld;
  Object3D.prototype.updateMatrixWorld = function () {
    if (!this.visible) {
      return;
    }
    _updateMatrixWorld.apply(this);
  };
})();

/**
 * Manager for all three.js related functions.
 */
export class ThreeManager {
  // Managers
  /** Manager for three.js scene. */
  private sceneManager: SceneManager;
  /** Manager for three.js renderers. */
  private rendererManager: RendererManager;
  /** Manager for three.js controls. */
  private controlsManager: ControlsManager;
  /** Manager for export operations. */
  private exportManager: ExportManager;
  /** Manager for import operations. */
  private importManager: ImportManager;
  /** Manager for selection of 3D objects and event data. */
  private selectionManager: SelectionManager;
  /** Manager for managing animation related operations using three.js and tween.js. */
  private animationsManager: AnimationsManager;
  /** Manager for managing effects using EffectComposer. */
  private effectsManager: EffectsManager;
  /** VR manager for VR related operations. */
  private vrManager: VRManager;
  /** AR manager for AR related operations. */
  private arManager: ARManager;
  /** Coloring manager for three.js functions related to coloring of objects. */
  private colorManager: ColorManager;
  /** Loading manager for loadable resources. */
  private loadingManager: LoadingManager;
  /** State manager for managing the scene's state. */
  private stateManager: StateManager;
  /** Loop to run for each frame of animation. */
  private animationLoop: () => void;
  /** Loop to run for each frame to update stats. */
  private uiLoop: () => void;
  /** Function to check if the object intersected with raycaster is an event data */
  private isEventData: (elem: Intersection<Object3D<Event>>) => boolean;
  /** Function to check if the object intersected with raycaster is visible or lies in the clipped region */
  private isVisible: (elem: Intersection<Object3D<Event>>) => boolean;
  /** 'click' event listener callback to show 3D coordinates of the clicked point */
  private show3DPointsCallback: (event: MouseEvent) => void;
  /** 'click' event listener callback to shift the cartesian grid at the clicked point */
  private shiftCartesianGridCallback: (event: MouseEvent) => void;
  /** 'click' event listener callback to show 3D distance between two clicked points */
  private show3DDistanceCallback: (event: MouseEvent) => void;
  /** Origin of the cartesian grid w.r.t. world origin */
  private origin: Vector3 = new Vector3(0, 0, 0);
  /** Scene export ignore list. */
  private ignoreList = [
    new AmbientLight().type,
    new DirectionalLight().type,
    new AxesHelper().type,
  ];
  /** Clipping planes for clipping geometry. */
  private clipPlanes: Plane[];
  /** Status of clipping intersection. */
  private clipIntersection: boolean;
  /** Store the 3D coordinates of first point to find 3D Distance */
  private prev3DCoord: Vector3 = null;
  /** Store the 2D coordinates of first point to find 3D Distance */
  private prev2DCoord: Vector2;
  /** Store the name of the object of first intersect while finding 3D Distance */
  private prevIntersectName: string = null;
  /** Canvas used for rendering the distance line */
  private distanceCanvas: HTMLCanvasElement = null;
  /** Color of the text to be displayed as per dark theme */
  private displayColor: string = 'black';
  /** Mousemove callback to draw dynamic distance line */
  private mousemoveCallback: (MouseEvent) => void;
  /** Emitting that a new 3D coordinate has been clicked upon */
  originChanged = new EventEmitter<Vector3>();
  /** Emitting that shifting the grid by pointer has to be stopped */
  stopShifting = new EventEmitter<boolean>();

  /**
   * Create the three manager for three.js operations.
   * @param infoLogger Logger for logging data to the information panel.
   */
  constructor(private infoLogger: InfoLogger) {
    this.rendererManager = new RendererManager();
    this.loadingManager = new LoadingManager();
  }

  /**
   * Initializes the necessary three.js functionality.
   * @param configuration Configuration to customize different aspects.
   */
  public init(configuration: Configuration) {
    // Set the clipping planes
    this.clipPlanes = [
      // these 2 planes are used internally for the clipping functionnality
      new Plane(new Vector3(0, 1, 0), 0),
      new Plane(new Vector3(0, -1, 0), 0),
    ];
    // Scene manager
    this.sceneManager = new SceneManager(this.ignoreList);
    // IO Managers
    this.exportManager = new ExportManager();
    this.importManager = new ImportManager(
      this.clipPlanes,
      SceneManager.EVENT_DATA_ID,
      SceneManager.GEOMETRIES_ID
    );
    // Renderer manager
    this.rendererManager.init(configuration.elementId);
    // Controls manager
    this.controlsManager = new ControlsManager(
      this.rendererManager,
      configuration.defaultView
    );
    this.controlsManager.hideTubeTracksOnZoom(
      this.sceneManager.getScene(),
      200
    );
    // Effects manager
    this.effectsManager = new EffectsManager(
      this.controlsManager.getMainCamera(),
      this.sceneManager.getScene(),
      this.rendererManager.getMainRenderer()
    );
    // Animations manager
    this.animationsManager = new AnimationsManager(
      this.sceneManager.getScene(),
      this.controlsManager.getActiveCamera(),
      this.rendererManager
    );
    // VR manager
    this.vrManager = new VRManager();
    // AR manager
    this.arManager = new ARManager(
      this.sceneManager.getScene(),
      this.controlsManager.getMainCamera() as PerspectiveCamera
    );
    // Coloring manager
    this.colorManager = new ColorManager(this.sceneManager);
    // Selection manager
    this.getSelectionManager().init(
      this.controlsManager.getMainCamera(),
      this.sceneManager.getScene(),
      this.effectsManager,
      this.infoLogger
    );
    // Set camera of the event display state
    new StateManager().setCamera(this.controlsManager.getActiveCamera());
  }

  /**
   * Sets the color of the text displayed as per dark theme.
   */
  public setDarkColor(dark: boolean) {
    this.displayColor = dark ? 'white' : 'black';
  }

  /**
   * Updates controls
   */
  public updateControls() {
    this.controlsManager.getActiveControls().update();
    this.controlsManager.updateSync();
    tweenUpdate();
  }

  /**
   * Set up the animation loop of the renderer.
   * @param uiLoop Function to run on render for UI (stats) apart from three manager operations.
   */
  public setAnimationLoop(uiLoop: () => void) {
    this.uiLoop = uiLoop;
    this.animationLoop = () => {
      this.uiLoop();
      this.updateControls();
      this.render();
    };
    this.rendererManager.getMainRenderer().setAnimationLoop(this.animationLoop);
  }

  /**
   * Stop the animation loop from running.
   */
  public stopAnimationLoop() {
    this.rendererManager.getMainRenderer().setAnimationLoop(null);
  }

  /**
   * Render overlay renderer and effect composer, and update lights.
   */
  public render() {
    this.rendererManager.render(
      this.sceneManager.getScene(),
      this.controlsManager.getOverlayCamera()
    );
    this.effectsManager.render(
      this.sceneManager.getScene(),
      this.controlsManager.getMainCamera()
    );
    this.sceneManager.updateLights(this.controlsManager.getActiveCamera());
  }

  /**
   * Minimally render without any post-processing.
   * @param xrManager Manager for XR operations.
   */
  public xrRender(xrManager: XRManager) {
    this.uiLoop();
    this.rendererManager
      .getMainRenderer()
      .render(this.sceneManager.getScene(), xrManager.getXRCamera());
    // The light directs towards origin
    this.sceneManager.updateLights(xrManager.getXRCamera());
  }

  /**
   * Get the scene manager and create if it doesn't exist.
   * @returns The scene manager for managing different aspects and elements of the scene.
   */
  public getSceneManager(): SceneManager {
    if (!this.sceneManager) {
      this.sceneManager = new SceneManager(this.ignoreList);
    }
    return this.sceneManager;
  }

  /**
   * Sets controls to auto rotate.
   * @param autoRotate If the controls are to be automatically rotated or not.
   */
  public autoRotate(autoRotate: boolean) {
    this.controlsManager.getActiveControls().autoRotate = autoRotate;
  }

  /**
   * Helper function to filter out invalid ray intersect
   */
  private filterRayIntersect() {
    if (this.stateManager == null) {
      this.stateManager = new StateManager();
    }

    if (this.isEventData == null) {
      this.isEventData = (elem) => {
        let event = false;
        elem.object.traverseAncestors((elem2) => {
          if (elem2.name == 'EventData') {
            event = true;
          }
        });
        return event;
      };
    }

    if (this.isVisible == null) {
      this.isVisible = (elem) => {
        let visible = false;
        if (this.clipPlanes.length > 0) {
          if (this.clipIntersection) {
            if (
              !this.clipPlanes.every((elem2) => {
                return elem2.distanceToPoint(elem.point) < 0;
              })
            ) {
              visible = true;
            }
          } else {
            if (
              this.clipPlanes.every((elem2) => {
                return elem2.distanceToPoint(elem.point) > 0;
              })
            ) {
              visible = true;
            }
          }
        }
        return visible;
      };
    }
  }

  /**
   * Emit originChanged emitter
   */
  public originChangedEmit(origin: Vector3) {
    this.origin = origin;
    this.originChanged.emit(origin);
  }

  /**
   * Returns the mainIntersect upon clicking a point
   */
  private getMainIntersect(event): Intersection<Object3D<Event>> {
    const camera = this.controlsManager.getMainCamera();
    const scene = this.sceneManager.getScene();
    const raycaster = new Raycaster();
    const mousePosition = new Vector2();

    mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    let mainIntersect = null;
    if (intersects.length > 0 && !this.stateManager.clippingEnabled.value) {
      for (const intersect of intersects) {
        if (
          intersect.object.name == 'gridline' ||
          intersect.object.name == 'XYZ Labels'
        ) {
          continue;
        } else {
          mainIntersect = intersect;
          break;
        }
      }
    } else {
      for (const intersect of intersects) {
        if (
          intersect.object.name == 'gridline' ||
          intersect.object.name == 'XYZ Labels'
        ) {
          continue;
        } else if (this.isEventData(intersect)) {
          mainIntersect = intersect;
          break;
        } else if (this.isVisible(intersect)) {
          mainIntersect = intersect;
          break;
        }
      }
    }
    return mainIntersect;
  }

  /**
   * Show 3D coordinates where the mouse pointer clicks
   * @param show If the coordinates are to be shown or not.
   */
  public show3DMousePoints(show: boolean, origin: Vector3) {
    // this.origin = origin;
    this.filterRayIntersect();

    if (this.show3DPointsCallback == null) {
      this.show3DPointsCallback = (event) => {
        const mainIntersect = this.getMainIntersect(event);
        if (mainIntersect != null) {
          const initialCoord = mainIntersect.point;
          const finalCoord = new Vector3();
          finalCoord.subVectors(initialCoord, this.origin);

          const app = document.getElementsByTagName('app-root')[0];

          const p = document.createElement('p');
          p.id = '3dcoordinates';
          p.innerHTML = `${mainIntersect.object.name}:\r\n\tx: ${Math.round(
            finalCoord.x
          )}\r\n\ty: ${Math.round(finalCoord.y)}\r\n\tz: ${Math.round(
            finalCoord.z
          )}`;
          p.style.whiteSpace = 'pre';
          p.style.color = this.displayColor;
          p.style.position = 'absolute';
          p.style.top = `${event.clientY + 10}px`;
          p.style.left = `${event.clientX + 10}px`;

          const div = document.createElement('div');
          div.id = 'circledDot';
          div.style.width = '1rem';
          div.style.height = '1rem';
          div.style.position = 'absolute';
          div.style.top = `calc(${event.clientY}px - 0.5rem)`;
          div.style.left = `calc(${event.clientX}px - 0.5rem)`;
          div.style.border = `2px solid ${this.displayColor}`;
          div.style.borderRadius = '0.5rem';
          div.innerHTML = `
            <div 
              style = "
                background-color: ${this.displayColor}; 
                margin-top: calc(0.3rem - 1.5px);
                margin-left: calc(0.3rem - 1.5px); 
                width: 0.4rem; 
                height: 0.4rem; 
                border-radius: 0.5rem;
              "
            ></div>`;

          app?.appendChild(p);
          app?.appendChild(div);

          setTimeout(() => {
            document.getElementById('3dcoordinates').remove();
            document.getElementById('circledDot').remove();
          }, 3000);
        }
      };
    }

    if (show) {
      window.addEventListener('click', this.show3DPointsCallback);
    } else {
      window.removeEventListener('click', this.show3DPointsCallback);
    }
  }

  /**
   * Show 3D Distance between any two clicked points
   */
  public show3DDistance(show: boolean) {
    this.prev3DCoord = null;
    this.prev2DCoord = null;
    this.prevIntersectName = null;
    this.filterRayIntersect();

    if (this.show3DDistanceCallback == null) {
      this.mousemoveCallback = this.drawLine.bind(this);
      this.show3DDistanceCallback = (event) => {
        const mainIntersect = this.getMainIntersect(event);
        if (mainIntersect != null) {
          if (this.prev3DCoord == null) {
            this.prev3DCoord = mainIntersect.point;
            this.prev2DCoord = new Vector2(event.clientX, event.clientY);
            this.prevIntersectName = mainIntersect.object.name;

            // add a new canvas to add distance
            const app = document.getElementsByTagName('app-root')[0];
            if (this.distanceCanvas == null) {
              this.distanceCanvas = document.createElement('canvas');
              this.distanceCanvas.id = '3Ddistance';
              this.distanceCanvas.width = window.innerWidth;
              this.distanceCanvas.height = window.innerHeight;
              this.distanceCanvas.style.position = 'absolute';
              this.distanceCanvas.style.bottom = '0';
            }
            app?.appendChild(this.distanceCanvas);

            const ctx = this.distanceCanvas.getContext('2d');
            ctx.strokeStyle = this.displayColor;
            ctx.lineWidth = 2;
            ctx.fillStyle = this.displayColor;
            ctx.beginPath();
            ctx.arc(this.prev2DCoord.x, this.prev2DCoord.y, 7, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.prev2DCoord.x, this.prev2DCoord.y, 3, 0, 2 * Math.PI);
            ctx.fill();

            window.addEventListener('mousemove', this.mousemoveCallback);
          } else {
            window.removeEventListener('mousemove', this.mousemoveCallback);
            const distance = mainIntersect.point.distanceTo(this.prev3DCoord);

            // draw distance line
            this.drawLine(event);
            const ctx = this.distanceCanvas.getContext('2d');
            ctx.beginPath();
            ctx.arc(event.clientX, event.clientY, 7, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(event.clientX, event.clientY, 3, 0, 2 * Math.PI);
            ctx.fill();

            // render the distance and the names of initial and final intersect
            ctx.font = '15px Arial';

            let x1 = this.prev2DCoord.x,
              x2 = event.clientX;

            const y1 = this.prev2DCoord.y,
              y2 = event.clientY;

            const x_center = (x1 + x2) / 2,
              y_center = (y1 + y2) / 2;
            const d = 25;
            const m = (x1 - x2) / (y2 - y1);
            const delta_x = d / Math.sqrt(1 + m * m);
            const delta_y = m * delta_x;
            const x3 = x_center + delta_x;
            const y3 = y_center + delta_y;

            if (this.prev2DCoord.x > event.clientX) {
              x1 = this.prev2DCoord.x + 20;
              x2 =
                event.clientX -
                ctx.measureText(mainIntersect.object.name).width -
                20;
            } else {
              x1 =
                this.prev2DCoord.x -
                ctx.measureText(this.prevIntersectName).width -
                20;
              x2 = event.clientX + 20;
            }

            ctx.fillText(this.prevIntersectName, x1, y1);
            ctx.fillText(mainIntersect.object.name, x2, y2);
            ctx.fillText(distance.toFixed(2).toString(), x3, y3);

            // remove the canvas after some time
            setTimeout(() => {
              if (document.getElementById('3Ddistance') != null) {
                document.getElementById('3Ddistance').remove();
              }
              this.distanceCanvas
                .getContext('2d')
                .clearRect(
                  0,
                  0,
                  this.distanceCanvas.width,
                  this.distanceCanvas.height
                );
            }, 3000);

            // reset the parameters for the next pair of clicked points
            this.prev3DCoord = null;
            this.prev2DCoord = null;
            this.prevIntersectName = null;
          }
        }
      };
    }

    if (show) {
      window.addEventListener('click', this.show3DDistanceCallback);
    } else {
      window.removeEventListener('click', this.show3DDistanceCallback);
      window.removeEventListener('mousemove', this.mousemoveCallback);
      if (document.getElementById('3Ddistance') != null) {
        document.getElementById('3Ddistance').remove();
      }
      if (this.distanceCanvas != null) {
        this.distanceCanvas
          .getContext('2d')
          .clearRect(
            0,
            0,
            this.distanceCanvas.width,
            this.distanceCanvas.height
          );
      }
    }
  }

  /**
   * function to dynamically draw the distance line from the prev2DCoord
   */
  private drawLine(finalPoint: MouseEvent) {
    const ctx = this.distanceCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.distanceCanvas.width, this.distanceCanvas.height);
    ctx.beginPath();
    ctx.moveTo(this.prev2DCoord.x, this.prev2DCoord.y);
    ctx.lineTo(finalPoint.clientX, finalPoint.clientY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.prev2DCoord.x, this.prev2DCoord.y, 7, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.prev2DCoord.x, this.prev2DCoord.y, 3, 0, 2 * Math.PI);
    ctx.fill();
  }

  /**
   * Shifts the cartesian grid at a clicked point
   */
  public shiftCartesianGrid(checked: boolean) {
    if (checked) {
      this.filterRayIntersect();
    }

    if (this.shiftCartesianGridCallback == null) {
      this.shiftCartesianGridCallback = (event) => {
        const mainIntersect = this.getMainIntersect(event);
        if (mainIntersect != null) {
          this.originChangedEmit(mainIntersect.point);
        }
      };
    }

    const rightClickCallback = (event) => {
      window.removeEventListener('click', this.shiftCartesianGridCallback);
      this.stopShifting.emit(true);
      window.removeEventListener('contextmenu', rightClickCallback);
    };

    if (checked) {
      window.addEventListener('click', this.shiftCartesianGridCallback);
      window.addEventListener('contextmenu', rightClickCallback);
    } else {
      window.removeEventListener('click', this.shiftCartesianGridCallback);
      window.removeEventListener('contextmenu', rightClickCallback);
    }
  }

  /**
   * Enables geometries to be clipped with clipping planes.
   * @param clippingEnabled If the the geometry clipping is to be enabled or disabled.
   */
  public setClipping(clippingEnabled: boolean) {
    this.rendererManager.setLocalClippingEnabled(clippingEnabled);
  }

  /**
   * Rotate clipping planes according to the starting and opening angles.
   * @param startingAngle The starting angle of clipping.
   * @param openingAngle The opening angle of clipping.
   */
  public setClippingAngle(startingAngle: number, openingAngle: number) {
    const startingAngleQuaternion = new Quaternion();
    startingAngleQuaternion.setFromAxisAngle(
      new Vector3(0, 0, 1),
      (startingAngle * Math.PI) / 180
    );
    this.clipPlanes[0].normal
      .set(0, -1, 0)
      .applyQuaternion(startingAngleQuaternion);
    const openingAngleQuaternion = new Quaternion();
    openingAngleQuaternion.setFromAxisAngle(
      new Vector3(0, 0, 1),
      ((startingAngle + openingAngle) * Math.PI) / 180
    );
    this.clipPlanes[1].normal
      .set(0, 1, 0)
      .applyQuaternion(openingAngleQuaternion);
    // In case the openingAngle is crossing the 180 degree boundary
    // we need to switch between intersection (< 180) and union (> 180)
    // for clipping planes. This has to be applied to all children in the tree
    const isClipIntersectionInvalid =
      (this.clipIntersection && openingAngle > 180) ||
      (!this.clipIntersection && openingAngle < 180);
    if (isClipIntersectionInvalid) {
      this.clipIntersection = openingAngle < 180;
      this.sceneManager.getGeometries().traverse((child) => {
        if (child instanceof Mesh) {
          if (child.material instanceof Material) {
            child.material.clipIntersection = this.clipIntersection;
          }
        }
      });
    }
  }

  /**
   * Animates camera transform.
   * @param cameraPosition End position.
   * @param cameraTarget End target.
   * @param duration Duration of an animation in seconds.
   */
  public animateCameraTransform(
    cameraPosition: number[],
    cameraTarget: number[],
    duration: number
  ) {
    this.animateCameraPosition(cameraPosition, duration);
    this.animateCameraTarget(cameraTarget, duration);
  }

  /**
   * Swaps cameras.
   * @param useOrthographic Whether to use orthographic or perspective camera.
   */
  public swapCameras(useOrthographic: boolean) {
    let cameraType: string;

    if (useOrthographic) {
      // perspective -> ortho
      cameraType = 'OrthographicCamera';
    } else {
      // ortho -> perspective
      cameraType = 'PerspectiveCamera';
    }

    if (this.controlsManager.getMainCamera().type !== cameraType) {
      this.controlsManager.swapControls();
    }
  }

  // *************************************
  // * Functions for loading geometries. *
  // *************************************

  /**
   * Loads an OBJ (.obj) geometry from the given filename.
   * @param filename Path to the geometry.
   * @param name Name given to the geometry.
   * @param color Color to initialize the geometry.
   * @param doubleSided Renders both sides of the material.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   * @param setFlat Whether object should be flat-shaded or not.
   * @returns Promise for loading the geometry.
   */
  public async loadOBJGeometry(
    filename: string,
    name: string,
    color: any,
    doubleSided?: boolean,
    initiallyVisible: boolean = true,
    setFlat: boolean = true
  ): Promise<GeometryUIParameters> {
    const geometries = this.sceneManager.getGeometries();
    const geometryUIParameters = await this.importManager.loadOBJGeometry(
      filename,
      name,
      color,
      doubleSided,
      setFlat
    );

    const { object } = geometryUIParameters;
    object.visible = initiallyVisible;
    geometries.add(object);

    return geometryUIParameters;
  }

  /**
   * Loads a GLTF (.gltf) scene/geometry from the given URL.
   * @param sceneUrl URL to the GLTF (.gltf) file.
   * @param name Name given to the geometry. If empty Name will be taken from the geometry itself
   * @param menuNodeName Name of the menu where to add the scene in the gui
   * @param scale Scale of the geometry.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   * @returns Promise for loading the geometry.
   */
  public async loadGLTFGeometry(
    sceneUrl: any,
    name: string,
    menuNodeName?: string,
    scale?: number,
    initiallyVisible?: boolean
  ): Promise<GeometryUIParameters[]> {
    const geometries = this.sceneManager.getGeometries();

    const allGeometriesUIParameters = await this.importManager.loadGLTFGeometry(
      sceneUrl,
      name,
      menuNodeName,
      scale,
      initiallyVisible
    );

    for (const { object } of allGeometriesUIParameters) {
      geometries.add(object);
      this.infoLogger.add(name, 'Loaded GLTF scene');
    }

    return allGeometriesUIParameters;
  }

  /**
   * Parses and loads a geometry in OBJ (.obj) format.
   * @param geometry Geometry in OBJ (.obj) format.
   * @param name Name given to the geometry.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   */
  public parseOBJGeometry(
    geometry: string,
    name: string,
    initiallyVisible: boolean = true
  ): GeometryUIParameters {
    const geometries = this.sceneManager.getGeometries();
    const object = this.importManager.parseOBJGeometry(geometry, name);
    object.visible = initiallyVisible;
    geometries.add(object);

    return { object: object };
  }

  /**
   * Parses and loads a geometry in GLTF (.gltf) format.
   * @param geometry Geometry in GLTF (.gltf) format.
   * @param name Name given to the geometry.
   * @returns Promise for loading the geometry.
   */
  public async parseGLTFGeometry(
    geometry: any,
    name: string
  ): Promise<GeometryUIParameters[]> {
    const allGeometriesUIParameters =
      await this.importManager.parseGLTFGeometry(geometry, name);

    for (const { object } of allGeometriesUIParameters) {
      this.sceneManager.getGeometries().add(object);
      this.infoLogger.add(name, 'Parsed GLTF geometry');
    }

    return allGeometriesUIParameters;
  }

  /**
   * Parses and loads a scene in Phoenix (.phnx) format.
   * @param scene Geometry in Phoenix (.phnx) format.
   * @returns Promise for loading the scene.
   */
  public async parsePhnxScene(scene: any): Promise<void> {
    const callback = (geometries: Object3D, eventData: Object3D) => {
      this.sceneManager.getScene().add(geometries);
      this.sceneManager.getScene().add(eventData);
    };

    await this.importManager.parsePhnxScene(scene, callback);
  }

  /**
   * Loads geometries from JSON.
   * @param json JSON or URL to JSON file of the geometry.
   * @param name Name of the geometry or group of geometries.
   * @param scale Scale of the geometry.
   * @param doubleSided Renders both sides of the material.
   * @param initiallyVisible Whether the geometry is initially visible or not.
   * @returns Promise for loading the geometry.
   */
  public async loadJSONGeometry(
    json: string | { [key: string]: any },
    name: string,
    scale?: number,
    doubleSided?: boolean,
    initiallyVisible: boolean = true
  ): Promise<GeometryUIParameters> {
    const geometries = this.sceneManager.getGeometries();
    const { object } = await this.importManager.loadJSONGeometry(
      json,
      name,
      scale,
      doubleSided
    );
    object.visible = initiallyVisible;
    geometries.add(object);

    return { object };
  }

  /**
   * Exports scene to OBJ file format.
   */
  public exportSceneToOBJ() {
    const scene = this.sceneManager.getCleanScene();
    this.exportManager.exportSceneToOBJ(scene);
  }

  /**
   * Exports scene as phoenix format, allowing to
   * load it later and recover the saved configuration.
   */
  public exportPhoenixScene() {
    const scene = this.sceneManager.getCleanScene();
    this.exportManager.exportPhoenixScene(
      scene,
      this.sceneManager.getEventData(),
      this.sceneManager.getGeometries()
    );
  }

  /**
   * Fixes the camera position of the overlay view.
   * @param fixed Whether the overlay view is to be fixed or not.
   */
  public fixOverlayView(fixed: boolean) {
    this.rendererManager.setFixOverlay(fixed);
  }

  /**
   * Initializes the object which will show information of the selected geometry/event data.
   * @param selectedObject Object to display the data.
   */
  public setSelectedObjectDisplay(selectedObject: {
    name: string;
    attributes: any[];
  }) {
    this.getSelectionManager().setSelectedObject(selectedObject);
  }

  /**
   * Set event data depthTest to enable or disable if event data should show on top of geometry.
   * @param value A boolean to specify if depthTest is to be enabled or disabled.
   */
  public eventDataDepthTest(value: boolean) {
    this.sceneManager.eventDataDepthTest(value);
  }

  /**
   * Toggles the ability of selecting geometries/event data by clicking on the screen.
   * @param enable Value to enable or disable the functionality.
   */
  public enableSelecting(enable: boolean) {
    this.getSelectionManager().setSelecting(enable);
  }

  /**
   * Clears event data of the scene.
   */
  public clearEventData() {
    this.sceneManager.clearEventData();
  }

  /**
   * Adds group of an event data type to the main group containing event data.
   * @param typeName Type of event data.
   * @returns Three.js group containing the type of event data.
   */
  addEventDataTypeGroup(typeName: string): Group {
    return this.sceneManager.addEventDataTypeGroup(typeName);
  }

  /**
   * Sets the renderer to be used to render the event display on the overlayed canvas.
   * @param overlayCanvas An HTML canvas on which the overlay renderer is to be set.
   */
  public setOverlayRenderer(overlayCanvas: HTMLCanvasElement) {
    if (this.rendererManager) {
      this.rendererManager.setOverlayRenderer(overlayCanvas);
    }
  }

  /**
   * Zoom all the cameras by a specific zoom factor.
   * The factor may either be greater (zoom in) or smaller (zoom out) than 1.
   * @param zoomFactor The factor to zoom by.
   * @param zoomTime The time it takes for a zoom animation to complete.
   */
  public zoomTo(zoomFactor: number, zoomTime: number) {
    this.controlsManager.zoomTo(zoomFactor, zoomTime);
  }

  // ********************************
  // * Private auxiliary functions. *
  // ********************************

  /**
   * Get the selection manager.
   * @returns Selection manager responsible for managing selection of 3D objects.
   */
  private getSelectionManager(): SelectionManager {
    if (!this.selectionManager) {
      this.selectionManager = new SelectionManager();
    }
    return this.selectionManager;
  }

  /**
   * Animates camera position.
   * @param cameraPosition End position.
   * @param duration Duration of an animation in seconds.
   */
  private animateCameraPosition(cameraPosition: number[], duration: number) {
    const posAnimation = new Tween(
      this.controlsManager.getActiveCamera().position
    );
    posAnimation.to(
      {
        x: cameraPosition[0],
        y: cameraPosition[1],
        z: cameraPosition[2],
      },
      duration
    );
    posAnimation.start();
  }

  /**
   * Animates camera target.
   * @param cameraTarget End target.
   * @param duration Duration of an animation in seconds.
   */
  private animateCameraTarget(cameraTarget: number[], duration: number) {
    const rotAnimation = new Tween(
      this.controlsManager.getActiveControls().target
    );
    rotAnimation.to(
      {
        x: cameraTarget[0],
        y: cameraTarget[1],
        z: cameraTarget[2],
      },
      duration
    );
    rotAnimation.start();
  }

  /**
   * Get the uuid of the currently selected object.
   * @returns uuid of the currently selected object.
   */
  public getActiveObjectId(): ActiveVariable<string> {
    return this.getSelectionManager().getActiveObjectId();
  }

  /**
   * Move the camera to look at the object with the given uuid.
   * @param uuid uuid of the object.
   * @param detector whether the function is for detector objects or event data
   */
  public lookAtObject(uuid: string, detector: boolean = false) {
    if (detector == true) {
      this.controlsManager.lookAtObject(
        uuid,
        this.getSceneManager().getGeometries()
      );
    } else {
      this.controlsManager.lookAtObject(
        uuid,
        this.getSceneManager().getEventData()
      );
    }
  }

  /**
   * Get position of object from UUID.
   * @param uuid UUID of the object.
   * @returns Position of the 3D object.
   */
  public getObjectPosition(uuid: string): Vector3 {
    return this.controlsManager.getObjectPosition(
      uuid,
      this.getSceneManager().getScene()
    );
  }

  /**
   * Highlight the object with the given uuid by giving it an outline.
   * @param uuid uuid of the object.
   * @param detector whether the function is for detector objects or event data
   */
  public highlightObject(uuid: string, detector: boolean = false) {
    if (detector == true) {
      this.selectionManager.highlightObject(
        uuid,
        this.getSceneManager().getGeometries()
      );
    } else {
      this.selectionManager.highlightObject(
        uuid,
        this.getSceneManager().getEventData()
      );
    }
  }

  /**
   * Enable keyboard controls for some Three service operations.
   */
  public enableKeyboardControls() {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const isTyping = ['input', 'textarea'].includes(
        (e.target as HTMLElement)?.tagName.toLowerCase()
      );

      if (!isTyping && e.shiftKey) {
        switch (e.code) {
          case 'KeyR': // shift + "r"
            this.autoRotate(
              !this.controlsManager.getActiveControls().autoRotate
            );
            break;
          case 'Equal': // shift + "+"
            this.zoomTo(1 / 1.2, 100);
            break;
          case 'Minus': // shift + "-"
            this.zoomTo(1.2, 100);
            break;
          case 'KeyC': // shift + "c"
            this.setClipping(!this.rendererManager.getLocalClipping());
            if (this.rendererManager.getLocalClipping()) {
              this.setClippingAngle(0, 180);
            }
            break;
          case 'KeyV': {
            // shift + "v"
            const isOrthographicView =
              this.controlsManager.getMainCamera().type ===
              'OrthographicCamera';
            this.swapCameras(!isOrthographicView);
            break;
          }
        }
      }
    });
  }

  /**
   * Animate the camera through the event scene.
   * @param startPos Start position of the translation animation.
   * @param tweenDuration Duration of each tween in the translation animation.
   * @param onAnimationEnd Callback when the last animation ends.
   */
  public animateThroughEvent(
    startPos: number[],
    tweenDuration: number,
    onAnimationEnd?: () => void
  ) {
    this.animationsManager.animateThroughEvent(
      startPos,
      tweenDuration,
      onAnimationEnd
    );
  }

  /**
   * Animate scene by animating camera through the scene and animating event collision.
   * @param animationPreset Preset for animation including positions to go through and
   * event collision animation options.
   * @param onEnd Function to call when the animation ends.
   */
  public animatePreset(animationPreset: AnimationPreset, onEnd?: () => void) {
    this.animationsManager.animatePreset(animationPreset, onEnd);
  }

  /**
   * Animate the propagation and generation of event data with particle collison.
   * @param tweenDuration Duration of the animation tween.
   * @param onEnd Function to call when all animations have ended.
   */
  public animateEventWithCollision(tweenDuration: number, onEnd?: () => void) {
    this.animationsManager.animateEventWithCollision(tweenDuration, onEnd);
  }

  /**
   * Animate the propagation and generation of event data
   * using clipping planes after particle collison.
   * @param tweenDuration Duration of the animation tween.
   * @param onEnd Function to call when all animations have ended.
   */
  public animateClippingWithCollision(
    tweenDuration: number,
    onEnd?: () => void
  ) {
    this.animationsManager.animateClippingWithCollision(tweenDuration, onEnd);
  }

  /** Saves a blob */
  saveBlob = (function () {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    return function saveData(blob, fileName) {
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = fileName;
      a.click();
    };
  })();

  /**
   * Takes a screen shot of the current view
   * @param width the width of the picture to be created
   * @param height the height of the picture to be created
   * @param fitting the type of fitting to use in case width and height
   * ratio do not match the current screen ratio. Posible values are
   *    - Crop : current view is cropped on both side or up and done to fit ratio
   *             thus it is not streched, but some parts are lost
   *    - Strech : current view is streched to given format
   *               this is the default and used also for any other value given to fitting
   */
  public makeScreenShot(
    width: number,
    height: number,
    fitting: string = 'Strech'
  ) {
    // compute actual size of screen shot, based on current view and reuested size
    const mainRenderer = this.rendererManager.getMainRenderer();
    const originalSize = new Vector2();
    mainRenderer.getSize(originalSize);
    let scaledHeight = height;
    let scaledWidth = width;
    if (fitting == 'Crop') {
      // Massage width and height so that we keep the screen ratio
      // and thus the image from the screen is not streched
      if (originalSize.width * height < originalSize.height * width) {
        scaledHeight = (originalSize.height * width) / originalSize.width;
      } else {
        scaledWidth = (originalSize.width * height) / originalSize.height;
      }
    }
    const heightShift = (scaledHeight - height) / 2;
    const widthShift = (scaledWidth - width) / 2;

    // get background color to be used
    const bkgColor = getComputedStyle(document.body).getPropertyValue(
      '--phoenix-background-color'
    );

    // Deal with devices having special devicePixelRatio (retina screens in particular)
    const scale = window.devicePixelRatio;

    // grab output canvas on which we will draw, and set size
    const outputCanvas = document.getElementById(
      'screenshotCanvas'
    ) as HTMLCanvasElement;
    outputCanvas.width = width;
    outputCanvas.height = height;
    outputCanvas.style.width = (width / scale).toString() + 'px';
    outputCanvas.style.height = (height / scale).toString() + 'px';
    const ctx = outputCanvas.getContext('2d');
    ctx.fillStyle = bkgColor;
    ctx.fillRect(0, 0, width, height);
    // draw main image on our output canvas, with right size
    mainRenderer.setSize(scaledWidth / scale, scaledHeight / scale, false);
    this.render();
    ctx.drawImage(
      mainRenderer.domElement,
      widthShift,
      heightShift,
      width,
      height,
      0,
      0,
      width,
      height
    );
    mainRenderer.setSize(originalSize.width, originalSize.height, false);
    this.render();

    // Get info panel
    const infoPanel = document.getElementById('experimentInfo');
    if (infoPanel != null) {
      // Compute size of info panel on final picture
      const infoHeight =
        (infoPanel.clientHeight * scaledHeight) / originalSize.height;
      const infoWidth =
        (infoPanel.clientWidth * scaledWidth) / originalSize.width;

      // Add info panel to output. This is HTML, so first convert it to canvas,
      // and then draw to our output canvas
      html2canvas(infoPanel, {
        backgroundColor: bkgColor,
        // avoid cloning canvas in the main page, this is useless and leads to
        // warnings in the javascript console similar to this :
        // "Unable to clone WebGL context as it has preserveDrawingBuffer=false"
        ignoreElements: (element: Element) => element.tagName == 'CANVAS',
      }).then((canvas) => {
        canvas.toBlob((blob) => {
          ctx.drawImage(
            canvas,
            infoHeight / 6,
            infoHeight / 6,
            infoWidth,
            infoHeight
          );
          // Finally save to png file
          outputCanvas.toBlob((blob) => {
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style.display = 'none';
            const url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = `screencapture.png`;
            a.click();
          });
        });
      });
    }
  }

  /**
   * Initialize the VR session.
   * @param xrSessionType Type of the XR session. Either AR or VR.
   * @param onSessionEnded Callback when the VR session ends.
   */
  public initXRSession(
    xrSessionType: XRSessionType,
    onSessionEnded?: () => void
  ) {
    const xrManager =
      xrSessionType === XRSessionType.VR ? this.vrManager : this.arManager;

    // Set up main renderer for VR
    const mainRenderer = this.rendererManager.getMainRenderer();
    mainRenderer.xr.enabled = true;
    // Set the VR animation loop
    mainRenderer.xr.setAnimationLoop(this.xrRender.bind(this, xrManager));

    const onXRSessionStarted = () => {
      // Set up the camera position in the XR - Adding a group with camera does it
      // The XR camera is only available AFTER the session starts
      // For why we can't just move the camera directly, see e.g.
      // https://stackoverflow.com/questions/34470248/unable-to-change-camera-position-when-using-vrcontrols/34471170#34471170
      const cameraGroup = xrManager.getCameraGroup(
        this.controlsManager.getMainCamera()
      );
      this.sceneManager.getScene().add(cameraGroup);
    };

    // Set and initialize the VR session
    xrManager.setXRSession(mainRenderer, onXRSessionStarted, onSessionEnded);
  }

  /**
   * End the current VR session.
   * @param xrSessionType Type of the XR session. Either AR or VR.
   */
  public endXRSession(xrSessionType: XRSessionType) {
    const xrManager =
      xrSessionType === XRSessionType.VR ? this.vrManager : this.arManager;

    this.sceneManager.getScene().remove(xrManager.getCameraGroup());
    const mainRenderer = this.rendererManager.getMainRenderer();
    mainRenderer.xr.setAnimationLoop(null);
    mainRenderer.xr.enabled = false;

    xrManager.endXRSession();
  }

  /**
   * Get an object from the scene by name.
   * @param objectName Name of the object in scene.
   */
  public getObjectByName(objectName: string): Object3D {
    return this.getSceneManager().getScene().getObjectByName(objectName);
  }

  /**
   * Set the antialiasing.
   * @param antialias Whether antialiasing is to enabled or disabled.
   */
  public setAntialiasing(antialias: boolean) {
    this.effectsManager.setAntialiasing(antialias);
  }

  /** Add parametrised geometry to the scene.
   * @param parameters The name, dimensions, and radial values for this cylindrical volume.
   */
  public addGeometryFromParameters(parameters: any): void {
    this.loadingManager.addLoadableItem('geom_from_params');

    const scene = this.getSceneManager().getScene();
    const moduleName = parameters.ModuleName;
    const moduleXdim = parameters.Xdim;
    const moduleYdim = parameters.Ydim;
    const moduleZdim = parameters.Zdim;
    const numPhiEl = parameters.NumPhiEl;
    const numZEl = parameters.NumZEl;
    const radius = parameters.Radius;

    const minZ = parameters.MinZ;
    const maxZ = parameters.MaxZ;
    const tiltAngle = parameters.TiltAngle;
    const ztiltAngle = parameters.ZTiltAngle;
    const phiOffset = parameters.PhiOffset;
    const colour = parameters.Colour;
    const edgecolour = parameters.EdgeColour;
    // Make the geometry and material
    const geometry = new BoxGeometry(moduleXdim, moduleYdim, moduleZdim);
    const material = new MeshBasicMaterial({
      color: colour,
      opacity: 0.5,
      transparent: true,
    });

    const zstep = (maxZ - minZ) / numZEl;
    const phistep = (2 * Math.PI) / numPhiEl;

    let z = minZ + zstep / 2;

    const halfPi = Math.PI / 2.0;
    let modulecentre;
    for (let elZ = 0; elZ < numZEl; elZ++) {
      let phi = phiOffset;
      for (let elPhi = 0; elPhi < numPhiEl; elPhi++) {
        phi += phistep;
        modulecentre = new Vector3(
          radius * Math.cos(phi),
          radius * Math.sin(phi),
          z
        );
        const cube = new Mesh(geometry.clone(), material);

        cube.matrix.makeRotationFromEuler(
          new Euler(ztiltAngle, 0.0, halfPi + phi + tiltAngle)
        );
        cube.matrix.setPosition(modulecentre);
        cube.matrixAutoUpdate = false;
        scene.add(cube);

        // var egh = new EdgesHelper(cube, edgecolour);
        // egh.material.linewidth = 2;
        // scene.add(egh);
      }
      z += zstep;
    }

    this.loadingManager.itemLoaded('geom_from_params');
  }

  /**
   * Add a 3D text label to label an event data object.
   * @param label Label to add to the event object.
   * @param uuid UUID of the three.js object.
   * @param labelId Unique ID of the label.
   */
  public addLabelToObject(label: string, uuid: string, labelId: string) {
    const cameraControls = this.controlsManager.getActiveControls();
    const objectPosition = this.getObjectPosition(uuid);
    this.getSceneManager().addLabelToObject(
      label,
      uuid,
      labelId,
      objectPosition,
      cameraControls
    );
  }

  /**
   * Get the coloring manager.
   * @returns The coloring manager for managing coloring related three.js operations.
   */
  public getColorManager() {
    return this.colorManager;
  }
}
