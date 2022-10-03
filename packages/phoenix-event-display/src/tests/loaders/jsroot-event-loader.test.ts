/**
 * @jest-environment jsdom
 */
import { JSRootEventLoader } from '../../loaders/jsroot-event-loader';

describe('JSRootEventLoader', () => {
  let jsrootLoader: JSRootEventLoader;
  const TEST_ROOT_FILE = 'assets/tracks_hits.root';

  beforeEach(() => {
    jsrootLoader = new JSRootEventLoader(TEST_ROOT_FILE);
  });

  afterEach(() => {
    jsrootLoader = undefined;
  });

  it('should create an instance', () => {
    expect(jsrootLoader).toBeTruthy();
  });

  it('should not process empty event data object', () => {
    const mockObjectNoArr = { _typename: 'TList', arr: undefined };
    expect(
      (jsrootLoader as any).processItemsList(mockObjectNoArr)
    ).toBeUndefined();
  });

  it('should get TGeoTrack', () => {
    const mockTGeoTrack = {
      _typename: 'TGeoTrack',
      fNpoints: 12,
      fPoints: [1, 2, 3, 0, 4, 5, 6, 0, 7, 8, 9, 0],
    };
    (jsrootLoader as any).processItemsList(mockTGeoTrack);
    expect(
      (jsrootLoader as any).fileEventData.Tracks['TGeoTracks'].length
    ).toBeGreaterThan(0);
  });

  it('should not get TGeoTrack', () => {
    expect((jsrootLoader as any).getTGeoTrack(undefined)).toBeFalsy();
    expect(
      (jsrootLoader as any).getTGeoTrack({ fNpoints: undefined })
    ).toBeFalsy();
  });

  it('should get Hit of different type', () => {
    const mockHitObjAlt1 = {
      _typename: 'ROOT::Experimental::TEvePointSet',
    };
    (jsrootLoader as any).processItemsList(mockHitObjAlt1);
    // Should have an empty array
    expect(
      Object.keys((jsrootLoader as any).fileEventData.Hits).length
    ).toBeGreaterThan(0);

    const mockHitObjAlt2 = {
      _typename: 'TPolyMarker3D',
    };
    const prevHitTypesLength = Object.keys(
      (jsrootLoader as any).fileEventData.Hits
    ).length;
    (jsrootLoader as any).processItemsList(mockHitObjAlt2);
    // Hits should have another type (with empty array value)
    expect(Object.keys((jsrootLoader as any).fileEventData.Hits).length).toBe(
      prevHitTypesLength + 1
    );
  });

  it('should not get Hit', () => {
    expect((jsrootLoader as any).getHit(undefined)).toBeFalsy();
    expect((jsrootLoader as any).getHit({ fN: undefined })).toBeFalsy();
    expect((jsrootLoader as any).getHit({ fN: 0 })).toBeFalsy();
  });

  it('should cover (not processed yet) extra shapes', () => {
    const mockExtraObj1 = {
      _typename: 'TEveGeoShapeExtract',
    };
    expect(
      (jsrootLoader as any).processItemsList(mockExtraObj1)
    ).toBeUndefined();

    const mockExtraObj2 = {
      _typename: 'ROOT::Experimental::TEveGeoShapeExtract',
    };
    expect(
      (jsrootLoader as any).processItemsList(mockExtraObj2)
    ).toBeUndefined();
  });

  it('should not get TEveTrack', () => {
    expect((jsrootLoader as any).getTEveTrack(undefined)).toBeFalsy();
    expect((jsrootLoader as any).getTEveTrack({ fN: [] })).toBeFalsy();
  });
});
