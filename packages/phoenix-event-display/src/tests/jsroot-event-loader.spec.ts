import { JSRootEventLoader } from '../loaders/jsroot-event-loader';
import { ScriptLoader } from '../loaders/script-loader';

declare const JSROOT: any;

describe('JSRootEventLoader', () => {
  let jsrootLoader: JSRootEventLoader;
  const TEST_ROOT_FILE = 'assets/tracks_hits.root';
  const JSROOT_TIMEOUT = 30000; // JSRoot takes time to process

  beforeAll((done) => {
    ScriptLoader.loadJSRootScripts().then((JSROOT) => {
      done();
    });
  }, JSROOT_TIMEOUT);

  beforeEach(() => {
    jsrootLoader = new JSRootEventLoader(JSROOT, TEST_ROOT_FILE);
  });

  afterEach(() => {
    jsrootLoader = undefined;
  });

  it('should create an instance', () => {
    expect(jsrootLoader).toBeTruthy();
  });

  it('should get event data', (done) => {
    spyOn((jsrootLoader as any), 'processItemsList').and.callThrough();

    jsrootLoader.getEventData(['tracks;1', 'hits;1'], (eventData: any) => {
      expect((jsrootLoader as any).processItemsList).toHaveBeenCalled();
      expect(eventData).toBeDefined();
      done();
    });
  }, JSROOT_TIMEOUT);

  it('should not process empty event data object', () => {
    const mockObjectNoArr = { _typename: 'TList', arr: undefined };
    expect((jsrootLoader as any).processItemsList(mockObjectNoArr)).toBeUndefined();
  });

  it('should get TGeoTrack', () => {
    const mockTGeoTrack = {
      _typename: 'TGeoTrack',
      fNpoints: 12,
      fPoints: [1, 2, 3, 0, 4, 5, 6, 0, 7, 8, 9, 0]
    };
    (jsrootLoader as any).processItemsList(mockTGeoTrack);
    expect((jsrootLoader as any).fileEventData.Tracks['TGeoTracks'].length).toBeGreaterThan(0);
  });

  it('should not get TGeoTrack', () => {
    expect((jsrootLoader as any).getTGeoTrack(undefined)).toBeFalse();
    expect((jsrootLoader as any).getTGeoTrack({ fNpoints: undefined })).toBeFalse();
  });

  it('should get Hit of different type', () => {
    const mockHitObjAlt1 = {
      _typename: 'ROOT::Experimental::TEvePointSet'
    };
    (jsrootLoader as any).processItemsList(mockHitObjAlt1);
    // Should have an empty array
    expect(Object.keys((jsrootLoader as any).fileEventData.Hits).length).toBeGreaterThan(0);

    const mockHitObjAlt2 = {
      _typename: 'TPolyMarker3D'
    };
    const prevHitTypesLength = Object.keys((jsrootLoader as any).fileEventData.Hits).length;
    (jsrootLoader as any).processItemsList(mockHitObjAlt2);
    // Hits should have another type (with empty array value)
    expect(Object.keys((jsrootLoader as any).fileEventData.Hits).length).toBe(prevHitTypesLength + 1);
  });

  it('should not get Hit', () => {
    expect((jsrootLoader as any).getHit(undefined)).toBeFalse();
    expect((jsrootLoader as any).getHit({ fN: undefined })).toBeFalse();
    expect((jsrootLoader as any).getHit({ fN: 0 })).toBeFalse();
  });

  it('should cover (not processed yet) extra shapes', () => {
    const mockExtraObj1 = {
      _typename: 'TEveGeoShapeExtract'
    };
    expect((jsrootLoader as any).processItemsList(mockExtraObj1)).toBeUndefined();

    const mockExtraObj2 = {
      _typename: 'ROOT::Experimental::TEveGeoShapeExtract'
    };
    expect((jsrootLoader as any).processItemsList(mockExtraObj2)).toBeUndefined();
  });

  it('should not get TEveTrack', () => {
    expect((jsrootLoader as any).getTEveTrack(undefined)).toBeFalse();
    expect((jsrootLoader as any).getTEveTrack({ fN: [] })).toBeFalse();
  });
});
