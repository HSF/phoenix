/**
 * @jest-environment jsdom
 */
import { InfoLogger } from '../../../helpers/info-logger';
import { ThreeManager } from '../../../managers/three-manager';
import { DatGUIMenuUI } from '../../../managers/ui-manager/dat-gui-ui';
import { GUI } from 'dat.gui';
import { Object3D } from 'three';

jest.mock('../../../managers/three-manager');

describe('DatGUIMenuUI', () => {
  let datGUIMenu: DatGUIMenuUI;
  let datGUIMenuPrivate: any;

  beforeEach(() => {
    datGUIMenu = new DatGUIMenuUI(
      'eventDisplay',
      new ThreeManager(new InfoLogger()),
    );
    datGUIMenuPrivate = datGUIMenu as any;
  });

  afterEach(() => {
    datGUIMenu.clear();
    datGUIMenu = undefined;
  });

  it('should create an instance', () => {
    expect(datGUIMenu).toBeTruthy();
  });

  it('should add geometry (detector geometry) folder to the menu', () => {
    datGUIMenu.addGeometryFolder();

    expect(datGUIMenuPrivate.geomFolder).toBeInstanceOf(GUI);
    expect(datGUIMenuPrivate.geomFolder.name).toBe('Geometries');
  });

  it('should add geometry to the menu geometry folder and set up its configurable options', () => {
    datGUIMenu.addGeometryFolder();
    datGUIMenu.addGeometry(new Object3D(), 'test');

    expect(datGUIMenuPrivate.geomFolder.__folders).toBeInstanceOf(Object);
  });

  it('should add folder for event data type like tracks or hits to the menu', () => {
    datGUIMenu.addEventDataFolder();
    datGUIMenu.addEventDataTypeFolder('Event Data');

    expect(
      datGUIMenuPrivate.eventFolder.__folders['Event Data'],
    ).toBeInstanceOf(GUI);
  });

  it('should add collection folder and its configurable options to the event data type (tracks, hits etc.) folder', () => {
    datGUIMenu.addEventDataFolder();
    datGUIMenu.addCollection('Event Data', 'test');

    expect(
      datGUIMenuPrivate.eventFolder.__folders['Event Data'],
    ).toBeUndefined();
  });

  it('should get the folder of the event data type', () => {
    datGUIMenu.addEventDataFolder();
    datGUIMenu.addEventDataTypeFolder('Event Data');
    const eventFolder = datGUIMenu.getEventDataTypeFolder('Event Data');

    expect(eventFolder).toBeInstanceOf(GUI);
  });

  it('should remove and restore geometry in dat.GUI', () => {
    const mockGeometries = { add: jest.fn(), remove: jest.fn() };
    datGUIMenuPrivate.sceneManager = {
      removeGeometry: jest.fn(),
      getGeometries: jest.fn().mockReturnValue(mockGeometries),
      objectVisibility: jest.fn(),
      wireframeGeometries: jest.fn(),
      getObjectByName: jest.fn().mockReturnValue(new Object3D()),
    };

    datGUIMenu.addGeometryFolder();
    const geom = new Object3D();
    geom.name = 'TestGeom';
    datGUIMenu.addGeometry(geom);

    expect(datGUIMenuPrivate.geomFolder.__folders['TestGeom']).toBeDefined();

    // Trigger remove
    datGUIMenuPrivate.guiParameters['TestGeom'].remove();

    expect(datGUIMenuPrivate.geomFolder.__folders['TestGeom']).toBeUndefined();
    expect(datGUIMenuPrivate.sceneManager.removeGeometry).toHaveBeenCalledWith(
      geom,
    );
    expect(datGUIMenuPrivate.restoreFolder).toBeDefined();

    // Restore
    datGUIMenu.restoreGeometry(geom);

    expect(mockGeometries.add).toHaveBeenCalledWith(geom);
    expect(datGUIMenuPrivate.geomFolder.__folders['TestGeom']).toBeDefined();
    expect(datGUIMenuPrivate.restoreFolder).toBeUndefined();
  });
});
