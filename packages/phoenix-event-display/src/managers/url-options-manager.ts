import { JiveXMLLoader } from '../loaders/jivexml-loader';
import { PhoenixLoader } from '../loaders/phoenix-loader';
import type { Configuration } from '../lib/types/configuration';
import { EventDisplay } from '../event-display';
import { StateManager } from './state-manager';
import { readZipFile } from '../helpers/zip';
import { MAX_REMOTE_SESSION_BYTES } from './session-manager';

/**
 * Model for Phoenix URL options.
 */
export const phoenixURLOptions = {
  file: '',
  type: '',
  config: '',
  state: '',
  hideWidgets: false,
  embed: false,
  /** Inline base64-deflate session replay payload (#883). */
  replay: '',
  /** Remote URL pointing at a `.phnxreplay` JSON file (#883). */
  session: '',
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
    private configuration: Configuration,
  ) {
    const queryIndex = window.location.href.indexOf('?');
    this.urlOptions = new URLSearchParams(
      queryIndex !== -1 ? window.location.href.substring(queryIndex) : '',
    );
  }

  /**
   * Initialize and apply all URL options on page load.
   */
  public applyOptions() {
    // Initialize event with data from URL if there is any
    this.applyEventOptions(
      this.configuration.defaultEventFile?.eventFile,
      this.configuration.defaultEventFile?.eventType,
    );
    this.applyHideWidgetsOptions();
    this.applyEmbedOption();
    this.applySessionReplayOption();
  }

  /**
   * Initialize the event display with event data and configuration from URL.
   * (Only JiveXML and JSON)
   * @param defaultEventPath Default event path to fallback to if none in URL.
   * @param defaultEventType Default event type to fallback to if none in URL.
   */
  public applyEventOptions(
    defaultEventPath: string = '',
    defaultEventType: string = '',
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
        'WARNING - if you set one of type or file, then you need to set both!',
      );
      console.log('WARNING - reverting to defaults!');
    }

    if (!this.urlOptions.get('file') || !this.urlOptions.get('type')) {
      file = defaultEventPath;
      type = defaultEventType;
    } else {
      file = this.urlOptions.get('file') ?? '';
      type = this.urlOptions.get('type')?.toLowerCase() ?? '';
      console.log(
        'Default file(',
        defaultEventPath,
        ') was overridden by URL options to: ',
        file,
      );
    }

    console.log('Try to load event file: ', file, 'of type', type);
    // Try to load config from URL
    const loadConfig = () => {
      if (this.urlOptions.get('config')) {
        this.eventDisplay.getLoadingManager().addLoadableItem('url_config');
        fetch(this.urlOptions.get('config') ?? '')
          .then((res) => res.json())
          .then((jsonState) => {
            console.log(
              'Applying configuration ',
              this.urlOptions.get('config'),
              '  from urlOptions',
            );
            const stateManager = new StateManager();
            stateManager.loadStateFromJSON(jsonState);
          })
          .finally(() => {
            this.eventDisplay.getLoadingManager().itemLoaded('url_config');
            this.applyViewStateOption();
          });
      } else {
        this.applyViewStateOption();
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
    const fileData = await (
      await fetch(fileURL).then((response) => {
        if (response.status >= 400 && response.status < 600) {
          throw new Error('Bad response from server');
        }
        return response;
      })
    ).text();
    if (!this.configuration.eventDataLoader) {
      this.configuration.eventDataLoader = new JiveXMLLoader();
    }
    // Parse the XML to extract events and their data
    const loader = this.configuration.eventDataLoader as JiveXMLLoader;
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
    const jiveloader =
      this.configuration.eventDataLoader instanceof JiveXMLLoader
        ? (this.configuration.eventDataLoader as JiveXMLLoader)
        : new JiveXMLLoader();
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
   * Apply view state from the URL's "state" parameter.
   * Decodes a Base64-encoded JSON state and restores camera, clipping, and menu visibility.
   * Uses a load listener to ensure state applies after all other initialization completes.
   */
  private applyViewStateOption() {
    const stateParam = this.urlOptions.get('state');
    if (!stateParam) {
      return;
    }

    const applyState = async () => {
      try {
        const binary = atob(stateParam);
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        // Decompress the deflate-compressed state
        const stream = new Blob([bytes])
          .stream()
          .pipeThrough(new DecompressionStream('deflate'));
        const decompressed = await new Response(stream).arrayBuffer();
        const jsonString = new TextDecoder().decode(decompressed);
        const jsonState = JSON.parse(jsonString);
        console.log('Applying view state from URL');
        const stateManager = new StateManager();
        stateManager.loadStateFromJSON(jsonState);
      } catch (error) {
        console.error('Could not parse view state from URL.', error);
      }
    };

    this.eventDisplay.getLoadingManager().addLoadListenerWithCheck(() => {
      // Small delay to ensure experiment component's load listener runs first
      setTimeout(applyState, 200);
    });
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

  /**
   * Apply session replay options from the URL: `?replay=<base64>` for
   * inline sessions, `?session=<url>` for remote `.phnxreplay` JSON files.
   *
   * The payload is decoded and validated, then STAGED as pending; it does not
   * auto-play. Link-supplied content is untrusted, so the floating pill shows
   * the source and requires an explicit click before replaying. Deferred to
   * the load listener so the event/config/state apply first.
   */
  private applySessionReplayOption() {
    const replayParam = this.urlOptions.get('replay');
    const sessionParam = this.urlOptions.get('session');
    if (!replayParam && !sessionParam) return;

    const stageReplay = async () => {
      const sessionManager = this.eventDisplay.getSessionManager();
      try {
        if (replayParam) {
          await sessionManager.prepareFromBase64(replayParam, 'shared link');
        } else if (sessionParam) {
          const { text, host } = await this.fetchRemoteSession(sessionParam);
          sessionManager.prepareFromJsonText(text, host);
        }
      } catch (error) {
        console.error('Failed to load session replay from URL.', error);
        this.eventDisplay
          .getInfoLogger()
          .add('Could not load session replay from URL.', 'Error');
      }
    };

    this.eventDisplay.getLoadingManager().addLoadListenerWithCheck(() => {
      setTimeout(stageReplay, 400);
    });
  }

  /**
   * Fetch a remote `.phnxreplay` JSON file for the `?session=` option.
   * Hardened against abuse of the URL parameter:
   * - scheme allowlist (http/https only), blocking javascript:/data:/file:
   * - `credentials: 'omit'` so no cookies leak cross-origin
   * - `referrerPolicy: 'no-referrer'` so the target learns nothing about us
   * - a hard request timeout so a hung server cannot pin the loader
   * - a streamed size cap so an oversized body is aborted mid-download
   *   instead of being fully buffered first
   * @param rawUrl The user-supplied URL from `?session=`.
   * @returns The raw JSON text and the resolved host (for the confirm UI).
   * @throws Error on disallowed scheme, non-2xx, timeout, or oversize body.
   */
  private async fetchRemoteSession(
    rawUrl: string,
  ): Promise<{ text: string; host: string }> {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl, window.location.origin);
    } catch {
      throw new Error('Invalid session URL.');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(
        `Session URL scheme "${parsed.protocol}" is not allowed.`,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(parsed.toString(), {
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Session fetch failed with status ${res.status}.`);
      }

      // Stream the body and abort as soon as the running total exceeds the
      // cap, rather than buffering the whole (possibly huge) response first.
      const reader = res.body?.getReader();
      if (!reader) {
        const text = await res.text();
        if (text.length > MAX_REMOTE_SESSION_BYTES) {
          throw new Error('Session file is too large.');
        }
        return { text, host: parsed.host };
      }
      const chunks: Uint8Array[] = [];
      let total = 0;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_REMOTE_SESSION_BYTES) {
          controller.abort();
          throw new Error('Session file is too large.');
        }
        chunks.push(value);
      }
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return { text: new TextDecoder().decode(merged), host: parsed.host };
    } finally {
      clearTimeout(timeout);
    }
  }
}
