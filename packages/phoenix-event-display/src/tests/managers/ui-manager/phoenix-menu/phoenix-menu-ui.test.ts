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
  });

  it('should create an instance', () => {
    expect(phoenixMenuUI).toBeTruthy();
  });

  it('should add geometry (detector geometry) folder to the menu', () => {
    phoenixMenuUI.addGeometryFolder();

    expect(phoenixMenuUIPrivate.geomFolder.name).toBe('Detector');
    expect(phoenixMenuUIPrivate.geomFolder).toBeInstanceOf(PhoenixMenuNode);
    expect(phoenixMenuUIPrivate.geomFolder.toggleState).toBeTruthy();
    expect(phoenixMenuUIPrivate.geomFolder.configs[0].type).toBe('checkbox');
    expect(phoenixMenuUIPrivate.geomFolder.configs[1].type).toBe('slider');
  });

  it('should add event data folder with functions for event data toggles like show/hide and depthTest', () => {
    phoenixMenuUI.addEventDataFolder();

    expect(phoenixMenuUIPrivate.eventFolder.name).toBe('Event Data');
    expect(phoenixMenuUIPrivate.eventFolder).toBeInstanceOf(PhoenixMenuNode);
    expect(phoenixMenuUIPrivate.eventFolder.toggleState).toBeTruthy();
    expect(phoenixMenuUIPrivate.eventFolder.configs[0].type).toBe('checkbox');
    expect(phoenixMenuUIPrivate.eventFolder.childrenActive).toBeFalsy();
    expect(phoenixMenuUIPrivate.eventFolder.parent).toBeInstanceOf(
      PhoenixMenuNode
    );
    expect(phoenixMenuUIPrivate.eventFolder.parent.name).toBe('test');
  });

  it('should add labels folder to the menu', () => {
    phoenixMenuUI.addLabelsFolder('test');

    expect(phoenixMenuUIPrivate.labelsFolder.name).toBe('Labels');
    expect(phoenixMenuUIPrivate.labelsFolder).toBeInstanceOf(PhoenixMenuNode);
    expect(phoenixMenuUIPrivate.labelsFolder.toggleState).toBeTruthy();
    expect(phoenixMenuUIPrivate.labelsFolder.configs[0].type).toBe('slider');
    expect(phoenixMenuUIPrivate.labelsFolder.configs[1].type).toBe('color');
    expect(phoenixMenuUIPrivate.labelsFolder.configs[2].type).toBe('button');
    expect(phoenixMenuUIPrivate.labelsFolder.parent).toBeInstanceOf(
      PhoenixMenuNode
    );
    expect(phoenixMenuUIPrivate.labelsFolder.parent.name).toBe('test');
  });

  it('should remove label from the menu and scene if it exists', () => {
    phoenixMenuUI.addLabelsFolder('test');
    phoenixMenuUI.removeLabel('test');

    expect(phoenixMenuUIPrivate.labelsFolder.childrenActive).toBeFalsy();
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
    phoenixMenuUI.addCollection('test', 'test');

    expect(phoenixMenuUIPrivate.eventFolder).toBeTruthy();
    expect(phoenixMenuUIPrivate.eventFolder.children.length).toBe(0);
  });

  it('should get the folder of the event data type', () => {
    phoenixMenuUI.addEventDataFolder();
    const eventDataFolder = phoenixMenuUI.getEventDataTypeFolder;

    expect(eventDataFolder).toBeInstanceOf(Function);
    expect(eventDataFolder.name).toBe('getEventDataTypeFolder');
  });

  it('should load previous state of the event data folder in Phoenix menu if any', () => {
    phoenixMenuUI.loadEventFolderState();

    if (phoenixMenuUIPrivate.eventFolderState) {
      expect(phoenixMenuUIPrivate.eventFolder).toBeTruthy();
    } else {
      expect(phoenixMenuUIPrivate.eventFolder).toBeNull();
    }
  });
});
