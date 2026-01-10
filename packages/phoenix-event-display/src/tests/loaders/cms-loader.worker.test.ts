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
                itemLoaded: jest.fn()
            };
            loadObjectTypes() { }
            getEventMetadata() { return []; }
            addObjectType() { }
        }
    };
});

jest.mock('three', () => ({
    Vector3: class { constructor(x, y, z) { } },
    QuadraticBezierCurve3: class { constructor() { } getPoints() { return [] } },
    Group: class { }
}));

jest.mock('../../loaders/objects/cms-objects', () => ({
    CMSObjects: {
        getMuonChamber: jest.fn()
    }
}));

const mockJSZipInstance = {
    loadAsync: jest.fn().mockReturnThis(),
    files: {},
    file: jest.fn()
};
jest.mock('jszip', () => {
    return jest.fn(() => mockJSZipInstance);
});


// Mock Worker globally
const mockWorker = {
    postMessage: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    terminate: jest.fn(),
};

global.Worker = jest.fn(() => mockWorker) as any;
global.URL = jest.fn() as any;


describe('CMSLoader Web Worker Integration', () => {
    let cmsLoader: CMSLoader;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset JSZip mock state
        mockJSZipInstance.loadAsync.mockResolvedValue({});
        mockJSZipInstance.files = {};

        cmsLoader = new CMSLoader();
    });

    it('should initialize Web Worker in constructor', () => {
        expect(global.Worker).toHaveBeenCalledTimes(1);
    });

    it('should use worker for parsing when reading ig archive', async () => {
        // Setup mock data
        const eventData = JSON.stringify({ Collections: {}, Types: {} });
        const mockFile = {
            async: jest.fn().mockResolvedValue(eventData)
        };
        mockJSZipInstance.files = {
            'Events/Run_1/Event_1': mockFile
        };
        mockJSZipInstance.file.mockReturnValue(mockFile);

        // Access private method helper via type casting or invoke public method
        const onRead = jest.fn();

        // This is async internally but returns void. We need to wait for the async operations.
        // Since we can't easily await the internal promise chain of readIgArchive without refactoring,
        // we will test the `parseWithWorker` method directly if possible, or use timers.
        // OR we can spy on `parseWithWorker` if we cast to any.

        const parseWithWorkerSpy = jest.spyOn(cmsLoader as any, 'parseWithWorker');
        parseWithWorkerSpy.mockResolvedValue({ eventPath: 'Events/Run_1/Event_1', successful: true });

        cmsLoader.readIgArchive('dummy.ig', onRead);

        // Wait for promises to resolve
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockJSZipInstance.loadAsync).toHaveBeenCalled();
        expect(parseWithWorkerSpy).toHaveBeenCalledWith(eventData, 'Events/Run_1/Event_1');
        expect(onRead).toHaveBeenCalledWith(expect.arrayContaining([{ eventPath: 'Events/Run_1/Event_1', successful: true }]));
    });

    it('should handle worker messages correctly in parseWithWorker', async () => {
        const promise = (cmsLoader as any).parseWithWorker('{}', 'test-id');

        expect(mockWorker.postMessage).toHaveBeenCalledWith({
            type: 'parseCMS',
            data: '{}',
            id: 'test-id'
        });

        // Simulate successful response
        const messageHandler = (mockWorker.addEventListener as jest.Mock).mock.calls[0][1];
        messageHandler({
            data: {
                type: 'parseCMSResult',
                id: 'test-id',
                data: { result: 'ok' }
            }
        });

        const result = await promise;
        expect(result).toEqual({ result: 'ok' });
    });

    it('should reject when worker returns error', async () => {
        const promise = (cmsLoader as any).parseWithWorker('bad-json', 'error-id');

        const messageHandler = (mockWorker.addEventListener as jest.Mock).mock.calls[0][1];
        messageHandler({
            data: {
                type: 'parseCMSError',
                id: 'error-id',
                error: 'Invalid JSON'
            }
        });

        await expect(promise).rejects.toEqual('Invalid JSON');
    });
});
