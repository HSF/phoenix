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
  /** Starting angle of the clipping. */
  startClippingAngle = new ActiveVariable(0);
  /** Opening angle of the clipping. */
  openingClippingAngle = new ActiveVariable(0);
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
    const state: { [key: string]: any } = {
      phoenixMenu: this.phoenixMenuRoot.getNodeState(),
      eventDisplay: {
        cameraPosition: this.activeCamera.position.toArray(),
        startClippingAngle: this.clippingEnabled.value
          ? this.startClippingAngle.value
          : null,
        openingClippingAngle: this.clippingEnabled.value
          ? this.openingClippingAngle.value
          : null,
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
  loadStateFromJSON(json: string | { [key: string]: any }) {
    const jsonData: { [key: string]: any } =
      typeof json === 'string' ? JSON.parse(json) : json;

    if (jsonData['phoenixMenu'] && this.phoenixMenuRoot) {
      this.phoenixMenuRoot.loadStateFromJSON(jsonData['phoenixMenu']);
      this.phoenixMenuRoot.configActive = false;
    }

    if (jsonData['eventDisplay']) {
      this.activeCamera.position.fromArray(
        jsonData['eventDisplay']?.['cameraPosition']
      );

      const startAngle = jsonData['eventDisplay']?.['startClippingAngle'];
      const openingAngle = jsonData['eventDisplay']?.['openingClippingAngle'];

      if (startAngle || openingAngle) {
        this.setClippingEnabled(true);
        this.eventDisplay.getUIManager().setClipping(true);

        if (startAngle) {
          this.eventDisplay
            .getUIManager()
            .rotateStartAngleClipping(
              jsonData['eventDisplay']['startClippingAngle']
            );
        }
        if (openingAngle) {
          this.eventDisplay
            .getUIManager()
            .rotateOpeningAngleClipping(
              jsonData['eventDisplay']['openingClippingAngle']
            );
        }
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
   * Set the start clipping angle of clipping.
   * @param angle Angle for clipping.
   */
  setStartClippingAngle(angle: number) {
    this.startClippingAngle.update(angle);
  }

  /**
   * Get the start clipping angle of clipping.
   * @returns The starting angle of clipping.
   */
  getStartClippingAngle(): number {
    return this.startClippingAngle.value;
  }

  /**
   * Set the opening angle of clipping.
   * @param angle Angle for clipping.
   */
  setOpeningClippingAngle(angle: number) {
    this.openingClippingAngle.update(angle);
  }

  /**
   * Get the opening angle of clipping.
   * @returns The opening angle of clipping.
   */
  getOpeningClippingAngle(): number {
    return this.openingClippingAngle.value;
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
