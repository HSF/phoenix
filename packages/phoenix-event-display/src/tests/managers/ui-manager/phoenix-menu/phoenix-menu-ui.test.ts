/**
 * @jest-environment jsdom
 */
import { Object3D } from 'three';
import { InfoLogger } from '../../../../helpers/info-logger';
import { ThreeManager } from '../../../../managers/three-manager';
import { PhoenixMenuNode } from '../../../../managers/ui-manager/phoenix-menu/phoenix-menu-node';
import { PhoenixMenuUI } from '../../../../managers/ui-manager/phoenix-menu/phoenix-menu-ui';

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
      PhoenixMenuNode
    );
    expect(phoenixMenuUIPrivate.eventFolder.children[0].name).toBe(
      'Event Data'
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

  it('should get the folder of the event data type', () => {
    phoenixMenuUI.addEventDataFolder();
    phoenixMenuUI.addEventDataTypeFolder('test');

    const eventDataFolder = phoenixMenuUI.getEventDataTypeFolder('test');

    expect(eventDataFolder.name).toBe('test');
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
