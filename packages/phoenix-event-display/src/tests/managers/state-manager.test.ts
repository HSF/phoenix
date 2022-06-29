/**
 * @jest-environment jsdom
 */
import { PhoenixMenuNode } from '../../managers/ui-manager/phoenix-menu/phoenix-menu-node';
import { StateManager } from '../../managers/state-manager';
import { Camera } from 'three';
import { EventDisplay } from '../../event-display';

jest.mock('../../event-display');

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  it('should create an instance', () => {
    expect(stateManager).toBeTruthy();
  });

  it('should get the instance of stateManager', () => {
    expect(StateManager.getInstance()).toBeTruthy();
  });

  it('should set the root node of Phoenix menu', () => {
    const phoenixMenuRoot = new PhoenixMenuNode('root');
    stateManager.setPhoenixMenuRoot(phoenixMenuRoot);
    expect(stateManager.phoenixMenuRoot).toBe(phoenixMenuRoot);
  });

  it('should set the state of clipping', () => {
    jest.spyOn(stateManager, 'setClippingEnabled');
    stateManager.setClippingEnabled(true);
    expect(stateManager.setClippingEnabled).toHaveBeenCalledWith(true);

    stateManager.setClippingEnabled(false);
    expect(stateManager.setClippingEnabled).toHaveBeenCalledWith(false);
  });

  it('should set the start clipping angle of clipping', () => {
    jest.spyOn(stateManager, 'setStartClippingAngle');
    stateManager.setStartClippingAngle(10);
    expect(stateManager.setStartClippingAngle).toHaveBeenCalledWith(10);
  });

  it('should get the start clipping angle of clipping', () => {
    stateManager.setStartClippingAngle(0);
    expect(stateManager.getStartClippingAngle()).toBe(0);
  });

  it('should set the opening clipping angle of clipping', () => {
    jest.spyOn(stateManager, 'setOpeningClippingAngle');
    stateManager.setOpeningClippingAngle(90);
    expect(stateManager.setOpeningClippingAngle).toHaveBeenCalledWith(90);
  });

  it('should get the opening clipping angle of clipping', () => {
    stateManager.setOpeningClippingAngle(0);
    expect(stateManager.getOpeningClippingAngle()).toBe(0);
  });

  it('should set the scene camera for stateManager', () => {
    const camera = new Camera();
    stateManager.setCamera(camera);
    expect(stateManager.activeCamera).toBe(camera);
  });

  it('should set the event display', () => {
    const eventDisplay = new EventDisplay();
    stateManager.setEventDisplay(eventDisplay);
    expect(stateManager.eventDisplay).toBe(eventDisplay);
  });
});
