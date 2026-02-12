/**
 * @jest-environment jsdom
 */
import { JSRootEventLoader } from '../../loaders/jsroot-event-loader';
import * as JSRootLoaderModule from '../../loaders/jsroot-event-loader';
import { openFile } from 'jsroot';

// 1. Mock JSROOT
jest.mock('jsroot', () => ({
  openFile: jest.fn(),
}));

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

  it('should handle unsupported compression for ATLAS AOD files', async () => {
    // 2. Setup spies/mocks
    // We spy on the decompress function instead of mocking the whole module
    const decompressSpy = jest
      .spyOn(JSRootLoaderModule, 'decompress')
      .mockImplementation((data) => data);

    jsrootLoader = new JSRootEventLoader(TEST_ATLAS_AOD_FILE);
    const mockDecompressedData = new ArrayBuffer(8);

    // Mock Fetch
    const mockFetchResponse = {
      arrayBuffer: jest.fn().mockResolvedValue(mockDecompressedData),
    };
    global.fetch = jest.fn().mockResolvedValue(mockFetchResponse as any);

    // Provide a mock file object for the second openFile call (after decompression)
    const mockFile = {
      readObject: jest.fn().mockResolvedValue({ _typename: 'TList', arr: [] }),
    };

    // 3. Configure openFile behavior:
    // First call: Reject with the specific error to trigger the catch block
    // Second call: Resolve with the mock file
    (openFile as jest.Mock)
      .mockRejectedValueOnce(new Error('unsupported compression'))
      .mockResolvedValue(mockFile);

    const onEventData = jest.fn();

    // 4. Execute
    await jsrootLoader.getEventData(['tracks;1'], onEventData);

    // 5. Assertions
    expect(global.fetch).toHaveBeenCalledWith(TEST_ATLAS_AOD_FILE);
    expect(decompressSpy).toHaveBeenCalledWith(mockDecompressedData);
    expect(onEventData).toHaveBeenCalled();

    // Cleanup spy
    decompressSpy.mockRestore();
  });
});
