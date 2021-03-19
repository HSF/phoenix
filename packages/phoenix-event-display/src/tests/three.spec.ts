import { ThreeManager } from '../three';
import { InfoLogger } from '../info-logger';
import { Group } from 'three';
import * as Helpers from '../helpers/file';

describe('ThreeManager', () => {
  let three: ThreeManager;

  beforeEach(() => {
    three = new ThreeManager(new InfoLogger());
  });

  it('should be created', () => {
    expect(three).toBeTruthy();
  });

  describe('after init', () => {
    let threePrivate: any;

    beforeEach(() => {
      three.init({});

      threePrivate = three as any;
    });

    it('should initialize three service with managers', () => {
      expect(threePrivate.sceneManager).toBeDefined();
      expect(threePrivate.exportManager).toBeDefined();
      expect(threePrivate.importManager).toBeDefined();
      expect(threePrivate.rendererManager).toBeDefined();
      expect(threePrivate.effectsManager).toBeDefined();
      expect(threePrivate.animationsManager).toBeDefined();
      expect(threePrivate.vrManager).toBeDefined();
      expect(threePrivate.selectionManager).toBeDefined();
      expect(threePrivate.infoLogger).toBeDefined();
    });

    it('should update controls', () => {
      spyOn(threePrivate.controlsManager, 'updateSync').and.callThrough();
      three.updateControls();
      expect(threePrivate.controlsManager.updateSync).toHaveBeenCalled();
    });

    it('should render', () => {
      spyOn(threePrivate.rendererManager, 'render').and.callThrough();
      spyOn(threePrivate.effectsManager, 'render').and.callThrough();
      three.render();
      expect(threePrivate.rendererManager.render).toHaveBeenCalled();
      expect(threePrivate.effectsManager.render).toHaveBeenCalled();
    });

    it('get scene manager', () => {
      expect(three.getSceneManager()).toBe(threePrivate.sceneManager);
      threePrivate.sceneManager = undefined;
      expect(three.getSceneManager()).toBeDefined();
    });

    it('should toggle autorotate', () => {
      three.autoRotate(true);
      expect(threePrivate.controlsManager.getActiveControls().autoRotate).toBe(
        true
      );
    });

    it('should set clipping', () => {
      three.setClipping(true);
      expect(
        threePrivate.rendererManager.renderers[0].localClippingEnabled
      ).toBe(true);
    });

    it('should rotate clipping', () => {
      three.rotateClipping(90);
      expect(threePrivate.clipPlanes[0]).toBeDefined();
    });

    it('should animate camera transform', () => {
      spyOn(threePrivate, 'animateCameraPosition').and.callThrough();
      spyOn(threePrivate, 'animateCameraTarget').and.callThrough();

      const camPos = [10, 10, 10];
      const camTarget = [20, 20, 20];
      const animationDuration = 3000;

      three.animateCameraTransform(camPos, camTarget, animationDuration);
      expect(threePrivate.animateCameraPosition).toHaveBeenCalledWith(
        camPos,
        animationDuration
      );
      expect(threePrivate.animateCameraTarget).toHaveBeenCalledWith(
        camTarget,
        animationDuration
      );
    });

    it('should swap cameras', () => {
      const swapControlsSpy = spyOn(
        threePrivate.controlsManager,
        'swapControls'
      ).and.callThrough();

      three.swapCameras(true);
      three.swapCameras(false);
      expect(threePrivate.controlsManager.swapControls).toHaveBeenCalledTimes(
        2
      );

      swapControlsSpy.calls.reset();
      three.swapCameras(false);
      expect(threePrivate.controlsManager.swapControls).toHaveBeenCalledTimes(
        0
      );
    });

    const OBJ_FILE = 'assets/geometries/test.obj';
    const GLTF_FILE = 'assets/geometries/test.gltf';

    it('should load OBJ geometry', () => {
      spyOn(threePrivate.importManager, 'loadOBJGeometry').and.callThrough();

      three.loadOBJGeometry(OBJ_FILE, 'Test OBJ', 0xffffff, true);
      expect(threePrivate.importManager.loadOBJGeometry).toHaveBeenCalled();
    });

    it('should load glTF geometry', () => {
      spyOn(threePrivate.importManager, 'loadGLTFGeometry').and.callThrough();

      three.loadGLTFGeometry(GLTF_FILE, 'Test glTF', 1);
      expect(threePrivate.importManager.loadGLTFGeometry).toHaveBeenCalled();
    });

    it('should parse OBJ geometry', async (done) => {
      (await fetch(OBJ_FILE)).text().then((res) => {
        spyOn(threePrivate.importManager, 'parseOBJGeometry').and.callThrough();

        three.parseOBJGeometry(res, 'Test OBJ');
        expect(threePrivate.importManager.parseOBJGeometry).toHaveBeenCalled();
        done();
      });
    });

    it('should parse glTF geometry', async (done) => {
      (await fetch(GLTF_FILE)).arrayBuffer().then((res) => {
        spyOn(
          threePrivate.importManager,
          'parseGLTFGeometry'
        ).and.callThrough();

        three.parseGLTFGeometry(res, 'TEST_GLTF_FILE');
        expect(threePrivate.importManager.parseGLTFGeometry).toHaveBeenCalled();
        done();
      });
    });

    it('should load JSON geometry', async (done) => {
      spyOn(threePrivate.importManager, 'loadJSONGeometry').and.callThrough();

      (await fetch(OBJ_FILE)).text().then((res) => {
        const geometry = threePrivate.importManager.parseOBJGeometry(
          res,
          'Test JSON'
        );

        three.loadJSONGeometry(geometry.toJSON(), 'Test JSON', 1, true);
        expect(threePrivate.importManager.loadJSONGeometry).toHaveBeenCalled();
        done();
      });
    });

    it('should export scene', () => {
      spyOn(Helpers, 'saveFile').and.stub();

      spyOn(threePrivate.exportManager, 'exportSceneToOBJ').and.callThrough();
      three.exportSceneToOBJ();
      expect(threePrivate.exportManager.exportSceneToOBJ).toHaveBeenCalled();

      spyOn(threePrivate.exportManager, 'exportPhoenixScene').and.callThrough();
      three.exportPhoenixScene();
      expect(threePrivate.exportManager.exportPhoenixScene).toHaveBeenCalled();
    });

    it('should fix overlay view', () => {
      spyOn(threePrivate.rendererManager, 'setFixOverlay').and.callThrough();

      three.fixOverlayView(true);
      expect(threePrivate.rendererManager.setFixOverlay).toHaveBeenCalledWith(
        true
      );
    });

    it('should set selected object', () => {
      spyOn(
        threePrivate.getSelectionManager(),
        'setSelectedObject'
      ).and.callThrough();

      three.setSelectedObjectDisplay({
        name: 'Test Object',
        attributes: ['Attrib 1'],
      });
      expect(
        threePrivate.getSelectionManager().setSelectedObject
      ).toHaveBeenCalled();
    });

    it('should toggle event data depthTest', () => {
      spyOn(threePrivate.sceneManager, 'eventDataDepthTest').and.callThrough();

      three.eventDataDepthTest(true);
      expect(threePrivate.sceneManager.eventDataDepthTest).toHaveBeenCalledWith(
        true
      );
    });

    it('should enable selecting', () => {
      spyOn(
        threePrivate.getSelectionManager(),
        'setSelecting'
      ).and.callThrough();

      three.enableSelecting(true);
      expect(
        threePrivate.getSelectionManager().setSelecting
      ).toHaveBeenCalledWith(true);
      three.enableSelecting(false);
      expect(
        threePrivate.getSelectionManager().setSelecting
      ).toHaveBeenCalledWith(false);
      threePrivate.getSelectionManager().isInit = false;
      three.enableSelecting(false);
      expect(
        threePrivate.getSelectionManager().setSelecting
      ).toHaveBeenCalledWith(false);
    });

    it('should clear event data', () => {
      spyOn(threePrivate.sceneManager, 'clearEventData').and.callThrough();

      three.clearEventData();
      expect(threePrivate.sceneManager.clearEventData).toHaveBeenCalled();
    });

    it('should add event data type group', () => {
      expect(three.addEventDataTypeGroup('TestGroup')).toBeInstanceOf(Group);
    });

    it('should set overlay renderer', () => {
      const spy = spyOn(
        threePrivate.rendererManager,
        'setOverlayRenderer'
      ).and.callThrough();

      const canvas = document.createElement('canvas');
      three.setOverlayRenderer(canvas);

      expect(
        threePrivate.rendererManager.setOverlayRenderer
      ).toHaveBeenCalledWith(canvas);

      spy.calls.reset();
      threePrivate.rendererManager = undefined;
      three.setOverlayRenderer(canvas);
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should zoom to', () => {
      spyOn(threePrivate.controlsManager, 'zoomTo').and.callThrough();

      three.zoomTo(1, 100);
      expect(threePrivate.controlsManager.zoomTo).toHaveBeenCalled();
    });

    it('should get ID of active object', () => {
      spyOn(
        threePrivate.getSelectionManager(),
        'getActiveObjectId'
      ).and.callThrough();

      three.getActiveObjectId();
      expect(
        threePrivate.getSelectionManager().getActiveObjectId
      ).toHaveBeenCalled();
    });

    it('should look at object', () => {
      spyOn(threePrivate.controlsManager, 'lookAtObject').and.callThrough();

      three.lookAtObject('abcd1234');
      expect(threePrivate.controlsManager.lookAtObject).toHaveBeenCalled();
    });

    it('should highlight object', () => {
      spyOn(threePrivate.selectionManager, 'highlightObject').and.callThrough();

      three.highlightObject('abcd1234');
      expect(threePrivate.selectionManager.highlightObject).toHaveBeenCalled();
    });
  });
});
