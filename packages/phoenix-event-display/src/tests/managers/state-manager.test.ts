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
