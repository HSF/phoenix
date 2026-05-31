import { EventDisplay } from '../event-display';
import { Camera } from 'three';
import { PhoenixMenuNode } from './ui-manager/phoenix-menu/phoenix-menu-node';
import { loadFile, saveFile } from '../helpers/file';
import { ActiveVariable } from '../helpers/active-variable';
import { Cut, CutJSON } from '../lib/models/cut.model';

/** Map of collection name to array of serialized cuts, for JSON persistence. */
export interface CutStateJSON {
  [collectionName: string]: CutJSON[];
}
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
        .addConfig({
          type: 'button',
          label: 'Save state',
          onClick: () => {
            this.saveStateAsJSON();
          },
        })
        .addConfig({
          type: 'button',
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
   * Get the current state of the event display as a JSON object.
   * Now includes active cut state so Save State preserves filters.
   * @returns The state object with menu, camera, clipping, and cut data.
   */
  getStateAsJSON(): { [key: string]: any } {
    const controls = this.eventDisplay
      ?.getThreeManager()
      ?.getControlsManager()
      ?.getMainControls();

    return {
      phoenixMenu: this.phoenixMenuRoot?.getNodeState(),
      eventDisplay: {
        cameraPosition: this.activeCamera?.position.toArray(),
        cameraTarget: controls?.target?.toArray(),
        startClippingAngle: this.clippingEnabled.value
          ? this.startClippingAngle.value
          : null,
        openingClippingAngle: this.clippingEnabled.value
          ? this.openingClippingAngle.value
          : null,
      },
      cuts: this.getActiveCutsAsJSON(),
    };
  }

  /**
   * Serialize active cuts from PhoenixMenuUI into a plain JSON-safe object.
   * Only collections with at least one active cut bound are included.
   * Returns an empty object if no cuts are active or UI is unavailable.
   */
  private getActiveCutsAsJSON(): CutStateJSON {
    const phoenixMenuUI = this.eventDisplay
      ?.getUIManager()
      ?.getPhoenixMenuUI?.();

    if (!phoenixMenuUI) {
      return {};
    }

    const registry = phoenixMenuUI.getCollectionCuts(); // This returns object { [name: string]: Cut[] }
    const result: CutStateJSON = {};

    Object.entries(registry).forEach(([collectionName, cuts]) => {
      const activeCuts = cuts.filter(
        (cut) => cut.minCutActive || cut.maxCutActive,
      );
      if (activeCuts.length > 0) {
        result[collectionName] = activeCuts.map((cut) => cut.toJSON());
      }
    });

    return result;
  }
  /**
   * Save the state of the event display as JSON.
   */
  saveStateAsJSON() {
    const state = this.getStateAsJSON();

    saveFile(
      JSON.stringify(state),
      `run${this.eventMetadata.runNumber}_evt${this.eventMetadata.eventNumber}.json`,
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
      console.log('StateManager: Processing phoenixMenu configuration');
      this.phoenixMenuRoot.loadStateFromJSON(jsonData['phoenixMenu']);
      this.phoenixMenuRoot.configActive = false;
    }

    if (jsonData['eventDisplay']) {
      console.log('StateManager: Processing eventDisplay configuration');
      if (jsonData['eventDisplay']?.['cameraPosition']) {
        this.activeCamera.position.fromArray(
          jsonData['eventDisplay']['cameraPosition'],
        );
      }

      if (jsonData['eventDisplay']?.['cameraTarget']) {
        const controls = this.eventDisplay
          ?.getThreeManager()
          ?.getControlsManager()
          ?.getMainControls();
        if (controls) {
          controls.target.fromArray(jsonData['eventDisplay']['cameraTarget']);
          controls.update();
        }
      }

      const startAngle = jsonData['eventDisplay']?.['startClippingAngle'];
      const openingAngle = jsonData['eventDisplay']?.['openingClippingAngle'];

      if (startAngle || openingAngle) {
        this.setClippingEnabled(true);
        this.eventDisplay.getUIManager().setClipping(true);

        if (startAngle) {
          this.eventDisplay
            .getUIManager()
            .rotateStartAngleClipping(
              jsonData['eventDisplay']['startClippingAngle'],
            );
        }
        if (openingAngle) {
          this.eventDisplay
            .getUIManager()
            .rotateOpeningAngleClipping(
              jsonData['eventDisplay']['openingClippingAngle'],
            );
        }
      }
    }
    // Restore cut state if present in the saved JSON
    if (jsonData['cuts']) {
      this.restoreCutsFromJSON(jsonData['cuts'] as CutStateJSON);
    }
  }
  /**
   * Deserialize cut state from a saved JSON file, register the cuts back
   * into PhoenixMenuUI, and re-apply them to the currently loaded event.
   * @param cutsJSON The cuts section of a loaded state JSON file.
   */
  private restoreCutsFromJSON(cutsJSON: CutStateJSON): void {
    const phoenixMenuUI = this.eventDisplay
      ?.getUIManager()
      ?.getPhoenixMenuUI?.();

    if (!phoenixMenuUI) {
      console.warn(
        'StateManager: Cannot restore cuts — PhoenixMenuUI not available.',
      );
      return;
    }

    for (const [collectionName, cutJSONArray] of Object.entries(cutsJSON)) {
      if (Array.isArray(cutJSONArray) && cutJSONArray.length > 0) {
        const cuts = cutJSONArray.map((c) => Cut.fromJSON(c));
        phoenixMenuUI.setCollectionCuts(collectionName, cuts);
      }
    }

    phoenixMenuUI.reapplyCollectionCuts();
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
    return this.startClippingAngle.value ?? 0.0;
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
    return this.openingClippingAngle.value ?? 0.0;
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

  /**
   * Reset state manager for view transitions. Clears stale references.
   */
  resetForViewTransition() {
    this.phoenixMenuRoot = undefined;
    this.activeCamera = undefined;
    this.clippingEnabled = new ActiveVariable(false);
    this.startClippingAngle = new ActiveVariable(0);
    this.openingClippingAngle = new ActiveVariable(0);
    this.eventMetadata = { runNumber: '000', eventNumber: '000' };
  }
}
