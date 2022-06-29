import { LoadingManager } from '../../managers/loading-manager';

describe('LoadingManager', () => {
  let loadingManager: LoadingManager;

  beforeEach(() => {
    loadingManager = new LoadingManager();
  });

  afterEach(() => {
    loadingManager.reset();
  });

  it('should create an instance', () => {
    expect(loadingManager).toBeTruthy();
  });

  it('should add an item which is to be loaded', () => {
    loadingManager.addLoadableItem('item');
    expect(loadingManager.toLoad.length).toBe(1);
  });

  it('should call the function when an item has finished loading', () => {
    jest.spyOn(loadingManager, 'itemLoaded');
    loadingManager.addLoadableItem('item');
    loadingManager.itemLoaded('item');
    expect(loadingManager.itemLoaded).toHaveBeenCalled();
  });

  it('should call the function when loading of an item progresses', () => {
    jest.spyOn(loadingManager, 'onProgress');
    loadingManager.addLoadableItem('item');
    loadingManager.onProgress('item', 50);
    expect(loadingManager.onProgress).toHaveBeenCalled();
  });

  it('should add a listener for when all items have loaded', () => {
    jest.spyOn(loadingManager, 'addLoadListener');
    loadingManager.addLoadListener(() => {});
    expect(loadingManager.addLoadListener).toHaveBeenCalled();
  });

  it('should add a listener for when all items have loaded with check if there', () => {
    jest.spyOn(loadingManager, 'addLoadListenerWithCheck');
    loadingManager.addLoadListenerWithCheck(() => {});
    expect(loadingManager.addLoadListenerWithCheck).toHaveBeenCalled();
  });

  it('should add a callback to listen when the progress of an item increases', () => {
    jest.spyOn(loadingManager, 'addProgressListener');
    loadingManager.addProgressListener(() => {});
    expect(loadingManager.addProgressListener).toHaveBeenCalled();
  });
});
