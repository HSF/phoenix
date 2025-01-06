/**
 * @jest-environment jsdom
 */
import { JSRootEventLoader } from '../../loaders/jsroot-event-loader';
import { decompress } from 'some-compression-library'; // Add the necessary import for the compression library

describe('JSRootEventLoader', () => {
  let jsrootLoader: JSRootEventLoader;
  const TEST_ROOT_FILE = 'assets/tracks_hits.root';
  const TEST_ATLAS_AOD_FILE = 'assets/atlas_aod.root';

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
      (jsrootLoader as any).processItemsList(mockObjectNoArr),
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
      (jsrootLoader as any).fileEventData.Tracks['TGeoTracks'].length,
    ).toBeGreaterThan(0);
  });

  it('should not get TGeoTrack', () => {
    expect((jsrootLoader as any).getTGeoTrack(undefined)).toBeFalsy();
    expect(
      (jsrootLoader as any).getTGeoTrack({ fNpoints: undefined }),
    ).toBeFalsy();
  });

  it('should get Hit of different type', () => {
    const mockHitObjAlt1 = {
      _typename: 'ROOT::Experimental::TEvePointSet',
    };
    (jsrootLoader as any).processItemsList(mockHitObjAlt1);
    // Should have an empty array
    expect(
      Object.keys((jsrootLoader as any).fileEventData.Hits).length,
    ).toBeGreaterThan(0);

    const mockHitObjAlt2 = {
      _typename: 'TPolyMarker3D',
    };
    const prevHitTypesLength = Object.keys(
      (jsrootLoader as any).fileEventData.Hits,
    ).length;
    (jsrootLoader as any).processItemsList(mockHitObjAlt2);
    // Hits should have another type (with empty array value)
    expect(Object.keys((jsrootLoader as any).fileEventData.Hits).length).toBe(
      prevHitTypesLength + 1,
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
      (jsrootLoader as any).processItemsList(mockExtraObj1),
    ).toBeUndefined();

    const mockExtraObj2 = {
      _typename: 'ROOT::Experimental::TEveGeoShapeExtract',
    };
    expect(
      (jsrootLoader as any).processItemsList(mockExtraObj2),
    ).toBeUndefined();
  });

  it('should not get TEveTrack', () => {
    expect((jsrootLoader as any).getTEveTrack(undefined)).toBeFalsy();
    expect((jsrootLoader as any).getTEveTrack({ fN: [] })).toBeFalsy();
  });

  it('should handle unsupported compression for ATLAS AOD files', async () => {
    jsrootLoader = new JSRootEventLoader(TEST_ATLAS_AOD_FILE);
    const mockDecompressedData = new ArrayBuffer(8);
    const mockFetchResponse = {
      arrayBuffer: jest.fn().mockResolvedValue(mockDecompressedData),
    };
    global.fetch = jest.fn().mockResolvedValue(mockFetchResponse as any);
    (decompress as jest.Mock) = jest.fn().mockReturnValue(mockDecompressedData);

    const objects = ['tracks;1', 'hits;1'];
    const onEventData = jest.fn();

    await jsrootLoader.getEventData(objects, onEventData);

    expect(fetch).toHaveBeenCalledWith(TEST_ATLAS_AOD_FILE);
    expect(decompress).toHaveBeenCalledWith(mockDecompressedData);
    expect(onEventData).toHaveBeenCalled();
  });
});
