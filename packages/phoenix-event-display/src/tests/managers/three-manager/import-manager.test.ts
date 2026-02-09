/**
 * @jest-environment jsdom
 */
import { ImportManager } from '../../../managers/three-manager/import-manager';
import { Plane, Vector3 } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Mock DRACOLoader to track instantiation and disposal
jest.mock('three/examples/jsm/loaders/DRACOLoader.js', () => {
  return {
    DRACOLoader: jest.fn().mockImplementation(() => ({
      setDecoderPath: jest.fn(),
      dispose: jest.fn(),
      preload: jest.fn(),
    })),
  };
});

// Mock GLTFLoader
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => {
  return {
    GLTFLoader: jest.fn().mockImplementation(() => ({
      setDRACOLoader: jest.fn(),
      parse: jest.fn(),
      load: jest.fn(),
    })),
  };
});

describe('ImportManager', () => {
  let importManager: ImportManager;
  const clipPlanes = [
    new Plane(new Vector3(0, 1, 0), 0),
    new Plane(new Vector3(0, -1, 0), 0),
  ];
  const EVENT_DATA_ID = 'EventData';
  const GEOMETRIES_ID = 'Geometries';

  beforeEach(() => {
    // Clear all mock calls before each test
    jest.clearAllMocks();
    importManager = new ImportManager(clipPlanes, EVENT_DATA_ID, GEOMETRIES_ID);
  });

  afterEach(() => {
    // Cleanup after each test
    if (importManager) {
      importManager.cleanup();
    }
  });

  describe('DRACOLoader lifecycle management', () => {
    it('should not create DRACOLoader until first GLTF load', () => {
      // DRACOLoader should not be instantiated on construction
      expect(DRACOLoader).not.toHaveBeenCalled();
      expect(importManager['dracoLoader']).toBeNull();
    });

    it('should lazily create DRACOLoader on first getDRACOLoader call', () => {
      // Access the private method to trigger lazy initialization
      const dracoLoader = importManager['getDRACOLoader']();

      expect(DRACOLoader).toHaveBeenCalledTimes(1);
      expect(dracoLoader).toBeDefined();
      expect(dracoLoader.setDecoderPath).toHaveBeenCalled();
    });

    it('should reuse the same DRACOLoader instance across multiple calls', () => {
      // First call creates the instance
      const firstLoader = importManager['getDRACOLoader']();
      // Second call should return the same instance
      const secondLoader = importManager['getDRACOLoader']();

      expect(DRACOLoader).toHaveBeenCalledTimes(1);
      expect(firstLoader).toBe(secondLoader);
    });

    it('should dispose DRACOLoader on cleanup', () => {
      // Initialize the DRACOLoader
      const dracoLoader = importManager['getDRACOLoader']();

      // Call cleanup
      importManager.cleanup();

      // Verify dispose was called
      expect(dracoLoader.dispose).toHaveBeenCalledTimes(1);
      expect(importManager['dracoLoader']).toBeNull();
    });

    it('should handle cleanup when DRACOLoader was never initialized', () => {
      // DRACOLoader should not exist yet
      expect(importManager['dracoLoader']).toBeNull();

      // Cleanup should not throw
      expect(() => importManager.cleanup()).not.toThrow();
    });

    it('should allow re-initialization after cleanup', () => {
      // Initialize and cleanup
      importManager['getDRACOLoader']();
      importManager.cleanup();

      expect(DRACOLoader).toHaveBeenCalledTimes(1);
      expect(importManager['dracoLoader']).toBeNull();

      // Re-initialize
      const newLoader = importManager['getDRACOLoader']();

      expect(DRACOLoader).toHaveBeenCalledTimes(2);
      expect(newLoader).toBeDefined();
    });

    it('should set correct decoder path for DRACOLoader', () => {
      const dracoLoader = importManager['getDRACOLoader']();

      // Verify setDecoderPath was called with a CDN URL
      expect(dracoLoader.setDecoderPath).toHaveBeenCalledWith(
        expect.stringContaining('cdn.jsdelivr.net/npm/three@'),
      );
      expect(dracoLoader.setDecoderPath).toHaveBeenCalledWith(
        expect.stringContaining('/examples/jsm/libs/draco/'),
      );
    });
  });

  describe('GLTF loading methods use shared DRACOLoader', () => {
    it('parsePhnxScene should use shared DRACOLoader', () => {
      // Mock the callback
      const callback = jest.fn();

      // Start loading (this will fail but we're testing DRACOLoader usage)
      importManager.parsePhnxScene({}, callback).catch(() => {
        // Expected to fail without valid GLTF data
      });

      // Verify DRACOLoader was created only once
      expect(DRACOLoader).toHaveBeenCalledTimes(1);
    });

    it('multiple GLTF operations should share the same DRACOLoader', async () => {
      const callback = jest.fn();

      // Simulate multiple load operations
      importManager.parsePhnxScene({}, callback).catch(() => {});
      importManager.parsePhnxScene({}, callback).catch(() => {});
      importManager.parsePhnxScene({}, callback).catch(() => {});

      // Should still only have one DRACOLoader instance
      expect(DRACOLoader).toHaveBeenCalledTimes(1);
    });
  });

  describe('Memory leak prevention', () => {
    it('should not leak DRACOLoader instances on repeated operations', () => {
      // Simulate the problematic pattern that was causing leaks
      // Before fix: each operation created a new DRACOLoader
      // After fix: all operations share one DRACOLoader

      for (let i = 0; i < 10; i++) {
        importManager['getDRACOLoader']();
      }

      // Only one DRACOLoader should have been created
      expect(DRACOLoader).toHaveBeenCalledTimes(1);
    });

    it('should properly dispose all resources on cleanup', () => {
      // Use the loader
      const dracoLoader = importManager['getDRACOLoader']();

      // Verify initial state
      expect(importManager['dracoLoader']).not.toBeNull();

      // Cleanup
      importManager.cleanup();

      // Verify cleanup
      expect(dracoLoader.dispose).toHaveBeenCalled();
      expect(importManager['dracoLoader']).toBeNull();
    });
  });
});

describe('ImportManager integration with ThreeManager cleanup', () => {
  it('should be safe to call cleanup multiple times', () => {
    const importManager = new ImportManager(
      [new Plane(new Vector3(0, 1, 0), 0)],
      'EventData',
      'Geometries',
    );

    // Initialize the DRACOLoader
    importManager['getDRACOLoader']();

    // Multiple cleanup calls should not throw
    expect(() => {
      importManager.cleanup();
      importManager.cleanup();
      importManager.cleanup();
    }).not.toThrow();
  });
});
