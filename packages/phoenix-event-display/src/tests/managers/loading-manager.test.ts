import { LoadingManager } from '../../managers/loading-manager';

describe('LoadingManager', () => {
  let loadingManager: LoadingManager;

  beforeEach(() => {
    loadingManager = new LoadingManager();
  });

  afterEach(() => {
    loadingManager.reset();
    loadingManager = undefined;
  });

  it('should create an instance', () => {
    expect(loadingManager).toBeTruthy();
  });

  it('should call the listeners when all items have loaded', () => {
    const callback = jest.fn();
    loadingManager.addLoadListener(callback);
    loadingManager.addLoadableItem('item');
    loadingManager.itemLoaded('item');
    expect(callback).toHaveBeenCalled();
  });

  it('should call the function when loading of an item progresses', () => {
    const callback = jest.fn();
    loadingManager.addProgressListener(callback);
    loadingManager.addLoadableItem('item');
    loadingManager.onProgress('item', 50);
    expect(callback).toHaveBeenCalled();
  });

  it('should add a listener for when all items have loaded with check if there are any items to load when the listener is added', () => {
    loadingManager.addLoadableItem('item');
    loadingManager.itemLoaded('item');
    const callback = jest.fn();
    loadingManager.addLoadListenerWithCheck(callback);

    loadingManager.addLoadableItem('item2');
    expect(callback).toHaveBeenCalled();
  });
});
