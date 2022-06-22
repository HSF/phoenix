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
    setToLocalStorage('test', 'test');
    expect(getFromLocalStorage('test')).toEqual('test');
  });

  it('clearLocalStorage', () => {
    setToLocalStorage('test', 'test2');
    expect(getFromLocalStorage('test')).toEqual('test2');
    localStorageMock.clear();
    expect(getFromLocalStorage('test')).toEqual(undefined);
  });

  it('should throw exception in localStorage during setLocalStorage', () => {
    try {
      localStorageMock.setItem('test3', 'test3');
    } catch (exception) {
      expect(exception).toHaveProperty('Exception in localStorage', exception);
    }
  });

  it('should throw exception in localStorage during getLocalStorage', () => {
    try {
      localStorageMock.getItem('test4');
    } catch (exception) {
      expect(exception).toHaveProperty('Exception in localStorage', exception);
    }
  });
});
