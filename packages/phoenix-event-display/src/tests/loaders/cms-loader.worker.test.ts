/**
 * @jest-environment node
 */
import { CMSLoader } from '../../loaders/cms-loader';

// Mock dependencies BEFORE imports
jest.mock('../../loaders/phoenix-loader', () => {
  return {
    PhoenixLoader: class MockPhoenixLoader {
      loadingManager = {
        addLoadableItem: jest.fn(),
        itemLoaded: jest.fn(),
      };
      loadObjectTypes() {}
      getEventMetadata() {
        return [];
      }
      addObjectType() {}
    },
  };
});

jest.mock('three', () => ({
  Vector3: class {
    constructor(x: number, y: number, z: number) {}
  },
  QuadraticBezierCurve3: class {
    constructor() {}
    getPoints() {
      return [];
    }
  },
  Group: class {},
}));

jest.mock('../../loaders/objects/cms-objects', () => ({
  CMSObjects: {
    getMuonChamber: jest.fn(),
  },
}));

const mockJSZipInstance = {
  loadAsync: jest.fn().mockReturnThis(),
  files: {} as Record<string, any>,
  file: jest.fn(),
};
jest.mock('jszip', () => {
  return jest.fn(() => mockJSZipInstance);
});

describe('CMSLoader Main-Thread Parsing', () => {
  let cmsLoader: CMSLoader;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset JSZip mock state
    mockJSZipInstance.loadAsync.mockResolvedValue({});
    mockJSZipInstance.files = {};

    global.fetch = jest.fn().mockResolvedValue({
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    cmsLoader = new CMSLoader();
  });

  it('should create a CMSLoader instance', () => {
    expect(cmsLoader).toBeDefined();
  });

  it('should parse valid JSON on main thread', async () => {
    const validData = "{'Collections': {}, 'Types': {}}";
    const result = await (cmsLoader as any).parseOnMainThread(validData);
    expect(result).toEqual({ Collections: {}, Types: {} });
  });

  it('should handle nan replacement during parsing', async () => {
    const dataWithNan = "{'value': nan}";
    const result = await (cmsLoader as any).parseOnMainThread(dataWithNan);
    expect(result).toEqual({ value: 0 });
  });

  it('should handle parentheses replacement during parsing', async () => {
    const dataWithParens = "{'arr': (1, 2, 3)}";
    const result = await (cmsLoader as any).parseOnMainThread(dataWithParens);
    expect(result).toEqual({ arr: [1, 2, 3] });
  });

  it('should reject invalid JSON', async () => {
    const invalidData = 'this is not valid json at all';
    await expect(
      (cmsLoader as any).parseOnMainThread(invalidData),
    ).rejects.toBeDefined();
  });

  it('should use parseWithWorker which delegates to main thread', async () => {
    const validData = "{'test': 'value'}";
    const parseOnMainThreadSpy = jest.spyOn(
      cmsLoader as any,
      'parseOnMainThread',
    );

    await (cmsLoader as any).parseWithWorker(validData, 'test-id');

    expect(parseOnMainThreadSpy).toHaveBeenCalledWith(validData);
  });

  it('should process ig archive and call callback with parsed events', async () => {
    const eventData = "{'Collections': {}, 'Types': {}}";
    const mockFile = {
      async: jest.fn().mockResolvedValue(eventData),
    };
    mockJSZipInstance.files = {
      'Events/Run_1/Event_1': mockFile,
    };
    mockJSZipInstance.file.mockReturnValue(mockFile);

    const onRead = jest.fn();

    cmsLoader.readIgArchive('dummy.ig', onRead);

    // Wait for promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockJSZipInstance.loadAsync).toHaveBeenCalled();
    expect(onRead).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          Collections: {},
          Types: {},
          eventPath: 'Events/Run_1/Event_1',
        }),
      ]),
    );
  });
});
