/**
 * @jest-environment jsdom
 */
import { PhoenixMenuNode } from '../../managers/ui-manager/phoenix-menu/phoenix-menu-node';
import { StateManager } from '../../managers/state-manager';
import { Camera } from 'three';
import { EventDisplay } from '../../event-display';
import * as file from '../../helpers/file';

jest.mock('../../event-display');

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  afterEach(() => {
    stateManager = undefined;
  });

  it('should create an instance', () => {
    expect(stateManager).toBeTruthy();
  });

  it('should get the same instance of StateManager each time we create a new object', () => {
    expect(new StateManager()).toBe(stateManager);
    expect(StateManager.getInstance()).toBe(stateManager);
  });

  it('should set the root node of Phoenix menu', () => {
    const phoenixMenuRoot = new PhoenixMenuNode('root');
    stateManager.setPhoenixMenuRoot(phoenixMenuRoot);
    expect(stateManager.phoenixMenuRoot).toBe(phoenixMenuRoot);
  });

  it('should save the state of the event display as JSON', () => {
    stateManager.activeCamera = new Camera();
    global.URL.createObjectURL = jest.fn();

    jest.spyOn(stateManager.phoenixMenuRoot, 'getNodeState');
    jest.spyOn(file, 'saveFile');

    stateManager.saveStateAsJSON();

    expect(stateManager.phoenixMenuRoot.getNodeState).toHaveBeenCalled();
    expect(file.saveFile).toHaveBeenCalled();

    expect(stateManager.eventMetadata.runNumber).toBe('000');
    expect(stateManager.eventMetadata.eventNumber).toBe('000');
  });

  it('should load the state of the event display from JSON', () => {
    stateManager.phoenixMenuRoot = new PhoenixMenuNode('root');

    const jsonData = {
      eventDisplay: {
        startClippingAngle: 0,
        openingClippingAngle: 0,
        cameraPosition: { x: 1, y: 2, z: 3 },
      },
    };

    jest.spyOn(stateManager, 'setClippingEnabled');

    stateManager.loadStateFromJSON(JSON.stringify(jsonData));

    expect(stateManager.setClippingEnabled).not.toHaveBeenCalledWith(true);
  });

  it('should set the state of clipping', () => {
    stateManager.setClippingEnabled(true);
    expect(stateManager.clippingEnabled.value).toBe(true);

    stateManager.setClippingEnabled(false);
    expect(stateManager.clippingEnabled.value).toBe(false);
  });

  it('should set the start clipping angle of clipping', () => {
    stateManager.setStartClippingAngle(0);
    expect(stateManager.startClippingAngle.value).toBe(0);

    stateManager.setStartClippingAngle(90);
    expect(stateManager.startClippingAngle.value).toBe(90);
  });

  it('should get the start clipping angle of clipping', () => {
    stateManager.setStartClippingAngle(70);
    expect(stateManager.getStartClippingAngle()).toBe(70);

    stateManager.setStartClippingAngle(88);
    expect(stateManager.getStartClippingAngle()).toBe(88);
  });

  it('should set the opening clipping angle of clipping', () => {
    stateManager.setOpeningClippingAngle(50);
    expect(stateManager.openingClippingAngle.value).toBe(50);

    stateManager.setOpeningClippingAngle(100);
    expect(stateManager.openingClippingAngle.value).toBe(100);
  });

  it('should get the opening clipping angle of clipping', () => {
    stateManager.setOpeningClippingAngle(70);
    expect(stateManager.getOpeningClippingAngle()).toBe(70);

    stateManager.setOpeningClippingAngle(80);
    expect(stateManager.getOpeningClippingAngle()).toBe(80);
  });

  it('should set the scene camera for state', () => {
    const camera = new Camera();
    stateManager.setCamera(camera);
    expect(stateManager.activeCamera).toBe(camera);
  });

  it('should set the event display for state', () => {
    const eventDisplay = new EventDisplay();
    stateManager.setEventDisplay(eventDisplay);
    expect(stateManager.eventDisplay).toBe(eventDisplay);
  });
});
