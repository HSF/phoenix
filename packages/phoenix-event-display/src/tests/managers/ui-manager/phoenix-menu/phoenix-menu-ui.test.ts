/**
 * @jest-environment jsdom
 */
import { Object3D } from 'three';
import { InfoLogger } from '../../../../helpers/info-logger';
import { ThreeManager } from '../../../../managers/three-manager';
import { PhoenixMenuNode } from '../../../../managers/ui-manager/phoenix-menu/phoenix-menu-node';
import { PhoenixMenuUI } from '../../../../managers/ui-manager/phoenix-menu/phoenix-menu-ui';
import { Cut } from '../../../../lib/models/cut.model';

jest.mock('../../../../managers/three-manager');

describe('PhoenixMenuUI', () => {
  let phoenixMenuUI: PhoenixMenuUI;
  let phoenixMenuUIPrivate: any;
  let phoenixMenuRoot: PhoenixMenuNode;
  let three: ThreeManager;

  beforeEach(() => {
    three = new ThreeManager(new InfoLogger());
    phoenixMenuRoot = new PhoenixMenuNode('test');
    phoenixMenuUI = new PhoenixMenuUI(phoenixMenuRoot, three);
    phoenixMenuUIPrivate = phoenixMenuUI as any;
  });

  afterEach(() => {
    phoenixMenuUI.clear();
    phoenixMenuUI = undefined;
    phoenixMenuUIPrivate = undefined;
  });

  it('should create an instance', () => {
    expect(phoenixMenuUI).toBeTruthy();
  });

  it('should add geometry (detector geometry) folder to the menu', () => {
    phoenixMenuUI.addGeometryFolder();

    expect(phoenixMenuUIPrivate.geomFolder.name).toBe('Detector');
    expect(phoenixMenuUIPrivate.geomFolder).toBeInstanceOf(PhoenixMenuNode);
  });

  it('should add event data folder with functions for event data toggles like show/hide and depthTest', () => {
    phoenixMenuUI.addEventDataFolder();

    expect(phoenixMenuUIPrivate.eventFolder.name).toBe('Event Data');
    expect(phoenixMenuUIPrivate.eventFolder).toBeInstanceOf(PhoenixMenuNode);
  });

  it('should add labels folder to the menu', () => {
    phoenixMenuUI.addLabelsFolder('test');

    expect(phoenixMenuUIPrivate.labelsFolder.name).toBe('Labels');
    expect(phoenixMenuUIPrivate.labelsFolder).toBeInstanceOf(PhoenixMenuNode);
  });

  it('should remove label from the menu and scene if it exists', () => {
    const testMenuNode = new PhoenixMenuNode('test');
    const testMenuNodeChild = testMenuNode.addChild('test', () => {});

    jest.spyOn(testMenuNodeChild, 'remove');

    phoenixMenuUI.removeLabel('test', testMenuNodeChild);

    expect(testMenuNodeChild.remove).toHaveBeenCalled();
  });

  it('should add geometry to the menu geometry folder and set up its configurable options', () => {
    phoenixMenuUI.addGeometryFolder();
    phoenixMenuUI.addGeometry(new Object3D(), 'test');

    expect(phoenixMenuUIPrivate.geomFolder.children[0].name).toBe('test');
    expect(phoenixMenuUIPrivate.geomFolder.parent.name).toBe('test');
  });

  it('should add folder for event data type like tracks or hits to the menu', () => {
    phoenixMenuUI.addEventDataFolder();
    phoenixMenuUI.addEventDataTypeFolder('Event Data');

    expect(phoenixMenuUIPrivate.eventFolder.children[0]).toBeInstanceOf(
      PhoenixMenuNode,
    );
    expect(phoenixMenuUIPrivate.eventFolder.children[0].name).toBe(
      'Event Data',
    );
  });

  it('should add collection folder and its configurable options to the event data type (tracks, hits etc.) folder', () => {
    phoenixMenuUI.addEventDataFolder();
    phoenixMenuUI.addEventDataTypeFolder('test');

    phoenixMenuUI.addCollection('test', 'Tracks');

    const addedChild = phoenixMenuUI['eventFolder'].findInTree('Draw Options');

    expect(addedChild).toBeInstanceOf(PhoenixMenuNode);
    expect(addedChild.name).toBe('Draw Options');
  });

  it('should add a line width scale slider to track collections only', () => {
    phoenixMenuUI.addEventDataFolder();
    phoenixMenuUI.addEventDataTypeFolder('Tracks');
    phoenixMenuUI.addEventDataTypeFolder('Hits');

    phoenixMenuUI.addCollection('Tracks', 'TestTracks');
    phoenixMenuUI.addCollection('Hits', 'TestHits');

    const findLineWidthSlider = (collectionName: string) =>
      phoenixMenuUIPrivate.eventFolder
        .findInTree(collectionName)
        .findInTree('Draw Options')
        .configs.find((config) => config.label === 'Line width scale');

    const slider = findLineWidthSlider('TestTracks');
    expect(slider.type).toBe('slider');
    expect(slider.value).toBe(1);
    expect(findLineWidthSlider('TestHits')).toBeUndefined();

    slider.onChange(2.5);
    expect(three.setCollectionLineWidthScale).toHaveBeenCalledWith(
      'TestTracks',
      2.5,
    );

    // The custom value input of the slider emits strings
    slider.onChange('3');
    expect(three.setCollectionLineWidthScale).toHaveBeenCalledWith(
      'TestTracks',
      3,
    );
  });

  it('should get the folder of the event data type', () => {
    phoenixMenuUI.addEventDataFolder();
    phoenixMenuUI.addEventDataTypeFolder('test');

    const eventDataFolder = phoenixMenuUI.getEventDataTypeFolder('test');

    expect(eventDataFolder.name).toBe('test');
  });

  it('should re-apply cuts to registered collections on event switch', () => {
    const cuts = [new Cut('eta', -4, 4, 0.1)];
    cuts[0].maxValue = 0.5;

    const mockCollectionFilter = jest.fn();
    phoenixMenuUIPrivate.sceneManager = {
      collectionFilter: mockCollectionFilter,
      getObjectByName: jest
        .fn()
        .mockReturnValue({ getObjectByName: jest.fn() }),
      objectVisibility: jest.fn(),
      groupVisibility: jest.fn(),
    };

    phoenixMenuUI.addEventDataFolder();
    phoenixMenuUI.addEventDataTypeFolder('test');
    phoenixMenuUI.addCollection('test', 'Tracks_', cuts);
    phoenixMenuUI.reapplyCollectionCuts();

    expect(mockCollectionFilter).toHaveBeenCalledWith('Tracks_', cuts);
  });

  it('should clear cut registry when event data folder is rebuilt', () => {
    const cuts = [new Cut('eta', -4, 4, 0.1)];

    phoenixMenuUIPrivate.sceneManager = {
      collectionFilter: jest.fn(),
      getObjectByName: jest
        .fn()
        .mockReturnValue({ getObjectByName: jest.fn() }),
      objectVisibility: jest.fn(),
      groupVisibility: jest.fn(),
    };

    phoenixMenuUI.addEventDataFolder();
    phoenixMenuUI.addEventDataTypeFolder('test');
    phoenixMenuUI.addCollection('test', 'Tracks_', cuts);

    expect(Object.keys(phoenixMenuUIPrivate.collectionCuts).length).toBe(1);

    phoenixMenuUI.addEventDataFolder();

    expect(Object.keys(phoenixMenuUIPrivate.collectionCuts).length).toBe(0);
  });

  describe('removed geometry restoration', () => {
    let mockSceneManager: any;
    let mockGeometriesGroup: any;

    beforeEach(() => {
      mockGeometriesGroup = {
        add: jest.fn(),
        remove: jest.fn(),
      };
      mockSceneManager = {
        removeGeometry: jest.fn(),
        getGeometries: jest.fn().mockReturnValue(mockGeometriesGroup),
        objectVisibility: jest.fn(),
        changeObjectColor: jest.fn(),
        setGeometryOpacity: jest.fn(),
        wireframeGeometries: jest.fn(),
        groupVisibility: jest.fn(),
        scaleObject: jest.fn(),
        getObjectByName: jest.fn().mockReturnValue(new Object3D()),
      };
      phoenixMenuUIPrivate.sceneManager = mockSceneManager;
      phoenixMenuUI.addGeometryFolder();
    });

    it('should track removed geometry and add restore button to top-level Detector config', () => {
      const geom = new Object3D();
      geom.name = 'Pixel';
      phoenixMenuUI.addGeometry(geom, 'Inner Detector');

      const geomNode = phoenixMenuUI['geomFolder'].findInTree('Pixel');
      expect(geomNode).toBeTruthy();

      const removeConfig = geomNode.configs.find(
        (c) => c.type === 'button' && c.label === 'Remove',
      ) as any;
      expect(removeConfig).toBeTruthy();

      removeConfig.onClick();

      // Geometry node is removed from tree
      expect(phoenixMenuUI['geomFolder'].findInTree('Pixel')).toBeUndefined();
      expect(mockSceneManager.removeGeometry).toHaveBeenCalledWith(geom);

      // Geometry is tracked in removed geometries
      const removed = phoenixMenuUI.getRemovedGeometries();
      expect(removed.length).toBe(1);
      expect(removed[0].name).toBe('Pixel (Inner Detector)');

      // Detector folder config has Removed Geometry label and Restore button
      const detectorConfigs = phoenixMenuUI['geomFolder'].configs;
      const labelConfig = detectorConfigs.find(
        (c) => c.type === 'label' && c.label === 'Removed Geometry',
      );
      const restoreBtn = detectorConfigs.find(
        (c) =>
          c.type === 'button' && c.label === 'Restore Pixel (Inner Detector)',
      ) as any;

      expect(labelConfig).toBeTruthy();
      expect(restoreBtn).toBeTruthy();

      // Click restore
      restoreBtn.onClick();

      // Geometry is restored to scene and menu
      expect(mockGeometriesGroup.add).toHaveBeenCalledWith(geom);
      expect(phoenixMenuUI['geomFolder'].findInTree('Pixel')).toBeTruthy();
      expect(phoenixMenuUI.getRemovedGeometries().length).toBe(0);

      // Removed geometry configs are gone from Detector folder
      const updatedConfigs = phoenixMenuUI['geomFolder'].configs;
      expect(
        updatedConfigs.some((c) => (c as any).group === 'removed-geometries'),
      ).toBe(false);
    });

    it('should handle removing multiple geometries with dropdown and Restore All', () => {
      const geom1 = new Object3D();
      geom1.name = 'Pixel';
      const geom2 = new Object3D();
      geom2.name = 'SCT';

      phoenixMenuUI.addGeometry(geom1);
      phoenixMenuUI.addGeometry(geom2);

      const node1 = phoenixMenuUI['geomFolder'].findInTree('Pixel');
      const node2 = phoenixMenuUI['geomFolder'].findInTree('SCT');

      (node1.configs.find((c) => c.label === 'Remove') as any).onClick();
      (node2.configs.find((c) => c.label === 'Remove') as any).onClick();

      expect(phoenixMenuUI.getRemovedGeometries().length).toBe(2);

      const detectorConfigs = phoenixMenuUI['geomFolder'].configs;
      const selectConfig = detectorConfigs.find(
        (c) => c.type === 'select' && c.label === 'Restore',
      ) as any;
      const restoreSelectedBtn = detectorConfigs.find(
        (c) => c.type === 'button' && c.label === 'Restore Selected',
      ) as any;
      const restoreAllBtn = detectorConfigs.find(
        (c) => c.type === 'button' && c.label === 'Restore All',
      ) as any;

      expect(selectConfig).toBeTruthy();
      expect(selectConfig.options).toEqual(['Pixel', 'SCT']);
      expect(restoreSelectedBtn).toBeTruthy();
      expect(restoreAllBtn).toBeTruthy();

      // Select and restore SCT
      selectConfig.onChange('SCT');
      restoreSelectedBtn.onClick();

      expect(phoenixMenuUI.getRemovedGeometries().length).toBe(1);
      expect(phoenixMenuUI['geomFolder'].findInTree('SCT')).toBeTruthy();
      expect(phoenixMenuUI['geomFolder'].findInTree('Pixel')).toBeUndefined();

      // Remaining single item switches to single-button mode
      const updatedConfigs = phoenixMenuUI['geomFolder'].configs;
      const singleRestoreBtn = updatedConfigs.find(
        (c) => c.type === 'button' && c.label === 'Restore Pixel',
      ) as any;
      expect(singleRestoreBtn).toBeTruthy();

      // Restore remaining
      singleRestoreBtn.onClick();
      expect(phoenixMenuUI.getRemovedGeometries().length).toBe(0);
      expect(phoenixMenuUI['geomFolder'].findInTree('Pixel')).toBeTruthy();
    });

    it('should restore all geometries at once with Restore All', () => {
      const geom1 = new Object3D();
      geom1.name = 'Pixel';
      const geom2 = new Object3D();
      geom2.name = 'SCT';

      phoenixMenuUI.addGeometry(geom1);
      phoenixMenuUI.addGeometry(geom2);

      (
        phoenixMenuUI['geomFolder']
          .findInTree('Pixel')
          .configs.find((c) => c.label === 'Remove') as any
      ).onClick();
      (
        phoenixMenuUI['geomFolder']
          .findInTree('SCT')
          .configs.find((c) => c.label === 'Remove') as any
      ).onClick();

      expect(phoenixMenuUI.getRemovedGeometries().length).toBe(2);

      const restoreAllBtn = phoenixMenuUI['geomFolder'].configs.find(
        (c) => c.type === 'button' && c.label === 'Restore All',
      ) as any;
      restoreAllBtn.onClick();

      expect(phoenixMenuUI.getRemovedGeometries().length).toBe(0);
      expect(phoenixMenuUI['geomFolder'].findInTree('Pixel')).toBeTruthy();
      expect(phoenixMenuUI['geomFolder'].findInTree('SCT')).toBeTruthy();
    });

    it('should clear removed geometries on clear()', () => {
      const geom = new Object3D();
      geom.name = 'Pixel';
      phoenixMenuUI.addGeometry(geom);
      (
        phoenixMenuUI['geomFolder']
          .findInTree('Pixel')
          .configs.find((c) => c.label === 'Remove') as any
      ).onClick();

      expect(phoenixMenuUI.getRemovedGeometries().length).toBe(1);
      phoenixMenuUI.clear();
      expect(phoenixMenuUI.getRemovedGeometries().length).toBe(0);
    });
  });

  describe('PhoenixMenuNode', () => {
    let testMenuNode: PhoenixMenuNode;
    let testMenuNodeChild: PhoenixMenuNode;

    beforeEach(() => {
      testMenuNode = new PhoenixMenuNode('test');
      testMenuNodeChild = testMenuNode.addChild('testChild', () => {});
    });

    it('should toggle the current and all child nodes of the menu', () => {
      jest.spyOn(testMenuNodeChild, 'toggleSelfAndDescendants');

      testMenuNode.toggleSelfAndDescendants(true);

      expect(testMenuNodeChild.toggleSelfAndDescendants).toHaveBeenCalled();
    });

    it('should get the current state of node as an object', () => {
      const stateOfNode = testMenuNode.getNodeState();

      expect(stateOfNode.name).toBe('test');
      expect(stateOfNode.children[0].name).toBe('testChild');
    });

    it('should load the state of the phoenix menu node from JSON', () => {
      jest.spyOn(testMenuNodeChild, 'loadStateFromJSON');

      const stateOfNode = testMenuNode.getNodeState();

      testMenuNode.loadStateFromJSON(stateOfNode);

      expect(testMenuNodeChild.loadStateFromJSON).toHaveBeenCalled();
    });

    it('should find a node in the tree by name', () => {
      const foundNode = testMenuNode.findInTree('testChild');

      expect(foundNode.name).toBe('testChild');
    });

    it('should find a node in the tree by name or create one', () => {
      const foundNode = testMenuNode.findInTreeOrCreate('testChild');

      expect(foundNode.name).toBe('testChild');

      const foundNode2 = testMenuNode.findInTreeOrCreate('testChild2');

      expect(foundNode2.name).toBe('testChild2');
    });
  });
});
