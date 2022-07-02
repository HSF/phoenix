/**
 * @jest-environment jsdom
 */
import { ScriptLoader } from '../../loaders/script-loader';

describe('ScriptLoader', () => {
  let scriptLoader: ScriptLoader;

  beforeEach(() => {
    scriptLoader = new ScriptLoader();
  });

  it('should create an instance', () => {
    expect(scriptLoader).toBeTruthy();
  });

  it('should load a script dynamically from a URL', () => {
    const scriptURL = 'https://www.google.com/jsapi';
    const scriptFor = 'google_jsapi';
    const parentElement = document.getElementsByTagName('head')[0];

    jest.spyOn(ScriptLoader, 'loadScript');
    ScriptLoader.loadScript(scriptURL, scriptFor, parentElement);
    expect(ScriptLoader.loadScript).toHaveBeenCalledWith(
      scriptURL,
      scriptFor,
      parentElement
    );
  });
});
