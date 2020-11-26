import { EventDisplay } from "../event-display";
import { Camera } from "three";
import { PhoenixMenuNode } from "../ui/phoenix-menu/phoenix-menu-node";

/**
 * A singleton manager for managing the scene's state.
 */
export class StateManager {
  /** Instance of the state manager. */
  private static instance: StateManager;
  /** Root node of the phoenix menu. */
  phoenixMenuRoot: PhoenixMenuNode;
  /** Whether the clipping is enabled or not. */
  clippingEnabled: boolean;
  /** Angle of the clipping. */
  clippingAngle: number;
  /** The active camera. */
  activeCamera: Camera;
  /** The event display. */
  eventDisplay: EventDisplay;

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
      this.phoenixMenuRoot.addConfig('button', {
        label: 'Save state',
        onClick: () => {
          this.saveStateAsJSON();
        }
      }).addConfig('button', {
        label: 'Load state',
        onClick: () => {
          this.loadStateFromFile();
        }
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
        clippingAngle: this.clippingEnabled ? this.clippingAngle : null
      }
    };

    const blob = new Blob([JSON.stringify(state)], {
      type: 'application/json'
    });
    const tempAnchor = document.createElement('a');
    tempAnchor.href = URL.createObjectURL(blob);
    tempAnchor.download = 'phoenix-config.json';
    tempAnchor.click();
    tempAnchor.remove();
  }

  /**
   * Load data from JSON file.
   * @param onFileRead Callback with JSON file data when the file data is read.
   */
  loadStateFromFile(onFileRead?: (json: object) => void) {
    // Create a mock input file element and use that to read the file
    let inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = 'application/json';
    inputFile.onchange = (e: any) => {
      const configFile = e.target?.files[0];
      const reader = new FileReader();
      reader.onload = e => {
        const jsonData = JSON.parse(e.target.result.toString());

        onFileRead?.(jsonData);

        this.loadStateFromJSON(jsonData);

        inputFile.remove();
        inputFile = null;
      };
      reader.readAsText(configFile);
    }
    inputFile.click();
  }

  /**
   * Load the state from JSON.
   * @param json JSON for state.
   */
  loadStateFromJSON(json: string | object) {
    let jsonData: object;
    if (typeof json === 'string') {
      jsonData = JSON.parse(json);
    } else {
      jsonData = json;
    }

    if (jsonData['phoenixMenu']) {
      this.phoenixMenuRoot.loadStateFromJSON(jsonData['phoenixMenu']);
      this.phoenixMenuRoot.configActive = false;
    }

    if (jsonData['eventDisplay']) {
      this.activeCamera.position.fromArray(jsonData['eventDisplay']?.['cameraPosition']);
      if (jsonData['eventDisplay']?.['clippingAngle']) {
        this.eventDisplay.getUIManager().setClipping(true);
        this.eventDisplay.getUIManager().rotateClipping(jsonData['eventDisplay']['clippingAngle']);
      }
    }
  }

  /**
   * Set the state of clipping.
   * @param clipping Whether the clipping is enabled or not.
   */
  setClippingEnabled(clipping: boolean) {
    this.clippingEnabled = clipping;
  }

  /**
   * Set the angle of clipping.
   * @param angle Angle fo clipping.
   */
  setClippingAngle(angle: number) {
    this.clippingAngle = angle;
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
