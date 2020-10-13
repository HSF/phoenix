import { PresetView } from './preset-view.model';
import { EventDataLoader } from '../event-data-loader';
import { PhoenixLoader } from '../loaders/phoenix-loader';
import { PhoenixMenuNode } from '../ui/phoenix-menu/phoenix-menu-node';

/**
 * Configuration for preset views and event data loader.
 */
export class Configuration {
  /** Preset views for switching event display camera. */
  presetViews: PresetView[];
  /** Event data loader responsible for processing and loading event data. */
  eventDataLoader: EventDataLoader;
  /** Root node of the phoenix menu. */
  phoenixMenuRoot: PhoenixMenuNode;
  /** Whether to enable dat.GUI menu or not. */
  enableDatGUIMenu: boolean;
  /** ID of the wrapper element. */
  elementId: string;

  /**
   * Constructor for the Configuration.
   * @param elementId ID of the wrapper element.
   * @param enableDatGUIMenu Whether to enable dat.GUI menu or not.
   */
  constructor(
    elementId: string = 'eventDisplay',
    enableDatGUIMenu: boolean = false
  ) {
    this.elementId = elementId;
    this.presetViews = [];
    this.eventDataLoader = new PhoenixLoader();
    this.enableDatGUIMenu = enableDatGUIMenu;
  }

  /**
   * Get if there are any preset views.
   * @returns If there are any preset views.
   */
  public anyPresetView(): boolean {
    return this.presetViews.length > 0;
  }

  /**
   * Set the event data loader to be used.
   * @param eventDataLoader Event data loader responsible for
   * processing and loading event data.
   */
  public setEventDataLoader(eventDataLoader: EventDataLoader) {
    this.eventDataLoader = eventDataLoader;
  }

  /**
   * Get the event data loader responsible for processing and loading event data.
   * @returns The event data loader.
   */
  public getEventDataLoader(): EventDataLoader {
    return this.eventDataLoader;
  }

  /**
   * Set he root node for phoenix menu.
   * @param phoenixMenuNode The phoenix menu node to be set as the root node.
   */
  public setPhoenixMenuRoot(phoenixMenuNode: PhoenixMenuNode) {
    this.phoenixMenuRoot = phoenixMenuNode;

    // Add save and load config buttons to the root node
    this.phoenixMenuRoot.addConfig('button', {
      label: 'Save state',
      onClick: () => {
        this.phoenixMenuRoot.saveStateAsJSON();
      }
    }).addConfig('button', {
      label: 'Load state',
      onClick: () => {
        this.phoenixMenuRoot.loadStateFromFile();
      }
    });
  }

  /**
   * Get he root node for phoenix menu.
   * @return The root node of phoenix menu.
   */
  public getPhoenixMenuRoot(): PhoenixMenuNode {
    return this.phoenixMenuRoot;
  }
}
