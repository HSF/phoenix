/**
 * @jest-environment jsdom
 */
import { LoadingManager } from '../../managers/loading-manager';
import { ScriptLoader } from '../../loaders/script-loader';

describe('ScriptLoader', () => {
  let scriptLoader: ScriptLoader;

  beforeEach(() => {
    scriptLoader = new ScriptLoader();
  });

  it('should create an instance', () => {
    expect(scriptLoader).toBeTruthy();
  });

  it('should synchronously load all JSRoot scripts', () => {
    const jsrootVersion: string = '6.3.4';
    const loadingManager = new LoadingManager();

    jest.spyOn(loadingManager, 'addLoadableItem');

    const JSROOT = ScriptLoader.loadJSRootScripts();

    expect(loadingManager.addLoadableItem).toHaveBeenCalledWith(
      'jsroot_scripts'
    );

    expect(document.scripts.length).toBe(1);
    expect(document.scripts[0].src).toBe(
      'https://cdn.jsdelivr.net/npm/jsroot' +
        `@${jsrootVersion}/scripts/JSRoot.core.js`
    );
  });

  it('should load a script dynamically from a URL', () => {
    const scriptURL = 'abc';
    const scriptFor = 'test';
    const parentElement = document.getElementsByTagName('head')[0];

    jest.spyOn(parentElement, 'appendChild');

    const promise = ScriptLoader.loadScript(
      scriptURL,
      scriptFor,
      parentElement
    );

    expect(parentElement.appendChild).toHaveBeenCalled();

    expect(document.scripts.length).toBe(2);
    expect(document.scripts[1].src).toBe('http://localhost/' + scriptURL);
  });
});
