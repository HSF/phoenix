/**
 * @jest-environment jsdom
 */
import { EventDisplay } from '../../event-display';
import { URLOptionsManager } from '../../managers/url-options-manager';
import { Configuration } from '../../lib/types/configuration';

jest.mock('../../event-display', () => {
  return {
    EventDisplay: jest.fn(),
  };
});

describe('URLOptionsManager', () => {
  let urlOptionsManager: URLOptionsManager;
  let urlOptionsManagerPrivate: any;
  let eventDisplay: EventDisplay;
  let configuration: Configuration;

  beforeEach(() => {
    eventDisplay = new EventDisplay();
    configuration = {
      elementId: 'elementId',
      allowUrlOptions: true,
    };
    urlOptionsManager = new URLOptionsManager(eventDisplay, configuration);
    urlOptionsManagerPrivate = urlOptionsManager;
  });

  afterEach(() => {
    urlOptionsManager = undefined;
  });

  it('should create an instance', () => {
    expect(urlOptionsManager).toBeTruthy();
  });

  it('should initialize and apply all URL options on page load', () => {
    jest.spyOn(urlOptionsManager, 'applyEventOptions');
    jest.spyOn(urlOptionsManager, 'applyHideWidgetsOptions');
    jest.spyOn(urlOptionsManager, 'applyEmbedOption');

    urlOptionsManager.applyOptions();

    expect(urlOptionsManager.applyEventOptions).toHaveBeenCalled();
    expect(urlOptionsManager.applyHideWidgetsOptions).toHaveBeenCalled();
    expect(urlOptionsManager.applyEmbedOption).toHaveBeenCalled();
  });

  it('should initialize the event display with event data and configuration from URL', () => {
    window.fetch = jest.fn();
    urlOptionsManager.applyOptions();

    jest.spyOn(urlOptionsManager['urlOptions'], 'get');

    urlOptionsManager.applyEventOptions();

    expect(urlOptionsManager['urlOptions'].get).toHaveBeenCalled();
  });

  it('should hide all overlay widgets if "hideWidgets" option from the URL is true', () => {
    jest.spyOn(urlOptionsManagerPrivate, 'hideIdsWithURLOption');

    const hideWidgetsOptions = {
      hideWidgets: [
        'mainLogo',
        'uiMenu',
        'experimentInfo',
        'phoenixMenu',
        'statsElement',
        'gui',
      ],
    };

    urlOptionsManager.applyHideWidgetsOptions();
    expect(urlOptionsManagerPrivate.hideIdsWithURLOption).toHaveBeenCalledWith(
      hideWidgetsOptions
    );
  });

  it('should hide all overlay widgets and enable embed menu if "hideWidgets" option from the URL is true', () => {
    urlOptionsManagerPrivate.urlOptions.set('embed', 'true');
    jest.spyOn(urlOptionsManagerPrivate, 'hideIdsWithURLOption');

    const hideWidgetsOptions = {
      embed: [
        'mainLogo',
        'uiMenu',
        'experimentInfo',
        'phoenixMenu',
        'statsElement',
        'gui',
      ],
    };

    urlOptionsManager.applyEmbedOption();
    expect(urlOptionsManagerPrivate.hideIdsWithURLOption).toHaveBeenCalledWith(
      hideWidgetsOptions
    );
  });

  it('should get options from URL set through query parameters', () => {
    expect(urlOptionsManager.getURLOptions()).toBeInstanceOf(URLSearchParams);
  });
});
