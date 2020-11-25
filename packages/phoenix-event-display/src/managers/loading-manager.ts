/**
 * Phoenix loading manager for managing loadable items.
 */
export class LoadingManager {
  /** Instance of the loading manager */
  private static instance: LoadingManager;

  /** Number of items to load. */
  public toLoad: number = 0;
  /** Number of items loaded */
  public loaded: number = 0;

  /** Callbacks to call on load. */
  private onLoadCallbacks: (() => void)[] = [];
  /** Callbacks to call on progress. */
  private onProgressCallbacks: ((progress: number) => void)[] = [];

  /** Progress for each named item. */
  private progressItems: { [key: string]: number } = {};

  /**
   * Create the singleton Phoenix loading manager.
   */
  constructor() {
    if (LoadingManager.instance === undefined) {
      LoadingManager.instance = this;
    }
    return LoadingManager.instance;
  }

  /**
   * Add count for a loadable item.
   */
  public addLoadableItem() {
    this.toLoad++;
  }

  /**
   * Add count for an item is loaded.
   */
  public itemLoaded() {
    this.loaded++;
    if (this.toLoad === this.loaded) {
      this.onLoadCallbacks.forEach(callback => callback());
    }
  }

  /**
   * When an item loading progresses.
   * @param itemName Name of the item with the progress.
   * @param progress Progress of the item.
   */
  public onProgress(itemName: string, progress: number) {
    this.progressItems[itemName] = progress;

    let totalProgress = Object.values(this.progressItems)
      .reduce((acc, val) => acc + val, 0);
    let totalItems = Object.keys(this.progressItems).length;

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
   * Add a listener for when an item progress.
   * @param callback Callback to call when there is progress.
   */
  public addProgressListener(callback: (progress: number) => void) {
    this.onProgressCallbacks.push(callback);
  }

  /**
   * Reset the loading manager and its items.
   */
  public reset() {
    this.toLoad = 0;
    this.loaded = 0;
    this.onLoadCallbacks = [];
    this.onProgressCallbacks = [];
    this.progressItems = {};
  }
}
