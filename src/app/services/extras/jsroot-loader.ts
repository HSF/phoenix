import { ScriptService } from "ngx-script-loader";

/**
 * Synchronously load all JSRoot scripts.
 * @param onScriptsLoaded Callback when all the JSRoot scripts have loaded.
 */
export async function loadJSRootScripts(onScriptsLoaded: () => void) {
  const scriptService = new ScriptService(document);
  const allScripts = ['JSRootCore.js', 'three.min.js', 'ThreeCSG.js', 'JSRootGeoBase.js'];
  for (const script of allScripts) {
    await scriptService.loadScript('assets/jsroot/' + script).toPromise();
  }
  onScriptsLoaded();
}

/**
 * Script loader for loading JSRoot scripts.
 */
export class JSRootLoader {

  /** All scripts used by JSRoot in with dependencies. */
  private allScripts = {
    'JSRootCore.js': [],
    'JSRootGeoBase.js': ['three.min.js', 'd3.min.js', 'ThreeCSG.js', 'JSRootCore.js', 'JSRootPainter.js', 'JSRootPainter.v6.js',
      'JSRootPainter.more.js', 'JSRoot3DPainter.js']
  };

  /**
   * Constructor for the JSRoot loader.
   * @param scriptService Service for dynamically loading a script.
   */
  constructor(private scriptService: ScriptService) { }

  /**
   * Load a JSRoot script with dependencies.
   * @param scriptName Name of the script to be loaded.
   * @param onLoadComplete Callback when all the required scripts are loaded.
   */
  async loadJSRootScript(scriptName: string, onLoadComplete: () => void) {
    for (const dependencyName of this.allScripts[scriptName]) {
      await this.scriptService.loadScript('assets/jsroot/' + dependencyName).toPromise();
    }
    await this.scriptService.loadScript('assets/jsroot/' + scriptName).toPromise();
    onLoadComplete();
  }

  /**
   * Load all JSRoot scripts.
   * @param onLoadComplete Callback when all the scripts are loaded.
   */
  async loadAllJSRootScripts(onLoadComplete: () => void) {
    let scriptsLoaded = [];
    for (const script of Object.keys(this.allScripts)) {
      for (const dependencyName of this.allScripts[script]) {
        if (!scriptsLoaded.includes(dependencyName)) {
          await this.scriptService.loadScript('assets/jsroot/' + dependencyName).toPromise();
          scriptsLoaded.push(dependencyName);
        }
      }
      await this.scriptService.loadScript('assets/jsroot/' + script).toPromise();
    }
    onLoadComplete();
  }

}