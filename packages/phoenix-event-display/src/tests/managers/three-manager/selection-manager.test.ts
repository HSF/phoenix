/**
 * @jest-environment jsdom
 */
import { InfoLogger } from '../../../helpers/info-logger';
import { EffectsManager } from '../../../managers/three-manager/effects-manager';
import { Camera, Object3D, Scene } from 'three';
import { SelectionManager } from '../../../managers/three-manager/selection-manager';
import createRenderer from '../../helpers/create-renderer';

describe('SelectionManager', () => {
  let selectionManager: SelectionManager;
  let selectionManagerPrivate: any;

  beforeEach(() => {
    selectionManager = new SelectionManager();
    selectionManagerPrivate = selectionManager as any;
  });

  afterEach(() => {
    selectionManager = null;
  });

  it('should be created', () => {
    expect(selectionManager).toBeTruthy();
  });

  it('should initialize the selection manager', () => {
    const camera = new Camera();
    const scene = new Scene();
    const renderer = createRenderer();
    const effectsManager = new EffectsManager(camera, scene, renderer);
    const infoLogger = new InfoLogger();
    jest.spyOn(selectionManager, 'init');
    selectionManager.init(camera, scene, effectsManager, infoLogger);
    expect(selectionManager.init).toHaveBeenCalledWith(
      camera,
      scene,
      effectsManager,
      infoLogger
    );
  });

  it('should set the currently selected object', () => {
    const test = {
      name: 'test',
      attributes: [],
    };
    jest.spyOn(selectionManager, 'setSelectedObject');
    selectionManager.setSelectedObject(test);
    expect(selectionManager.setSelectedObject).toHaveBeenCalledWith(test);
  });

  it('should get the uuid of the currently selected object', () => {
    jest.spyOn(selectionManager, 'getActiveObjectId');
    selectionManager.getActiveObjectId();
    expect(selectionManager.getActiveObjectId).toHaveBeenCalled();
  });

  it('should set if selecting is to be enabled or disabled', () => {
    jest.spyOn(selectionManager, 'setSelecting');
    selectionManager.setSelecting(true);
    expect(selectionManager.setSelecting).toHaveBeenCalledWith(true);
  });

  it('should highlight the object with the given uuid by giving it an outline pass', () => {
    const camera = new Camera();
    const scene = new Scene();
    const renderer = createRenderer();
    const effectsManager = new EffectsManager(camera, scene, renderer);
    const infoLogger = new InfoLogger();
    selectionManager.init(camera, scene, effectsManager, infoLogger);
    const test = {
      name: 'test',
      attributes: [],
    };
    selectionManager.setSelectedObject(test);
    selectionManagerPrivate.outlinePass.selectedObject = test;
    selectionManagerPrivate.outlinePass.render();
    expect(selectionManagerPrivate.outlinePass.selectedObject).toEqual(test);

    jest.spyOn(selectionManager, 'highlightObject');
    selectionManager.highlightObject('test', new Object3D());
    expect(selectionManager.highlightObject).toHaveBeenCalled();
  });
});
