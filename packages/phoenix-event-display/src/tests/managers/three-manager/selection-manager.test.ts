/**
 * @jest-environment jsdom
 */
import { InfoLogger } from '../../../helpers/info-logger';
import { EffectsManager } from '../../../managers/three-manager/effects-manager';
import {
  BoxGeometry,
  Color,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector2,
  Vector3,
} from 'three';
import { SelectionManager } from '../../../managers/three-manager/selection-manager';
import THREE from '../../helpers/webgl-mock';

describe('SelectionManager', () => {
  let selectionManager: SelectionManager;
  let selectionManagerPrivate: any;

  beforeEach(() => {
    selectionManager = new SelectionManager();
    selectionManagerPrivate = selectionManager as any;
  });

  afterEach(() => {
    selectionManager = undefined;
  });

  it('should be created', () => {
    expect(selectionManager).toBeTruthy();
  });

  it('should initialize the selection manager', () => {
    const camera = new PerspectiveCamera();
    const scene = new Scene();
    const renderer = new THREE.WebGLRenderer();
    const effectsManager = new EffectsManager(camera, scene, renderer);
    const infoLogger = new InfoLogger();

    // Mock controls functions
    const mockControls = { object: camera, target: new Vector3() };
    const getControls = () => mockControls;
    const getOverlayControls = () => undefined;
    const getOverlayCanvas = () => undefined;

    selectionManager.init(
      getControls,
      getOverlayControls,
      getOverlayCanvas,
      scene,
      effectsManager,
      infoLogger,
    );

    expect(selectionManagerPrivate.scene).toBe(scene);
    expect(selectionManagerPrivate.effectsManager).toBe(effectsManager);
    expect(selectionManagerPrivate.infoLogger).toBe(infoLogger);
  });

  it('should set the currently selected object', () => {
    const test = {
      name: 'test',
      attributes: [],
    };
    selectionManager.setSelectedObject(test);

    expect(selectionManagerPrivate.selectedObject).toBe(test);
  });

  it('should get the uuid of the currently selected object', () => {
    const activeObj = selectionManager.getActiveObjectId();
    expect(activeObj.value).toBe('');
    expect(activeObj['callbacks']).toEqual([]);
  });

  it.each([0, 1])(
    'should restore hovered cell %i when selection is disabled',
    (instanceId) => {
      const canvas = document.createElement('canvas');
      canvas.id = 'three-canvas';
      document.body.appendChild(canvas);
      const camera = new PerspectiveCamera();
      const scene = new Scene();
      const effectsManager = new EffectsManager(
        camera,
        scene,
        new THREE.WebGLRenderer(),
      );
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial();
      const cells = new InstancedMesh(geometry, material, 2);
      cells.setColorAt(0, new Color(1, 0, 0));
      cells.setColorAt(1, new Color(0, 1, 0));
      cells.userData = {
        _isInstancedCaloCells: true,
        _lastHitInstanceId: instanceId,
      };
      const originalColors = cells.instanceColor.array.slice();

      selectionManager.init(
        () => ({ object: camera }),
        undefined,
        undefined,
        scene,
        effectsManager,
        new InfoLogger(),
      );
      selectionManager.setSelectedObject({ name: '', attributes: [] });

      try {
        selectionManager.setSelecting(true);
        selectionManager.applyIntersectionResult(cells);
        const hoveredColor = new Color();
        cells.getColorAt(instanceId, hoveredColor);
        expect(hoveredColor).toEqual(new Color(1, 1, 1));
        const highlightedVersion = cells.instanceColor.version;

        selectionManager.setSelecting(false);

        expect(cells.instanceColor.array).toEqual(originalColors);
        expect(cells.instanceColor.version).toBeGreaterThan(highlightedVersion);
      } finally {
        selectionManager.cleanup();
        canvas.remove();
        geometry.dispose();
        material.dispose();
      }
    },
  );

  it('should set if selecting is to be enabled or disabled', () => {
    jest.spyOn(selectionManagerPrivate, 'enableSelecting');
    selectionManager['isInit'] = true;

    document.getElementById = jest.fn().mockReturnValue({
      addEventListener: jest.fn(),
    });

    selectionManager['effectsManager'] = new EffectsManager(
      new PerspectiveCamera(),
      new Scene(),
      new THREE.WebGLRenderer(),
    );

    selectionManager.setSelecting(true);

    expect(selectionManagerPrivate.enableSelecting).toHaveBeenCalled();

    jest.spyOn(selectionManagerPrivate, 'disableSelecting');

    document.getElementById = jest.fn().mockReturnValue({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    selectionManager.setSelecting(false);

    expect(selectionManagerPrivate.disableSelecting).toHaveBeenCalled();
  });

  it('should set if highlighting is to be enabled or disabled', () => {
    selectionManager['isInit'] = true;

    selectionManager['effectsManager'] = new EffectsManager(
      new PerspectiveCamera(),
      new Scene(),
      new THREE.WebGLRenderer(),
    );

    selectionManager['infoLogger'] = new InfoLogger();

    const VALUE1 = selectionManager['effectsManager'].antialiasing;
    const spy = jest.spyOn(
      selectionManager['effectsManager'],
      'setAntialiasing',
    );

    selectionManager.enableHighlighting();

    expect(selectionManager['preSelectionAntialias']).toBe(VALUE1);
    expect(spy).toHaveBeenCalledWith(false);

    const VALUE2 = selectionManager['preSelectionAntialias'];

    selectionManager.disableHighlighting();

    expect(selectionManager['selectedObjects'].size).toBe(0);
    expect(spy).toHaveBeenCalledWith(VALUE2);
  });

  it('should highlight the object with the given uuid by giving it an outline', () => {
    const objectGroup = new Object3D();
    jest.spyOn(objectGroup, 'getObjectByProperty');

    selectionManager.highlightObject('uuid', objectGroup);

    expect(objectGroup.getObjectByProperty).toHaveBeenCalledWith(
      'uuid',
      'uuid',
    );
  });
});
