import { JSRootEventLoader } from '../loaders/jsroot-event-loader';
import { ScriptLoader } from '../loaders/script-loader';

describe('JSRootEventLoader', () => {
  it('should create an instance', () => {
    ScriptLoader.loadJSRootScripts((JSROOT) => {
      expect(new JSRootEventLoader(JSROOT, 'http://root.cern/js/files/geom/atlas.json.gz')).toBeTruthy();
    });
  });
});
