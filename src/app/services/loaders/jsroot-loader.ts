import { ScriptService } from "ngx-script-loader";

/** Global JSROOT variable for accessing functions after loading JSRoot scripts. */
declare const JSROOT: any;

/**
 * Synchronously load all JSRoot scripts. ONLY CALL ONCE.
 * @param onScriptsLoaded Callback when all the JSRoot scripts have loaded.
 */
export function loadJSRootScripts(onScriptsLoaded: (JSROOT: any) => void) {
  (async () => {
    const scriptService = new ScriptService(document);
    const allScripts = ['JSRootCore.js', 'three.min.js', 'ThreeCSG.js', 'd3.min.js', 'JSRootPainter.js', 'JSRootGeoBase.js'];
    for (const script of allScripts) {
      await scriptService.loadScript('assets/jsroot/' + script).toPromise();
    }
    onScriptsLoaded(JSROOT);
  })();
}