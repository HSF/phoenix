import { LoadingManager } from '../managers/loading-manager';

/**
 * Script loader for dynamically loading external scripts.
 */
export class ScriptLoader {
  /**
   * Load a script dynamically from a URL.
   * @param scriptURL URL of the script to be loaded.
   * @param scriptFor Optional data attribute to identify what the script is for. `[data-scriptFor]`
   * @param parentElement Parent element to which the script is to be appended.
   * Defaults to `<head>` tag.
   * @returns Promise for the script load.
   */
  public static loadScript(
    scriptURL: string,
    scriptFor?: string,
    parentElement: HTMLElement = document.getElementsByTagName('head')[0]
  ): Promise<void> {
    const loadingManager = new LoadingManager();
    loadingManager.addLoadableItem('single_script');

    return new Promise<void>((resolve, reject) => {
      const scriptExists = document.querySelectorAll<HTMLScriptElement>(
        'script[src="' + scriptURL + '"]'
      );

      // If no script exists - add one
      if (scriptExists.length === 0) {
        const scriptElement = document.createElement('script');
        scriptElement.type = 'text/javascript';
        scriptElement.src = scriptURL;
        if (scriptFor) {
          scriptElement.setAttribute('data-scriptfor', scriptFor);
        }

        scriptElement.addEventListener('load', () => {
          scriptElement.setAttribute('data-loaded', 'true');
          resolve();
          loadingManager.itemLoaded('single_script');
        });
        scriptElement.onerror = (event) => {
          console.error('ERROR LOADING SCRIPT: ', event);
          reject();
          loadingManager.itemLoaded('single_script');
        };

        parentElement.appendChild(scriptElement);
      } else {
        // If script has already loaded then resolve else wait for it to load
        if (scriptExists[0].dataset.loaded === 'true') {
          resolve();
          loadingManager.itemLoaded('single_script');
        } else {
          scriptExists[0].addEventListener('load', () => {
            resolve();
            loadingManager.itemLoaded('single_script');
          });
        }
      }
    });
  }
}
