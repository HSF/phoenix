/**
 * @jest-environment jsdom
 */
import { EventDisplay } from '../../event-display';
import { URLOptionsManager } from '../../managers/url-options-manager';
import { Configuration } from '../../lib/types/configuration';

jest.mock('../../event-display');

describe('URLOptionsManager', () => {
  let urlOptionsManager: URLOptionsManager;
  let eventDisplay: EventDisplay;
  let configuration: Configuration;

  beforeEach(() => {
    eventDisplay = new EventDisplay();
    urlOptionsManager = new URLOptionsManager(eventDisplay, configuration);
  });

  it('should create an instance', () => {
    expect(urlOptionsManager).toBeTruthy();
  });

  it('should initialize the event display with event data and configuration from URL', () => {
    jest.spyOn(urlOptionsManager, 'applyEventOptions');
    urlOptionsManager.applyEventOptions('defaultEventPath', 'defaultEventType');
    expect(urlOptionsManager.applyEventOptions).toHaveBeenCalledWith(
      'defaultEventPath',
      'defaultEventType'
    );
  });

  it('should hide all overlay widgets if "hideWidgets" option from the URL is true', () => {
    jest.spyOn(urlOptionsManager, 'applyHideWidgetsOptions');
    urlOptionsManager.applyHideWidgetsOptions();
    expect(urlOptionsManager.applyHideWidgetsOptions).toHaveBeenCalled();
  });

  it('should hide all overlay widgets and enable embed menu if "hideWidgets" option from the URL is true', () => {
    jest.spyOn(urlOptionsManager, 'applyEmbedOption');
    urlOptionsManager.applyEmbedOption();
    expect(urlOptionsManager.applyEmbedOption).toHaveBeenCalled();
  });

  it('should get options from URL set through query parameters', () => {
    jest.spyOn(urlOptionsManager, 'getURLOptions');
    urlOptionsManager.getURLOptions();
    expect(urlOptionsManager.getURLOptions).toHaveBeenCalled();
  });
});
