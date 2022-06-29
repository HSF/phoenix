/**
 * @jest-environment jsdom
 */
import { InfoLogger } from '../../../../helpers/info-logger';
import { ThreeManager } from '../../../../managers/three-manager';
import { PhoenixMenuNode } from '../../../../managers/ui-manager/phoenix-menu/phoenix-menu-node';
import { PhoenixMenuUI } from '../../../../managers/ui-manager/phoenix-menu/phoenix-menu-ui';

jest.mock('../../../../managers/three-manager');

describe('PhoenixMenuUI', () => {
  let phoenixMenuUI: PhoenixMenuUI;
  let phoenixMenuRoot: PhoenixMenuNode;
  let three: ThreeManager;

  beforeEach(() => {
    three = new ThreeManager(new InfoLogger());
    phoenixMenuRoot = new PhoenixMenuNode('test');
    phoenixMenuUI = new PhoenixMenuUI(phoenixMenuRoot, three);
  });

  afterEach(() => {
    phoenixMenuUI.clear();
  });

  it('should create an instance', () => {
    expect(phoenixMenuUI).toBeTruthy();
  });

  it('should clear the menu by removing all folders and items', () => {
    jest.spyOn(phoenixMenuUI, 'clear');
    phoenixMenuUI.clear();
    expect(phoenixMenuUI.clear).toHaveBeenCalled();
  });

  it('should add geometry (detector geometry) folder to the menu', () => {
    jest.spyOn(phoenixMenuUI, 'addGeometryFolder');
    phoenixMenuUI.addGeometryFolder();
    expect(phoenixMenuUI.addGeometryFolder).toHaveBeenCalled();
  });

  it('should add event data folder with functions for event data toggles like show/hide and depthTest', () => {
    jest.spyOn(phoenixMenuUI, 'addEventDataFolder');
    phoenixMenuUI.addEventDataFolder();
    expect(phoenixMenuUI.addEventDataFolder).toHaveBeenCalled();
  });

  it('should add labels folder to the menu', () => {
    jest.spyOn(phoenixMenuUI, 'addLabelsFolder');
    phoenixMenuUI.addLabelsFolder('test');
    expect(phoenixMenuUI.addLabelsFolder).toHaveBeenCalledWith('test');
  });

  it('should remove label from the menu and scene if it exists', () => {
    jest.spyOn(phoenixMenuUI, 'removeLabel');
    phoenixMenuUI.removeLabel('labelId');
    expect(phoenixMenuUI.removeLabel).toHaveBeenCalledWith('labelId');
  });

  it('should load previous state of the event data folder in Phoenix menu if any', () => {
    jest.spyOn(phoenixMenuUI, 'loadEventFolderState');
    phoenixMenuUI.loadEventFolderState();
    expect(phoenixMenuUI.loadEventFolderState).toHaveBeenCalled();
  });
});
