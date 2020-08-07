/** Global JSROOT variable for accessing functions after loading JSRoot scripts. */
declare const JSROOT: any;

/**
 * Script loader for dynamically loading external scripts.
 */
export class ScriptLoader {

  /**
   * Synchronously load all JSRoot scripts. ONLY CALL ONCE.
   * @param onScriptsLoaded Callback when all the JSRoot scripts have loaded.
   */
  public static loadJSRootScripts(onScriptsLoaded: (JSROOT: any) => void) {
    (async () => {
      const allScripts = [
        'JSRootCore.js', 'three.min.js', 'three.extra.min.js',
        'ThreeCSG.js', 'd3.min.js', 'JSRootPainter.js', 'JSRoot3DPainter.js',
        'JSRootGeoBase.js', 'JSRootGeoPainter.js'
      ];
      for (const script of allScripts) {
        await this.loadScript('assets/jsroot/' + script, 'JSROOT');
      }
      onScriptsLoaded(JSROOT);
    })();
  }

  /**
   * Load a script dynamically from a URL.
   * @param scriptURL URL of the script to be loaded.
   * @param scriptFor Optional data attribute to identify what the script is for. `[data-scriptFor]`
   * @param parentElement Parent element to which the script is to be appended.
   * Defaults to `<head>` tag.
   * @returns Promise for the script load.
   */
  public static loadScript(scriptURL: string, scriptFor?: string,
    parentElement: HTMLElement = document.getElementsByTagName('head')[0]): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const scriptExists = document
        .querySelectorAll<HTMLScriptElement>('script[src="' + scriptURL + '"]');
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
        });
        scriptElement.onerror = (event) => {
          console.error('ERROR LOADING SCRIPT: ', event);
          reject();
        }
        parentElement.appendChild(scriptElement);
      } else {
        // If script has already loaded then resolve else wait for it to load
        if (scriptExists[0].dataset.loaded === 'true') {
          resolve();
        } else {
          scriptExists[0].addEventListener('load', () => {
            resolve();
          });
        }
      }
    });
  }

}
