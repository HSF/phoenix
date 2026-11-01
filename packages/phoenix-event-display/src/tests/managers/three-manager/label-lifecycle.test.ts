/**
 * @jest-environment jsdom
 */
import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Vector3,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SceneManager } from '../../../managers/three-manager/scene-manager';

// Keep real font parsing and glyph geometry while retaining the suite's stubs
// for unrelated browser-only three.js modules.
jest.mock('../../helpers/three-jsm-mock', () => {
  const path = jest.requireActual('path');
  const threeRoot = path.dirname(path.dirname(require.resolve('three')));
  return {
    ...jest.requireActual('../../helpers/three-jsm-mock'),
    ...jest.requireActual(
      path.join(threeRoot, 'examples/jsm/loaders/FontLoader.js'),
    ),
    ...jest.requireActual(
      path.join(threeRoot, 'examples/jsm/geometries/TextGeometry.js'),
    ),
    ...jest.requireActual(
      path.join(threeRoot, 'examples/jsm/controls/OrbitControls.js'),
    ),
  };
});

describe('label resource lifecycle', () => {
  let scene: SceneManager;
  let controls: OrbitControls;
  let cameras: OrbitControls[];
  let object: Mesh;
  const labelId = 'Vertices > vertices > 0';
  const labels = () => scene.getObjectsGroup(SceneManager.LABELS_ID);
  const cameraControls = () => {
    const camera = new OrbitControls(
      new PerspectiveCamera(),
      document.createElement('canvas'),
    );
    cameras.push(camera);
    return camera;
  };
  const addLabel = (
    id = labelId,
    camera = controls,
    target = object,
    label = 'Label',
  ) => {
    scene.addLabelToObject(
      label,
      target.uuid,
      id,
      new Vector3(12, 24, 36),
      camera,
    );
    return labels().getObjectByName(id) as Mesh;
  };

  beforeEach(() => {
    scene = new SceneManager([]);
    cameras = [];
    controls = cameraControls();
    controls.object.position.set(100, 200, 300);
    object = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    scene.addEventDataTypeGroup('Vertices').add(object);
  });

  afterEach(() => {
    scene.clearEventData();
    cameras.forEach((camera) => camera.dispose());
    jest.restoreAllMocks();
  });

  it('unsubscribes and disposes removed text without touching a same-named physics object', () => {
    // Physics object is visited first by scene-wide name lookup.
    object.name = labelId;
    const addListener = jest.spyOn(controls, 'addEventListener');
    const text = addLabel();
    expect(text.geometry.getAttribute('position').count).toBeGreaterThan(0);
    const callback = addListener.mock.calls[0][1];
    expect(controls.hasEventListener('change', callback)).toBe(true);
    const otherListener = jest.fn();
    controls.addEventListener('change', otherListener);
    const lookAt = jest.spyOn(text, 'lookAt');
    const disposeGeometry = jest.spyOn(text.geometry, 'dispose');
    const disposeMaterial = jest.spyOn(
      text.material as MeshBasicMaterial,
      'dispose',
    );
    const disposePhysics = jest.spyOn(object.geometry, 'dispose');

    scene.removeLabel(labelId);
    scene.removeLabel(labelId);
    expect(controls.hasEventListener('change', callback)).toBe(false);
    expect(text.parent).toBeNull();
    expect(disposeGeometry).toHaveBeenCalledTimes(1);
    expect(disposeMaterial).toHaveBeenCalledTimes(1);
    expect(disposePhysics).not.toHaveBeenCalled();
    controls.dispatchEvent({ type: 'change' });
    expect(lookAt).not.toHaveBeenCalled();
    expect(otherListener).toHaveBeenCalledTimes(1);
  });

  it('releases the old controls and text when the same label is replaced', () => {
    const oldListener = jest.spyOn(controls, 'addEventListener');
    const oldText = addLabel();
    const callback = oldListener.mock.calls[0][1];
    const lookAt = jest.spyOn(oldText, 'lookAt');
    const disposeGeometry = jest.spyOn(oldText.geometry, 'dispose');
    const replacementControls = cameraControls();
    replacementControls.object.position.set(-100, 20, 300);
    const newListener = jest.spyOn(replacementControls, 'addEventListener');

    const replacement = addLabel(
      labelId,
      replacementControls,
      object,
      'Edited',
    );
    const lookAtReplacement = jest.spyOn(replacement, 'lookAt');
    expect(controls.hasEventListener('change', callback)).toBe(false);
    expect(
      replacementControls.hasEventListener(
        'change',
        newListener.mock.calls[0][1],
      ),
    ).toBe(true);
    expect(labels().children).toEqual([replacement]);
    expect(disposeGeometry).toHaveBeenCalledTimes(1);
    controls.dispatchEvent({ type: 'change' });
    replacementControls.dispatchEvent({ type: 'change' });
    expect(lookAt).not.toHaveBeenCalled();
    expect(lookAtReplacement).toHaveBeenCalledTimes(1);
  });

  it('owns callbacks by label when a replacement object has a different UUID', () => {
    const addListener = jest.spyOn(controls, 'addEventListener');
    const oldText = addLabel();
    const lookAt = jest.spyOn(oldText, 'lookAt');
    const replacementObject = new Mesh(
      new BoxGeometry(),
      new MeshBasicMaterial(),
    );
    scene.addEventDataTypeGroup('Other').add(replacementObject);
    const replacement = addLabel(labelId, controls, replacementObject);
    const callbacks = addListener.mock.calls.map((call) => call[1]);
    expect(
      callbacks.filter((callback) =>
        controls.hasEventListener('change', callback),
      ),
    ).toHaveLength(1);
    const orientation = replacement.quaternion.clone();
    controls.object.position.set(-100, 20, 300);
    controls.dispatchEvent({ type: 'change' });
    expect(lookAt).not.toHaveBeenCalled();
    expect(replacement.quaternion.equals(orientation)).toBe(false);
  });

  it('unsubscribes all labels on event clear across repeated event rebuilds', () => {
    const addListener = jest.spyOn(controls, 'addEventListener');
    const otherListener = jest.fn();
    controls.addEventListener('change', otherListener);
    for (let i = 0; i < 3; i++) {
      const secondObject = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
      scene.addEventDataTypeGroup('Other').add(secondObject);
      const texts = [
        addLabel(),
        addLabel('Vertices > vertices > 1', controls, secondObject),
      ];
      const lookAts = texts.map((text) => jest.spyOn(text, 'lookAt'));
      const disposals = texts.map((text) =>
        jest.spyOn(text.geometry, 'dispose'),
      );
      const disposePhysics = jest.spyOn(object.geometry, 'dispose');
      scene.clearEventData();
      scene.clearEventData();
      expect(labels().children).toHaveLength(0);
      expect(
        addListener.mock.calls.filter(
          (call) =>
            call[1] !== otherListener &&
            controls.hasEventListener('change', call[1]),
        ),
      ).toHaveLength(0);
      disposals.forEach((dispose) => expect(dispose).toHaveBeenCalledTimes(1));
      expect(disposePhysics).toHaveBeenCalledTimes(1);
      controls.dispatchEvent({ type: 'change' });
      lookAts.forEach((lookAt) => expect(lookAt).not.toHaveBeenCalled());
      expect(otherListener).toHaveBeenCalledTimes(i + 1);
      object = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
      scene.addEventDataTypeGroup('Vertices').add(object);
    }
  });
});
