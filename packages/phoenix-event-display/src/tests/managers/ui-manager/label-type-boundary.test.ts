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

class LegacyLookupLoader extends PhoenixLoader {
  lookups: string[] = [];

  override getCollection(collection: string) {
    this.lookups.push(collection);
    return super.getCollection(collection);
  }
}

class LegacyHookLoader extends LegacyLookupLoader {
  registrations: string[] = [];

  override addLabelToEventObject(
    label: string,
    collection: string,
    indexInCollection: number,
  ): string {
    this.registrations.push(label);
    return super.addLabelToEventObject(label, collection, indexInCollection);
  }
}

it.each([
  [
    'typed loader with a missing vertex collection',
    false,
    false,
    PhoenixLoader,
  ],
  ['typed loader with two same-name collections', true, false, PhoenixLoader],
  ['legacy loader with a unique track collection', false, true, PhoenixLoader],
  [
    'legacy loader with ambiguous same-name collections',
    true,
    true,
    PhoenixLoader,
  ],
  [
    'legacy subclass with a unique track collection',
    false,
    true,
    LegacyHookLoader,
  ],
  [
    'legacy subclass with ambiguous same-name collections',
    true,
    true,
    LegacyHookLoader,
  ],
  [
    'lookup-only subclass with a unique track collection',
    false,
    true,
    LegacyLookupLoader,
  ],
  [
    'lookup-only subclass with ambiguous same-name collections',
    true,
    true,
    LegacyLookupLoader,
  ],
])(
  'resolves saved labels by type for %s',
  (_description, hasVertex, legacy, Loader) => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    const loader = new Loader();
    if (legacy && Loader === PhoenixLoader) {
      Object.defineProperty(loader, 'addSavedLabelToEventObject', {
        value: undefined,
      });
    }
    const display = new EventDisplay();
    const scene = new SceneManager([]);
    const three = display['graphicsLibrary'];
    three['sceneManager'] = scene;
    three['colorManager'] = new ColorManager(scene);
    const controls = Object.create(
      ControlsManager.prototype,
    ) as ControlsManager;
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
      const vertex: { pos: number[]; uuid?: string } = { pos: [0, 3, 0] };
      const track: { pos: number[][]; uuid?: string } = {
        pos: [
          [10, 0, 0],
          [11, 0, 0],
          [12, 0, 0],
        ],
      };
      display.parsePhoenixEvents({
        original: {
          Vertices: {
            shared: [{ pos: [1, 0, 0] }],
            control: [{ pos: [0, 1, 0] }],
          },
        },
        current: {
          Tracks: { shared: [track] },
          Vertices: {
            control: [{ pos: [0, 2, 0] }],
            ...(hasVertex ? { shared: [vertex] } : {}),
          },
        },
      });
      display.addLabelToObject(
        'Saved vertex',
        'shared',
        0,
        loader.getCollection('shared')[0].uuid,
      );
      display.addLabelToObject(
        'Same-type control',
        'control',
        0,
        loader.getCollection('control')[0].uuid,
      );
      click('Save Labels');
      const savedLabels = JSON.parse(jest.mocked(saveFile).mock.lastCall![0]);
      expect(savedLabels).toEqual({
        Vertices: {
          shared: { 0: 'Saved vertex' },
          control: { 0: 'Same-type control' },
        },
      });
      const saved = JSON.stringify({
        Tracks: { shared: { 0: 'Saved track' } },
        ...savedLabels,
      });

      display.loadEvent('current');
      if (loader instanceof LegacyLookupLoader) {
        loader.lookups = [];
      }
      if (loader instanceof LegacyHookLoader) {
        loader.registrations = [];
      }
      const getSceneText = (uuid: string) =>
        scene.getScene().getObjectByProperty('uuid', uuid)!.userData.label;
      jest.mocked(loadFile).mockImplementation((read) => read(saved));
      expect(() => click('Load Labels')).not.toThrow();

      if (loader instanceof LegacyHookLoader) {
        expect(loader.registrations).toEqual(
          hasVertex
            ? ['Same-type control']
            : ['Saved track', 'Same-type control'],
        );
      }
      if (loader instanceof LegacyLookupLoader) {
        expect(loader.lookups).toEqual(
          hasVertex ? ['control'] : ['shared', 'control'],
        );
      }
      const imported = loader.getLabelsObject();
      const isAmbiguousLegacy = legacy && hasVertex;
      const expectedTrack = isAmbiguousLegacy ? undefined : 'Saved track';
      const expectedVertex = hasVertex && !legacy ? 'Saved vertex' : undefined;
      expect(imported.Tracks?.shared?.[0]).toBe(expectedTrack);
      expect(imported.Vertices.shared?.[0]).toBe(expectedVertex);
      expect(imported.Vertices.control[0]).toBe('Same-type control');
      expect(getSceneText(track.uuid!)).toBe(expectedTrack);
      if (hasVertex) {
        expect(getSceneText(vertex.uuid!)).toBe(expectedVertex);
      }
      const expectedIds = [
        ...(expectedTrack ? ['Tracks > shared > 0'] : []),
        ...(expectedVertex ? ['Vertices > shared > 0'] : []),
        'Vertices > control > 0',
      ];
      const labels = scene.getObjectsGroup(SceneManager.LABELS_ID);
      expect(labels.children.map((label) => label.name)).toEqual(expectedIds);
      expect(labelFolder().children.map((node) => node.name)).toEqual(
        expectedIds,
      );
      click('Save Labels');
      expect(JSON.parse(jest.mocked(saveFile).mock.lastCall![0])).toEqual(
        imported,
      );
    } finally {
      display.cleanup();
      jest.useRealTimers();
    }
  },
);
