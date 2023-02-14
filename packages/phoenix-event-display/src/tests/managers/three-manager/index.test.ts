/**
 * @jest-environment jsdom
 */
import { PresetView } from '../../../lib/models/preset-view.model';
import { Configuration } from '../../../lib/types/configuration';
import { InfoLogger } from '../../../helpers/info-logger';
import { ThreeManager } from '../../../managers/three-manager';
import { AnimationPreset } from '../../../../dist/managers/three-manager/animations-manager';
import {
  XRManager,
  XRSessionType,
} from '../../../managers/three-manager/xr/xr-manager';
import { Object3D } from 'three';
import { SceneManager } from '../../../managers/three-manager/scene-manager';

jest.mock('../../../managers/three-manager/renderer-manager', () => {
  return {
    RendererManager: jest.fn().mockReturnValue({
      init: jest.fn(),
      render: jest.fn(),
      getMainRenderer: jest.fn().mockReturnThis(),
      xr: jest.fn().mockReturnThis(),
      setAnimationLoop: jest.fn(),
      domElement: document.createElement('div'),
      getSize: jest.fn().mockReturnValue({ width: 100, height: 100 }),
      getPixelRatio: jest.fn(),
      setLocalClippingEnabled: jest.fn().mockImplementation((value) => value),
      setFixOverlay: jest.fn().mockImplementation((value) => value),
      setOverlayRenderer: jest.fn(),
    }),
  };
});

describe('ThreeManager', () => {
  let manager: ThreeManager;

  beforeEach(() => {
    manager = new ThreeManager(new InfoLogger());

    const configuration: Configuration = {
      presetViews: [
        new PresetView('Left View', [0, 0, -12000], [0, 0, 0], 'left-cube'),
        new PresetView('Center View', [-500, 12000, 0], [0, 0, 0], 'top-cube'),
        new PresetView('Right View', [0, 0, 12000], [0, 0, 0], 'right-cube'),
      ],
      defaultView: [4000, 0, 4000, 0, 0, 0],
    };

    manager.init(configuration);
  });

  it('should create an instance', () => {
    expect(manager).toBeTruthy();
  });

  it('should initialize the necessary three.js functionality', () => {
    expect(manager['clipPlanes']).toHaveLength(2);
    expect(manager['sceneManager']).toBeTruthy();
    expect(manager['exportManager']).toBeTruthy();
    expect(manager['importManager']).toBeTruthy();
    expect(manager['animationsManager']).toBeTruthy();
  });

  it('should update the controls', () => {
    jest.spyOn(manager['controlsManager'], 'getActiveControls');
    jest.spyOn(manager['controlsManager'], 'updateSync');

    manager.updateControls();

    expect(manager['controlsManager'].getActiveControls).toHaveBeenCalled();
    expect(manager['controlsManager'].updateSync).toHaveBeenCalled();
  });

  it('should set up the animation loop of the renderer', () => {
    const fn = () => {};
    jest.spyOn(manager['rendererManager'], 'getMainRenderer');

    manager.setAnimationLoop(fn);

    expect(manager['rendererManager'].getMainRenderer).toHaveBeenCalled();
    expect(manager['uiLoop']).toBe(fn);
  });

  it('should stop the animation loop from running', () => {
    jest.spyOn(manager['rendererManager'], 'getMainRenderer');

    manager.stopAnimationLoop();

    expect(manager['rendererManager'].getMainRenderer).toHaveBeenCalled();
    expect(manager['uiLoop']).toBeUndefined();
  });

  it('should render overlay renderer and effect composer, and update lights', () => {
    jest.spyOn(manager['rendererManager'], 'render');
    jest.spyOn(manager['effectsManager'], 'render');
    jest.spyOn(manager['sceneManager'], 'updateLights');

    manager.render();

    expect(manager['rendererManager'].render).toHaveBeenCalled();
    expect(manager['effectsManager'].render).toHaveBeenCalled();
    expect(manager['sceneManager'].updateLights).toHaveBeenCalled();
  });

  it('should minimally render without any post-processing', () => {
    const xrManager = new XRManager(XRSessionType.AR);
    jest.spyOn(manager['rendererManager'], 'render');
    manager['sceneManager'].updateLights = jest.fn();
    manager['uiLoop'] = jest.fn();

    manager.xrRender(xrManager);

    expect(manager['rendererManager'].render).toHaveBeenCalled();
    expect(manager['sceneManager'].updateLights).toHaveBeenCalled();
  });

  it("should get the scene manager and create if it doesn't exist", () => {
    const sceneManager = manager.getSceneManager();
    expect(sceneManager).toBeTruthy();

    manager['sceneManager'] = undefined;
    const sceneManager2 = manager.getSceneManager();
    expect(sceneManager2).toBeTruthy();
  });

  it('should set controls to auto rotate', () => {
    manager['controlsManager'].getActiveControls().autoRotate = false;

    manager.autoRotate(true);
    expect(manager['controlsManager'].getActiveControls().autoRotate).toBe(
      true
    );

    manager.autoRotate(false);
    expect(manager['controlsManager'].getActiveControls().autoRotate).toBe(
      false
    );
  });

  it('should enable geometries to be clipped with clipping planes', () => {
    jest.spyOn(manager['rendererManager'], 'setLocalClippingEnabled');

    manager.setClipping(true);
    expect(
      manager['rendererManager'].setLocalClippingEnabled
    ).toHaveBeenCalledWith(true);

    manager.setClipping(false);
    expect(
      manager['rendererManager'].setLocalClippingEnabled
    ).toHaveBeenCalledWith(false);
  });

  it('should rotate clipping planes according to the starting and opening angles', () => {
    manager.setClippingAngle(0, 90);

    expect(manager['clipPlanes'][0].normal.x).toBe(0);
    expect(manager['clipPlanes'][0].normal.y).toBe(-1);
    expect(manager['clipPlanes'][0].normal.z).toBe(0);

    expect(manager['clipPlanes'][1].normal.x).toBe(-1);
    expect(manager['clipPlanes'][1].normal.y).toBeCloseTo(
      2.220446049250313e-16
    );
    expect(manager['clipPlanes'][1].normal.z).toBe(0);
  });

  it('should animate the camera transform', () => {
    const cameraPosition = [0, 0, 0];
    const cameraTarget = [0, 0, 0];
    const duration = 1000;

    manager['animateCameraPosition'] = jest.fn();
    manager['animateCameraTarget'] = jest.fn();

    manager.animateCameraTransform(cameraPosition, cameraTarget, duration);

    expect(manager['animateCameraPosition']).toHaveBeenCalledWith(
      cameraPosition,
      duration
    );
    expect(manager['animateCameraTarget']).toHaveBeenCalledWith(
      cameraTarget,
      duration
    );
  });

  it('should swap cameras', () => {
    manager.swapCameras(true);
    expect(manager['controlsManager'].getMainCamera().type).toBe(
      'OrthographicCamera'
    );

    manager.swapCameras(false);
    expect(manager['controlsManager'].getMainCamera().type).toBe(
      'PerspectiveCamera'
    );
  });

  it('should export scene to OBJ file format', () => {
    jest.spyOn(manager['exportManager'], 'exportSceneToOBJ');
    URL.createObjectURL = jest.fn();

    manager.exportSceneToOBJ();

    expect(manager['exportManager'].exportSceneToOBJ).toHaveBeenCalled();
  });

  it('should export scene as phoenix format', () => {
    jest.spyOn(manager['exportManager'], 'exportPhoenixScene');

    manager.exportPhoenixScene();

    expect(manager['exportManager'].exportPhoenixScene).toHaveBeenCalled();
  });

  it('should fix the camera position of the overlay view', () => {
    jest.spyOn(manager['rendererManager'], 'setFixOverlay');

    manager.fixOverlayView(true);
    expect(manager['rendererManager'].setFixOverlay).toHaveBeenCalledWith(true);

    manager.fixOverlayView(false);
    expect(manager['rendererManager'].setFixOverlay).toHaveBeenCalledWith(
      false
    );
  });

  it('should initialize the object which will show information of the selected geometry/event data', () => {
    const selectedObject = {
      name: 'test',
      attributes: [1, 2, 3],
    };
    manager['getSelectionManager'] = jest.fn().mockReturnValue({
      setSelectedObject: jest.fn().mockReturnValue(selectedObject),
    } as any);

    manager.setSelectedObjectDisplay(selectedObject);

    expect(manager['getSelectionManager']).toHaveBeenCalled();
  });

  it('should set event data depthTest to enable or disable if event data should show on top of geometry', () => {
    jest.spyOn(manager['sceneManager'], 'eventDataDepthTest');

    manager.eventDataDepthTest(true);
    expect(manager['sceneManager'].eventDataDepthTest).toHaveBeenCalledWith(
      true
    );

    manager.eventDataDepthTest(false);
    expect(manager['sceneManager'].eventDataDepthTest).toHaveBeenCalledWith(
      false
    );
  });

  it('should toggle the ability of selecting geometries/event data by clicking on the screen', () => {
    manager['getSelectionManager'] = jest.fn().mockReturnValue({
      setSelecting: jest.fn(),
    } as any);

    manager.enableSelecting(true);
    manager.enableSelecting(false);

    expect(manager['getSelectionManager']).toHaveBeenCalledTimes(2);
  });

  it('should clear event data of the scene', () => {
    manager['sceneManager'] = {
      clearEventData: jest.fn(),
    } as any;

    manager.clearEventData();

    expect(manager['sceneManager'].clearEventData).toHaveBeenCalled();
  });

  it('should add group of an event data type to the main group containing event data', () => {
    const group = manager.addEventDataTypeGroup('test');

    expect(group.name).toBe('test');
    expect(group.type).toBe('Group');
  });

  it('should set the renderer to be used to render the event display on the overlayed canvas', () => {
    const overlayCanvas = document.createElement('canvas');
    jest.spyOn(manager['rendererManager'], 'setOverlayRenderer');

    manager.setOverlayRenderer(overlayCanvas);

    expect(manager['rendererManager'].setOverlayRenderer).toHaveBeenCalledWith(
      overlayCanvas
    );
  });

  it('should zoom all the cameras by a specific zoom factor', () => {
    const zoomFactor = 1.5;
    const zoomTime = 1000;

    jest.spyOn(manager['controlsManager'], 'zoomTo');

    manager.zoomTo(zoomFactor, zoomTime);

    expect(manager['controlsManager'].zoomTo).toHaveBeenCalledWith(
      zoomFactor,
      zoomTime
    );
  });

  it('should get the uuid of the currently selected object', () => {
    const activeObjectId = manager.getActiveObjectId();

    expect(activeObjectId).toBe(
      manager['getSelectionManager']().getActiveObjectId()
    );
  });

  it('should move the camera to look at the object with the given uuid', () => {
    jest.spyOn(manager['controlsManager'], 'lookAtObject');

    manager.lookAtObject('test');

    expect(manager['controlsManager'].lookAtObject).toHaveBeenCalledWith(
      'test',
      manager['sceneManager'].getEventData()
    );
  });

  it('should get position of object from UUID', () => {
    const position = manager.getObjectPosition('test');

    expect(position).toBe(
      manager['controlsManager'].getObjectPosition(
        'test',
        manager['getSceneManager']().getScene()
      )
    );
  });

  it('should highlight the object with the given uuid by giving it an outline', () => {
    jest.spyOn(manager['selectionManager'], 'highlightObject');

    manager.highlightObject('test');

    expect(manager['selectionManager'].highlightObject).toHaveBeenCalledWith(
      'test',
      manager['sceneManager'].getEventData()
    );
  });

  it('should enable keyboard controls for some Three service operations', () => {
    jest.spyOn(document, 'addEventListener');
    manager.enableKeyboardControls();
    expect(document.addEventListener).toHaveBeenCalled();
  });

  it('should animate the camera through the event scene', () => {
    const startPos = [1, 2, 3];
    const tweenDuration = 1000;
    const onAnimationEnd = jest.fn();
    jest.spyOn(manager['animationsManager'], 'animateThroughEvent');

    manager.animateThroughEvent(startPos, tweenDuration, onAnimationEnd);

    expect(
      manager['animationsManager'].animateThroughEvent
    ).toHaveBeenCalledWith(startPos, tweenDuration, onAnimationEnd);
  });

  it('should animate scene by animating camera through the scene and animating event collision', () => {
    const animationPreset: AnimationPreset = {
      positions: [
        {
          position: [0, 0, 0],
          duration: 0,
        },
        {
          position: [0, 0, 0],
          duration: 0,
        },
      ],
      animateEventAfterInterval: 1,
      collisionDuration: 1,
    };
    const onEnd = jest.fn();

    manager['animationsManager'].animatePreset = jest.fn();

    manager.animatePreset(animationPreset, onEnd);

    expect(manager['animationsManager'].animatePreset).toHaveBeenCalledWith(
      animationPreset,
      onEnd
    );
  });

  it('should animate the propagation and generation of event data with particle collison', () => {
    const tweenDuration = 1000;
    const onEnd = jest.fn();
    manager['animationsManager'].animateEventWithCollision = jest.fn();

    manager.animateEventWithCollision(tweenDuration, onEnd);

    expect(
      manager['animationsManager'].animateEventWithCollision
    ).toHaveBeenCalledWith(tweenDuration, onEnd);
  });

  it('should animate the propagation and generation of event data', () => {
    const tweenDuration = 1000;
    const onEnd = jest.fn();
    manager['animationsManager'].animateClippingWithCollision = jest.fn();

    manager.animateClippingWithCollision(tweenDuration, onEnd);

    expect(
      manager['animationsManager'].animateClippingWithCollision
    ).toHaveBeenCalledWith(tweenDuration, onEnd);
  });

  it('should get an object from the scene by name', () => {
    const object = manager.getObjectByName('test');

    expect(object).toBe(
      manager['sceneManager'].getScene().getObjectByName('test')
    );
  });

  it('should set the antialiasing', () => {
    jest.spyOn(manager['effectsManager'], 'setAntialiasing');

    manager.setAntialiasing(true);
    expect(manager['effectsManager'].setAntialiasing).toHaveBeenCalledWith(
      true
    );

    manager.setAntialiasing(false);
    expect(manager['effectsManager'].setAntialiasing).toHaveBeenCalledWith(
      false
    );
  });

  it('should add parametrised geometry to the scene', () => {
    jest.spyOn(manager['loadingManager'], 'addLoadableItem');
    jest.spyOn(manager['loadingManager'], 'itemLoaded');

    manager.addGeometryFromParameters({});

    expect(manager['loadingManager'].addLoadableItem).toHaveBeenCalled();
    expect(manager['loadingManager'].itemLoaded).toHaveBeenCalled();
  });

  it('should get the coloring manager', () => {
    expect(manager['getColorManager']()).toBe(manager['colorManager']);
  });
});
