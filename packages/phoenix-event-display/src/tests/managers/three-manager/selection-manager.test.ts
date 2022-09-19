/**
 * @jest-environment jsdom
 */
import { InfoLogger } from '../../../helpers/info-logger';
import { EffectsManager } from '../../../managers/three-manager/effects-manager';
import THREE, { Camera, Object3D, Scene } from 'three';
import { SelectionManager } from '../../../managers/three-manager/selection-manager';
import { ActiveVariable } from '../../../helpers/active-variable';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';

jest.mock('three', () => {
  const THREE = jest.requireActual('three');
  return {
    ...THREE,
    WebGLRenderer: jest.fn().mockReturnValue({
      domElement: document.createElement('div'),
      setSize: jest.fn(),
      render: jest.fn(),
      getSize: jest.fn().mockReturnValue({ width: 100, height: 100 }),
      getPixelRatio: jest.fn(),
    }),
  };
});

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
    const camera = new Camera();
    const scene = new Scene();
    const renderer = new THREE.WebGLRenderer();
    const effectsManager = new EffectsManager(camera, scene, renderer);
    const infoLogger = new InfoLogger();

    selectionManager.init(camera, scene, effectsManager, infoLogger);

    expect(selectionManagerPrivate.camera).toBe(camera);
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
    expect(selectionManager.getActiveObjectId()).toBeInstanceOf(ActiveVariable);
  });

  it('should set if selecting is to be enabled or disabled', () => {
    jest.spyOn(selectionManagerPrivate, 'enableSelecting');
    selectionManager['isInit'] = true;

    document.getElementById = jest.fn().mockReturnValue({
      addEventListener: jest.fn(),
    });

    selectionManager['effectsManager'] = new EffectsManager(
      new Camera(),
      new Scene(),
      new THREE.WebGLRenderer()
    );

    selectionManager.setSelecting(true);

    expect(selectionManagerPrivate.enableSelecting).toHaveBeenCalled();

    jest.spyOn(selectionManagerPrivate, 'disableSelecting');

    document.getElementById = jest.fn().mockReturnValue({
      removeEventListener: jest.fn(),
    });

    selectionManager['outlinePass'] = new OutlinePass(
      new THREE.Vector2(100, 100),
      new THREE.Scene(),
      new THREE.Camera()
    );

    selectionManager.setSelecting(false);

    expect(selectionManagerPrivate.disableSelecting).toHaveBeenCalled();
  });

  it('should highlight the object with the given uuid by giving it an outline', () => {
    const objectGroup = new Object3D();
    jest.spyOn(objectGroup, 'getObjectByProperty');

    selectionManager.highlightObject('uuid', objectGroup);

    expect(objectGroup.getObjectByProperty).toHaveBeenCalledWith(
      'uuid',
      'uuid'
    );
  });
});
