import { EventDisplay } from '../event-display';
import { Camera } from 'three';
import { PhoenixMenuNode } from './ui-manager/phoenix-menu/phoenix-menu-node';
import { loadFile, saveFile } from '../helpers/file';
import { ActiveVariable } from '../helpers/active-variable';

/**
 * A singleton manager for managing the scene's state.
 */
export class StateManager {
  /** Instance of the state manager. */
  private static instance: StateManager;
  /** Root node of the phoenix menu. */
  phoenixMenuRoot: PhoenixMenuNode;
  /** Whether the clipping is enabled or not. */
  clippingEnabled = new ActiveVariable(false);
  /** Angle of the clipping. */
  clippingAngle = new ActiveVariable(0);
  /** The active camera. */
  activeCamera: Camera;
  /** The event display. */
  eventDisplay: EventDisplay;
  /** Current loaded event's metadata. */
  eventMetadata: { runNumber: string; eventNumber: string } = {
    runNumber: '000',
    eventNumber: '000',
  };

  /**
   * Create the state manager.
   * @returns The state manager instance.
   */
  constructor() {
    if (StateManager.instance === undefined) {
      StateManager.instance = this;
    }
    return StateManager.instance;
  }

  /**
   * Get the instance of state manager.
   * @returns The state manager instance.
   */
  static getInstance(): StateManager {
    return StateManager.instance;
  }

  /**
   * Set the root node of Phoenix menu.
   * @param phoenixMenuRoot Phoenix menu root node.
   */
  setPhoenixMenuRoot(phoenixMenuRoot: PhoenixMenuNode) {
    this.phoenixMenuRoot = phoenixMenuRoot;

    if (this.phoenixMenuRoot) {
      // Add save and load config buttons to the root node
      this.phoenixMenuRoot
        .addConfig('button', {
          label: 'Save state',
          onClick: () => {
            this.saveStateAsJSON();
          },
        })
        .addConfig('button', {
          label: 'Load state',
          onClick: () => {
            loadFile((data) => {
              this.loadStateFromJSON(JSON.parse(data));
            });
          },
        });
    }
  }

  /**
   * Save the state of the event display as JSON.
   */
  saveStateAsJSON() {
    const state: object = {
      phoenixMenu: this.phoenixMenuRoot.getNodeState(),
      eventDisplay: {
        cameraPosition: this.activeCamera.position.toArray(),
        clippingAngle: this.clippingEnabled ? this.clippingAngle : null,
      },
    };

    saveFile(
      JSON.stringify(state),
      `run${this.eventMetadata.runNumber}_evt${this.eventMetadata.eventNumber}.json`
    );
  }

  /**
   * Load the state from JSON.
   * @param json JSON for state.
   */
  loadStateFromJSON(json: string | object) {
    const jsonData: object = typeof json === 'string' ? JSON.parse(json) : json;

    if (jsonData['phoenixMenu']) {
      this.phoenixMenuRoot.loadStateFromJSON(jsonData['phoenixMenu']);
      this.phoenixMenuRoot.configActive = false;
    }

    if (jsonData['eventDisplay']) {
      this.activeCamera.position.fromArray(
        jsonData['eventDisplay']?.['cameraPosition']
      );
      if (jsonData['eventDisplay']?.['clippingAngle']) {
        this.setClippingEnabled(true);
        this.eventDisplay.getUIManager().setClipping(true);
        this.eventDisplay
          .getUIManager()
          .rotateClipping(jsonData['eventDisplay']['clippingAngle']);
      }
    }
  }

  /**
   * Set the state of clipping.
   * @param clipping Whether the clipping is enabled or not.
   */
  setClippingEnabled(clipping: boolean) {
    this.clippingEnabled.update(clipping);
  }

  /**
   * Set the angle of clipping.
   * @param angle Angle fo clipping.
   */
  setClippingAngle(angle: number) {
    this.clippingAngle.update(angle);
  }

  /**
   * Set the scene camera for state.
   * @param camera The camera.
   */
  setCamera(camera: Camera) {
    this.activeCamera = camera;
  }

  /**
   * Set the event display.
   * @param eventDisplay The event display.
   */
  setEventDisplay(eventDisplay: EventDisplay) {
    this.eventDisplay = eventDisplay;
  }
}
