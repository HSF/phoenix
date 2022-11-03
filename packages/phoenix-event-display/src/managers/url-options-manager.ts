import { JiveXMLLoader } from '../loaders/jivexml-loader';
import { PhoenixLoader } from '../loaders/phoenix-loader';
import { Configuration } from '../lib/types/configuration';
import { EventDisplay } from '../event-display';
import { StateManager } from './state-manager';
import { readZipFile } from '../helpers/zip';

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

    if (
      (!this.urlOptions.get('file') && this.urlOptions.get('type')) ||
      (this.urlOptions.get('file') && !this.urlOptions.get('type'))
    ) {
      console.log(
        'WARNING - if you set one of type or file, then you need to set both!'
      );
      console.log('WARNING - reverting to defaults!');
    }

    if (!this.urlOptions.get('file') || !this.urlOptions.get('type')) {
      console.log('Setting and config from defaults');
      file = defaultEventPath;
      type = defaultEventType;
    } else {
      console.log('Setting and config from urlOptions');
      file = this.urlOptions.get('file');
      type = this.urlOptions.get('type').toLowerCase();
    }

    console.log('Loading ', file, 'of type', type);
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

    const processEventFile = (fileURL: string) => {
      if (type === 'jivexml') {
        console.log('Opening JiveXML');
        return this.handleJiveXMLEvent(fileURL);
      } else if (type === 'zip') {
        console.log('Opening zip file');
        return this.handleZipFileEvents(fileURL);
      } else {
        return this.handleJSONEvent(fileURL);
      }
    };

    // Load event file from URL
    if (file && type) {
      this.eventDisplay.getLoadingManager().addLoadableItem('url_event');
      processEventFile(file)
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
   * Handle JiveXML event from file URL.
   * @param fileURL URL to the XML file.
   * @returns An empty promise. ;(
   */
  private async handleJiveXMLEvent(fileURL: string) {
    const fileData = await (await fetch(fileURL)).text();
    const loader = new JiveXMLLoader();
    this.configuration.eventDataLoader = loader;
    // Parse the XML to extract events and their data
    loader.process(fileData);
    const eventData = loader.getEventData();
    this.eventDisplay.buildEventDataFromJSON(eventData);
  }

  /**
   * Handle JSON event from file URL.
   * @param fileURL URL to the JSON file.
   * @returns An empty promise. ;(
   */
  private async handleJSONEvent(fileURL: string) {
    const fileData = await (await fetch(fileURL)).json();
    this.configuration.eventDataLoader = new PhoenixLoader();
    this.eventDisplay.parsePhoenixEvents(fileData);
  }

  /**
   * Handle zip containing event data files.
   * @param fileURL URL to the zip file.
   * @returns An empty promise. ;(
   */
  private async handleZipFileEvents(fileURL: string) {
    const fileBuffer = await (await fetch(fileURL)).arrayBuffer();
    const allEventsObject = {};
    let filesWithData: { [fileName: string]: string };

    // Using a try catch block to catch any errors in Promises
    try {
      filesWithData = await readZipFile(fileBuffer);
    } catch (error) {
      console.error('Error while reading zip', error);
      this.eventDisplay.getInfoLogger().add('Could not read zip file', 'Error');
      return;
    }

    // JSON event data
    Object.keys(filesWithData)
      .filter((fileName) => fileName.endsWith('.json'))
      .forEach((fileName) => {
        Object.assign(allEventsObject, JSON.parse(filesWithData[fileName]));
      });

    // JiveXML event data
    const jiveloader = new JiveXMLLoader();
    Object.keys(filesWithData)
      .filter((fileName) => {
        return fileName.endsWith('.xml') || fileName.startsWith('JiveXML');
      })
      .forEach((fileName) => {
        jiveloader.process(filesWithData[fileName]);
        const eventData = jiveloader.getEventData();
        Object.assign(allEventsObject, { [fileName]: eventData });
      });
    // For some reason the above doesn't pick up JiveXML_XXX_YYY.zip

    this.eventDisplay.parsePhoenixEvents(allEventsObject);
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
