/**
 * Phoenix loading manager for managing loadable items.
 */
export class LoadingManager {
  /** Instance of the loading manager */
  private static instance: LoadingManager;

  /** Items to load. */
  public toLoad: string[] = [];
  /** Items loaded */
  public loaded: string[] = [];

  /** Callbacks to call on load. */
  private onLoadCallbacks: (() => void)[] = [];
  /** Callbacks to call on progress. */
  private onProgressCallbacks: ((progress: number) => void)[] = [];

  /** Progress for each named item. */
  private progressItems: { [key: string]: number } = {};

  /**
   * Create the singleton Phoenix loading manager.
   * @returns The loading manager instance.
   */
  constructor() {
    if (LoadingManager.instance === undefined) {
      LoadingManager.instance = this;
    }

    return LoadingManager.instance;
  }

  /**
   * Add an item which is to be loaded.
   * @param id ID of the item to be loaded.
   */
  public addLoadableItem(id: string = '') {
    this.toLoad.push(id);
    this.progressItems[id] = 0;
  }

  /**
   * Function to call when an item has finished loading.
   * @param id ID of the item loaded.
   */
  public itemLoaded(id: string = '') {
    this.loaded.push(id);
    this.onProgress(id, 100);

    if (
      this.toLoad.length === this.loaded.length &&
      this.toLoad.sort().join(',') === this.loaded.sort().join(',')
    ) {
      this.onLoadCallbacks.forEach((callback) => callback());
      this.reset();
    }
  }

  /**
   * Function to call when loading of an item progresses.
   * @param id ID of the item with the progress.
   * @param progress Progress of the item.
   */
  public onProgress(id: string, progress: number) {
    this.progressItems[id] = progress;

    const totalProgress = Object.values(this.progressItems).reduce(
      (acc, val) => acc + val,
      0
    );
    const totalItems = Object.keys(this.progressItems).length;

    const averageProgress = totalProgress / totalItems;

    for (const callback of this.onProgressCallbacks) {
      callback(averageProgress);
    }
  }

  /**
   * Add a listener for when all items have loaded.
   * @param callback Callback to call when all items have loaded.
   */
  public addLoadListener(callback: () => void) {
    this.onLoadCallbacks.push(callback);
  }

  /**
   * Add a listener for when all items have loaded with check if there
   * are any items to load when the listener is added.
   * @param callback Callback to call when all items have loaded.
   */
  public addLoadListenerWithCheck(callback: () => void) {
    if (this.toLoad.length > 0 && this.toLoad.length !== this.loaded.length) {
      this.onLoadCallbacks.push(callback);
    } else {
      callback();
    }
  }

  /**
   * Add a callback to listen when the progress of an item increases.
   * @param callback Callback to call when the progress of a loading item increases.
   */
  public addProgressListener(callback: (progress: number) => void) {
    this.onProgressCallbacks.push(callback);
  }

  /**
   * Reset the loading manager and its items.
   */
  public reset() {
    this.toLoad = [];
    this.loaded = [];
    this.onLoadCallbacks = [];
    this.onProgressCallbacks = [];
    this.progressItems = {};
  }
}
