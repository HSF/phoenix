/**
 * @jest-environment jsdom
 */
import {
  getFromLocalStorage,
  setToLocalStorage,
} from '../../../src/helpers/browser-storage';

describe('BrowserStorage', () => {
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem(key: string) {
        return store[key];
      },
      setItem(key: string, value: string) {
        store[key] = value.toString();
      },
      clear() {
        store = {};
      },
      removeItem(key: string | number) {
        delete store[key];
      },
    };
  })();
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  it('should get an item from local storage', () => {
    expect(getFromLocalStorage('test')).toEqual(undefined);
    setToLocalStorage('test', 'test');
    expect(getFromLocalStorage('test')).toEqual('test');
  });

  it('should set item to local storage', () => {
    setToLocalStorage('test2', 'test2');
    expect(getFromLocalStorage('test2')).toEqual('test2');
  });
});
