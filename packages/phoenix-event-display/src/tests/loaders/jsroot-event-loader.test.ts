/**
 * @jest-environment jsdom
 */
import { JSRootEventLoader } from '../../loaders/jsroot-event-loader';

// Mock JSROOT to trigger the 'unsupported compression' flow
jest.mock('jsroot', () => ({
  openFile: jest.fn().mockRejectedValue(new Error('unsupported compression')),
}));

// Mock the internal decompress function
jest.mock('../../loaders/jsroot-event-loader', () => {
  const originalModule = jest.requireActual('../../loaders/jsroot-event-loader');
  return {
    ...originalModule,
    decompress: jest.fn((data) => data),
  };
});

import { decompress } from '../../loaders/jsroot-event-loader';
import { openFile } from 'jsroot';

describe('JSRootEventLoader', () => {
  let jsrootLoader: JSRootEventLoader;
  const TEST_ROOT_FILE = 'assets/tracks_hits.root';
  const TEST_ATLAS_AOD_FILE = 'assets/atlas_aod.root';

  beforeEach(() => {
    jsrootLoader = new JSRootEventLoader(TEST_ROOT_FILE);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jsrootLoader = undefined;
  });

  it('should create an instance', () => {
    expect(jsrootLoader).toBeTruthy();
  });

  it('should not process empty event data object', () => {
    const mockObjectNoArr = { _typename: 'TList', arr: undefined };
    expect((jsrootLoader as any).processItemsList(mockObjectNoArr)).toBeUndefined();
  });

  it('should get TGeoTrack', () => {
    const mockTGeoTrack = {
      _typename: 'TGeoTrack',
      fNpoints: 12,
      fPoints: [1, 2, 3, 0, 4, 5, 6, 0, 7, 8, 9, 0],
    };
    (jsrootLoader as any).processItemsList(mockTGeoTrack);
    expect((jsrootLoader as any).fileEventData.Tracks['TGeoTracks'].length).toBeGreaterThan(0);
  });

  it('should handle unsupported compression for ATLAS AOD files', async () => {
    jsrootLoader = new JSRootEventLoader(TEST_ATLAS_AOD_FILE);
    const mockDecompressedData = new ArrayBuffer(8);
    
    // Mock Fetch
    const mockFetchResponse = {
      arrayBuffer: jest.fn().mockResolvedValue(mockDecompressedData),
    };
    global.fetch = jest.fn().mockResolvedValue(mockFetchResponse as any);

    // Provide a mock file object for the second openFile call (after decompression)
    const mockFile = {
      readObject: jest.fn().mockResolvedValue({ _typename: 'TList', arr: [] })
    };
    (openFile as jest.Mock).mockResolvedValueOnce(new Error('unsupported compression')) // Fail first
                          .mockResolvedValue(mockFile); // Succeed second

    (decompress as jest.Mock).mockReturnValue(mockDecompressedData);

    const onEventData = jest.fn();
    await jsrootLoader.getEventData(['tracks;1'], onEventData);

    expect(global.fetch).toHaveBeenCalledWith(TEST_ATLAS_AOD_FILE);
    expect(decompress).toHaveBeenCalledWith(mockDecompressedData);
    expect(onEventData).toHaveBeenCalled();
  });
});