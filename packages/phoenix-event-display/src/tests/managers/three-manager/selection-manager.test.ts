/**
 * @jest-environment jsdom
 */
import { InfoLogger } from '../../../helpers/info-logger';
import { EffectsManager } from '../../../managers/three-manager/effects-manager';
import { Object3D, PerspectiveCamera, Scene, Vector2, Vector3 } from 'three';
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three';
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

  it('should fire hover callbacks through applyIntersectionResult path', () => {
    const hoveredCallback = jest.fn();
    const hoverEndCallback = jest.fn();
    const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());

    selectionManager['effectsManager'] = {
      setHoverOutline: jest.fn(),
    } as any;
    jest
      .spyOn(selectionManagerPrivate, 'updateInfoPanelForHover')
      .mockImplementation(() => undefined);

    selectionManager.setOnObjectHoveredCallback(hoveredCallback);
    selectionManager.setOnObjectHoverEndCallback(hoverEndCallback);

    selectionManager.applyIntersectionResult(mesh);

    expect(hoveredCallback).toHaveBeenCalledWith(
      mesh,
      expect.objectContaining({ uuid: mesh.uuid, name: mesh.name }),
    );

    selectionManager.applyIntersectionResult(null);

    expect(hoverEndCallback).toHaveBeenCalledWith(mesh);
  });

  it('should fire selection callbacks through handleClick interaction path', () => {
    const selectedCallback = jest.fn();
    const deselectedCallback = jest.fn();
    const selectionChangedCallback = jest.fn();
    const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());

    selectionManager['effectsManager'] = {
      selectObject: jest.fn(),
      deselectObject: jest.fn(),
      clearAllSelections: jest.fn(),
    } as any;
    selectionManager['infoLogger'] = { add: jest.fn() } as any;

    selectionManager.setOnObjectSelectedCallback(selectedCallback);
    selectionManager.setOnObjectDeselectedCallback(deselectedCallback);
    selectionManager.setOnSelectionChangedCallback(selectionChangedCallback);

    selectionManagerPrivate.currentlyOutlinedObject = mesh;
    selectionManagerPrivate.handleClick();

    expect(selectedCallback).toHaveBeenCalledWith(
      mesh,
      expect.objectContaining({ uuid: mesh.uuid, name: mesh.name }),
    );
    expect(selectionChangedCallback).toHaveBeenCalledWith(expect.any(Set), [
      mesh,
    ]);

    selectionManagerPrivate.currentlyOutlinedObject = null;
    selectionManagerPrivate.handleClick();

    expect(deselectedCallback).toHaveBeenCalledWith(
      mesh,
      expect.objectContaining({ uuid: mesh.uuid, name: mesh.name }),
    );
    expect(selectionChangedCallback).toHaveBeenLastCalledWith(
      expect.any(Set),
      [],
    );
  });

  it('should provide hover data on immediate hover callback subscription', () => {
    const hoveredCallback = jest.fn();
    const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());

    selectionManagerPrivate.hoveredObject = mesh;
    selectionManager.setOnObjectHoveredCallback(hoveredCallback);

    expect(hoveredCallback).toHaveBeenCalledWith(
      mesh,
      expect.objectContaining({ uuid: mesh.uuid, name: mesh.name }),
    );
  });
});
