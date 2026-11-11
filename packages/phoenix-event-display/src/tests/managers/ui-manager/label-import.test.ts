/**
 * @jest-environment jsdom
 */
import { EventDispatcher, PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EventDisplay } from '../../../event-display';
import { loadFile, saveFile } from '../../../helpers/file';
import { PhoenixLoader } from '../../../loaders/phoenix-loader';
import { ColorManager } from '../../../managers/three-manager/color-manager';
import { ControlsManager } from '../../../managers/three-manager/controls-manager';
import { SceneManager } from '../../../managers/three-manager/scene-manager';
import type { ConfigButton } from '../../../managers/ui-manager/phoenix-menu/config-types';
import { PhoenixMenuNode } from '../../../managers/ui-manager/phoenix-menu/phoenix-menu-node';
import { PhoenixMenuUI } from '../../../managers/ui-manager/phoenix-menu/phoenix-menu-ui';

jest.mock('../../../helpers/file');
jest.mock('three', () => {
  const actual = jest.requireActual('three');
  return {
    ...actual,
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      domElement: document.createElement('canvas'),
    })),
  };
});

class CameraChangeBoundary extends EventDispatcher<{ change: object }> {
  object = new PerspectiveCamera();
}

it('loads labels for existing targets when a saved label has no target in the current event', () => {
  jest.useFakeTimers();
  const loader = new PhoenixLoader();
  const display = new EventDisplay();
  const scene = new SceneManager([]);
  const three = display['graphicsLibrary'];
  three['sceneManager'] = scene;
  three['colorManager'] = new ColorManager(scene);
  const controls = Object.create(ControlsManager.prototype) as ControlsManager;
  const camera = new CameraChangeBoundary();
  camera.object.position.set(100, 200, 300);
  controls['mainControls'] = camera as unknown as OrbitControls;
  three['controlsManager'] = controls;
  const root = new PhoenixMenuNode('Phoenix Menu');
  const menu = new PhoenixMenuUI(root, three);
  display.configuration = { eventDataLoader: loader, phoenixMenuRoot: root };
  display['ui']['configuration'] = display.configuration;
  display['ui']['uiMenus'] = [menu];
  const labelFolder = () => root.findInTree('Labels')!;
  const click = (label: string) =>
    (
      labelFolder().configs.find(
        (config) => config.type === 'button' && config.label === label,
      ) as ConfigButton
    ).onClick();

  try {
    display.parsePhoenixEvents({
      original: {
        Vertices: {
          first: [{ pos: [0, 0, 0] }, { pos: [1, 0, 0] }],
          second: [{ pos: [0, 1, 0] }],
        },
      },
      current: {
        Vertices: {
          first: [{ pos: [0, 0, 0] }],
          second: [{ pos: [0, 2, 0] }],
        },
      },
    });
    display.addLabelToObject(
      'Stale label',
      'first',
      1,
      loader.getCollection('first')[1].uuid,
    );
    display.addLabelToObject(
      'Keep this label',
      'second',
      0,
      loader.getCollection('second')[0].uuid,
    );
    click('Save Labels');
    const savedLabels = jest.mocked(saveFile).mock.calls[0][0];
    expect(JSON.parse(savedLabels)).toEqual({
      Vertices: {
        first: { 1: 'Stale label' },
        second: { 0: 'Keep this label' },
      },
    });

    display.loadEvent('current');
    jest.mocked(loadFile).mockImplementation((read) => read(savedLabels));
    expect(() => click('Load Labels')).not.toThrow();

    const labelId = 'Vertices > second > 0';
    expect(labelFolder().children.map((node) => node.name)).toEqual([labelId]);
    expect(loader.getLabelsObject().Vertices.first[1]).toBeUndefined();
    expect(loader.getLabelsObject().Vertices.second[0]).toBe('Keep this label');
    const labels = scene.getObjectsGroup(SceneManager.LABELS_ID);
    expect(labels.children.map((label) => label.name)).toEqual([labelId]);
    expect(labels.children[0].position.toArray()).toEqual([0, 2, 0]);
  } finally {
    display.cleanup();
    jest.useRealTimers();
  }
});
