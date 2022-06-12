import { JiveXMLLoader } from '../loaders/jivexml-loader';
import { PhoenixLoader } from '../loaders/phoenix-loader';
import { Configuration } from '../lib/types/configuration';
import { EventDisplay } from '../event-display';
import { StateManager } from './state-manager';

/**
 * Model for Phoenix URL options.
 */
export const phoenixURLOptions = {
  file: '',
  type: '',
  config: '',
  hideWidgets: false,
  embed: false,
};

/**
 * A manager for managing options given through URL.
 */
export class URLOptionsManager {
  /** Variable containing all URL search parameters. */
  private urlOptions: URLSearchParams;

  /**
   * Constructor for the URL options manager.
   * @param eventDisplay The Phoenix event display.
   * @param configuration Configuration of the event display.
   */
  constructor(
    private eventDisplay: EventDisplay,
    private configuration: Configuration
  ) {
    this.urlOptions = new URLSearchParams(
      window.location.href.substr(window.location.href.lastIndexOf('?'))
    );
  }

  /**
   * Initialize and apply all URL options on page load.
   */
  public applyOptions() {
    // Initialize event with data from URL if there is any
    this.applyEventOptions(
      this.configuration.defaultEventFile?.eventFile,
      this.configuration.defaultEventFile?.eventType
    );
    this.applyHideWidgetsOptions();
    this.applyEmbedOption();
  }

  /**
   * Initialize the event display with event data and configuration from URL.
   * (Only JiveXML and JSON)
   * @param defaultEventPath Default event path to fallback to if none in URL.
   * @param defaultEventType Default event type to fallback to if none in URL.
   */
  public applyEventOptions(
    defaultEventPath?: string,
    defaultEventType?: string
  ) {
    if (!('fetch' in window)) {
      return;
    }

    let file: string, type: string;

    if (!this.urlOptions.get('file') || !this.urlOptions.get('type')) {
      file = defaultEventPath;
      type = defaultEventType;
    } else {
      file = this.urlOptions.get('file');
      type = this.urlOptions.get('type').toLowerCase();
    }

    // Load config from URL
    const loadConfig = () => {
      if (this.urlOptions.get('config')) {
        this.eventDisplay.getLoadingManager().addLoadableItem('url_config');
        fetch(this.urlOptions.get('config'))
          .then((res) => res.json())
          .then((jsonState) => {
            const stateManager = new StateManager();
            stateManager.loadStateFromJSON(jsonState);
          })
          .finally(() => {
            this.eventDisplay.getLoadingManager().itemLoaded('url_config');
          });
      }
    };

    // Load event file from URL
    if (file && type) {
      this.eventDisplay.getLoadingManager().addLoadableItem('url_event');
      fetch(file)
        .then((res) => (type === 'jivexml' ? res.text() : res.json()))
        .then((res: { [key: string]: any } | string) => {
          if (type === 'jivexml') {
            const loader = new JiveXMLLoader();
            this.configuration.eventDataLoader = loader;
            // Parse the JSON to extract events and their data
            loader.process(res);
            const eventData = loader.getEventData();
            this.eventDisplay.buildEventDataFromJSON(eventData);
          } else {
            this.configuration.eventDataLoader = new PhoenixLoader();
            this.eventDisplay.parsePhoenixEvents(res);
          }
        })
        .catch((error) => {
          this.eventDisplay
            .getInfoLogger()
            .add('Could not find the file specified in URL.', 'Error');
          console.error('Could not find the file specified in URL.', error);
        })
        .finally(() => {
          // Load config from URL after loading the event
          loadConfig();
          this.eventDisplay.getLoadingManager().itemLoaded('url_event');
        });
    } else {
      loadConfig();
    }
  }

  /**
   * Hide all overlay widgets if "hideWidgets" option from the URL is true.
   */
  public applyHideWidgetsOptions() {
    const hideWidgetsOptions = {
      hideWidgets: [
        'mainLogo', // Main logo
        'uiMenu', // UI menu
        'experimentInfo', // Experiment info
        'phoenixMenu', // Phoenix menu
        'statsElement', // Stats at the bottom left
        'gui', // dat.GUI menu
      ],
    };

    this.hideIdsWithURLOption(hideWidgetsOptions);
  }

  /**
   * Hide all overlay widgets and enable embed menu if "hideWidgets" option from the URL is true.
   */
  public applyEmbedOption() {
    if (this.urlOptions.get('embed') === 'true') {
      const hideWidgetsOptions = {
        embed: [
          'mainLogo', // Main logo
          'uiMenu', // UI menu
          'experimentInfo', // Experiment info
          'phoenixMenu', // Phoenix menu
          'statsElement', // Stats at the bottom left
          'gui', // dat.GUI menu
        ],
      };

      this.hideIdsWithURLOption(hideWidgetsOptions);

      document
        .getElementById('embedMenu')
        ?.style.setProperty('display', 'block');
    }
  }

  /**
   * Hide element with IDs based on a URL option.
   * @param urlOptionWithIds IDs to hide with keys as the URL option and its array value as IDs.
   */
  private hideIdsWithURLOption(urlOptionWithIds: { [key: string]: string[] }) {
    Object.entries(urlOptionWithIds).forEach(([urlOption, idsToHide]) => {
      if (this.urlOptions.get(urlOption) === 'true') {
        idsToHide.forEach((singleId) => {
          document
            .getElementById(singleId)
            ?.style.setProperty('display', 'none');
        });
      }
    });
  }

  /**
   * Get options from URL set through query parameters.
   * @returns URL options.
   */
  public getURLOptions() {
    return this.urlOptions;
  }
}
