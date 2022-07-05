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

  it('should get options from URL set through query parameters', () => {
    expect(urlOptionsManager.getURLOptions()).toBeInstanceOf(URLSearchParams);
  });
});
