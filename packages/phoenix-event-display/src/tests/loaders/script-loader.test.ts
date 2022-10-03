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

  afterEach(() => {
    scriptLoader = undefined;
  });

  it('should create an instance', () => {
    expect(scriptLoader).toBeTruthy();
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

    expect(document.scripts.length).toBe(1);
    expect(document.scripts[0].src).toBe('http://localhost/' + scriptURL);
  });
});
