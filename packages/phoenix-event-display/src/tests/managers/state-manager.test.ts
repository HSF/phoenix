/**
 * @jest-environment jsdom
 */
import { PhoenixMenuNode } from '../../managers/ui-manager/phoenix-menu/phoenix-menu-node';
import { StateManager } from '../../managers/state-manager';
import { PerspectiveCamera } from 'three';
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
    stateManager.activeCamera = new PerspectiveCamera();
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
    const camera = new PerspectiveCamera();
    stateManager.setCamera(camera);
    expect(stateManager.activeCamera).toBe(camera);
  });

  it('should set the event display for state', () => {
    const eventDisplay = new EventDisplay();
    stateManager.setEventDisplay(eventDisplay);
    expect(stateManager.eventDisplay).toBe(eventDisplay);
  });

  describe('cut state serialization', () => {
    let mockPhoenixMenuUI: any;
    let mockUIManager: any;

    beforeEach(() => {
      mockPhoenixMenuUI = {
        getCollectionCuts: jest.fn().mockReturnValue({}),
        setCollectionCuts: jest.fn(),
        reapplyCollectionCuts: jest.fn(),
      };
      mockUIManager = {
        getPhoenixMenuUI: jest.fn().mockReturnValue(mockPhoenixMenuUI),
        setClipping: jest.fn(),
        rotateStartAngleClipping: jest.fn(),
        rotateOpeningAngleClipping: jest.fn(),
      };
      // Wire the mock eventDisplay to return our mock UIManager
      (stateManager as any).eventDisplay = {
        getUIManager: jest.fn().mockReturnValue(mockUIManager),
        getThreeManager: jest.fn().mockReturnValue({
          getControlsManager: jest.fn().mockReturnValue({
            getMainControls: jest.fn().mockReturnValue({
              target: { toArray: jest.fn().mockReturnValue([0, 0, 0]) },
            }),
          }),
        }),
      };
      stateManager.activeCamera = {
        position: { toArray: jest.fn().mockReturnValue([0, 0, 0]) },
      } as any;
    });

    it('should include a cuts key in getStateAsJSON output', () => {
      const state = stateManager.getStateAsJSON();
      expect(state).toHaveProperty('cuts');
    });

    it('should serialize active cuts from the registry', () => {
      const { Cut } = jest.requireActual('../../lib/models/cut.model');
      const cut = new Cut('eta', -0.5, 0.5, 0.1, true, true);
      mockPhoenixMenuUI.getCollectionCuts.mockReturnValue({ Tracks: [cut] });

      const state = stateManager.getStateAsJSON();

      expect(state['cuts']['Tracks']).toHaveLength(1);
      expect(state['cuts']['Tracks'][0].field).toBe('eta');
      expect(state['cuts']['Tracks'][0].minValue).toBe(-0.5);
    });

    it('should return empty cuts object when registry is empty', () => {
      mockPhoenixMenuUI.getCollectionCuts.mockReturnValue({});
      const state = stateManager.getStateAsJSON();
      expect(state['cuts']).toEqual({});
    });

    it('should return empty cuts when PhoenixMenuUI is unavailable', () => {
      mockUIManager.getPhoenixMenuUI.mockReturnValue(undefined);
      const state = stateManager.getStateAsJSON();
      expect(state['cuts']).toEqual({});
    });

    it('should exclude collections where all cuts are inactive', () => {
      const { Cut } = jest.requireActual('../../lib/models/cut.model');
      const cut = new Cut('phi', -3.14, 3.14);
      cut.minCutActive = false;
      cut.maxCutActive = false;
      mockPhoenixMenuUI.getCollectionCuts.mockReturnValue({ Tracks: [cut] });

      const state = stateManager.getStateAsJSON();
      expect(state['cuts']).toEqual({});
    });

    it('should call setCollectionCuts with reconstructed Cut instances on loadStateFromJSON', () => {
      stateManager.loadStateFromJSON({
        cuts: {
          Tracks: [
            {
              field: 'eta',
              minValue: -0.5,
              maxValue: 0.5,
              step: 0.1,
              minCutActive: true,
              maxCutActive: true,
            },
          ],
        },
      });

      expect(mockPhoenixMenuUI.setCollectionCuts).toHaveBeenCalledWith(
        'Tracks',
        expect.arrayContaining([
          expect.objectContaining({ field: 'eta', minValue: -0.5 }),
        ]),
      );
    });

    it('should call reapplyCollectionCuts once after restoring cuts', () => {
      stateManager.loadStateFromJSON({
        cuts: {
          Tracks: [
            {
              field: 'eta',
              minValue: -0.5,
              maxValue: 0.5,
              step: 0.1,
              minCutActive: true,
              maxCutActive: true,
            },
          ],
        },
      });
      expect(mockPhoenixMenuUI.reapplyCollectionCuts).toHaveBeenCalledTimes(1);
    });

    it('should not call cut methods when no cuts key is present in JSON', () => {
      stateManager.loadStateFromJSON({ eventDisplay: {} });
      expect(mockPhoenixMenuUI.setCollectionCuts).not.toHaveBeenCalled();
      expect(mockPhoenixMenuUI.reapplyCollectionCuts).not.toHaveBeenCalled();
    });

    it('should not throw when PhoenixMenuUI is unavailable during restore', () => {
      mockUIManager.getPhoenixMenuUI.mockReturnValue(undefined);
      expect(() =>
        stateManager.loadStateFromJSON({
          cuts: {
            Tracks: [
              {
                field: 'eta',
                minValue: -0.5,
                maxValue: 0.5,
                step: 0.1,
                minCutActive: true,
                maxCutActive: true,
              },
            ],
          },
        }),
      ).not.toThrow();
    });
  });
});
