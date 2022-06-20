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

  test('getFromLocalStorage', () => {
    expect(getFromLocalStorage('test')).toEqual(undefined);
    setToLocalStorage('test', 'test');
    expect(getFromLocalStorage('test')).toEqual('test');
  });

  test('setToLocalStorage', () => {
    setToLocalStorage('test', 'test');
    expect(getFromLocalStorage('test')).toEqual('test');
  });

  test('clearLocalStorage', () => {
    setToLocalStorage('test', 'test2');
    expect(getFromLocalStorage('test')).toEqual('test2');
    localStorageMock.clear();
    expect(getFromLocalStorage('test')).toEqual(undefined);
  });

  test('Exception in localStorage : setLocalStorage', () => {
    try {
      localStorageMock.setItem('test3', 'test3');
    } catch (exception) {
      expect(exception).toHaveProperty('Exception in localStorage', exception);
    }
  });

  test('Exception in localStorage : getLocalStorage', () => {
    try {
      localStorageMock.getItem('test4');
    } catch (exception) {
      expect(exception).toHaveProperty('Exception in localStorage', exception);
    }
  });
});
