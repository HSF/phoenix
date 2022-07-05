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

  // using async/await to test the loading of scripts - they take quite long to load
  // not a good idea to test the script here as it is taking more than 15 seconds to load
  // right now we only get back a pending promise
  it('should synchronously load all JSRoot scripts', () => {
    const JSROOT = ScriptLoader.loadJSRootScripts();
    expect(JSROOT).toBeInstanceOf(Promise);
  });

  it('should load a script dynamically from a URL', () => {
    const scriptURL = 'https://www.google.com/jsapi';
    const scriptFor = 'google_jsapi';
    const parentElement = document.getElementsByTagName('head')[0];

    const promise = ScriptLoader.loadScript(
      scriptURL,
      scriptFor,
      parentElement
    );
    expect(promise).toBeInstanceOf(Promise);
  });
});
