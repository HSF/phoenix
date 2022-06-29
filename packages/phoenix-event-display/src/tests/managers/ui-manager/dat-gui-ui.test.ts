/**
 * @jest-environment jsdom
 */
import { InfoLogger } from '../../../helpers/info-logger';
import { ThreeManager } from '../../../managers/three-manager';
import { DatGUIMenuUI } from '../../../managers/ui-manager/dat-gui-ui';

jest.mock('../../../managers/three-manager');

describe('DatGUIMenuUI', () => {
  let datGUIMenu: DatGUIMenuUI;

  beforeEach(() => {
    datGUIMenu = new DatGUIMenuUI(
      'eventDisplay',
      new ThreeManager(new InfoLogger())
    );
  });

  afterEach(() => {
    datGUIMenu.clear();
  });

  it('should create an instance', () => {
    expect(datGUIMenu).toBeTruthy();
  });

  it('should add geometry (detector geometry) folder to the menu', () => {
    jest.spyOn(datGUIMenu, 'addGeometryFolder');
    datGUIMenu.addGeometryFolder();
    expect(datGUIMenu.addGeometryFolder).toHaveBeenCalled();
  });

  it('should add event data folder with functions for event data toggles like show/hide and depthTest', () => {
    jest.spyOn(datGUIMenu, 'addEventDataFolder');
    datGUIMenu.addEventDataFolder();
    expect(datGUIMenu.addEventDataFolder).toHaveBeenCalled();
  });
});
