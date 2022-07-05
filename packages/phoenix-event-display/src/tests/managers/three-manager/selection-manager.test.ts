/**
 * @jest-environment jsdom
 */
import { InfoLogger } from '../../../helpers/info-logger';
import { EffectsManager } from '../../../managers/three-manager/effects-manager';
import { Camera, Scene } from 'three';
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
    selectionManager.getActiveObjectId();
    expect(selectionManagerPrivate.activeObject).toBeTruthy();
  });

  it('should set if selecting is to be enabled or disabled', () => {
    selectionManager.setSelecting(true);
    expect(selectionManagerPrivate.isInit).toBeFalsy();
  });
});
