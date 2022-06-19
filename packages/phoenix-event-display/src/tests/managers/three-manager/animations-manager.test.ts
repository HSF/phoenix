import { Scene, Camera, Object3D } from 'three';
import { AnimationsManager } from '../../../managers/three-manager/animations-manager';
import { RendererManager } from '../../../managers/three-manager/renderer-manager';
import { SceneManager } from '../../../managers/three-manager/scene-manager';

describe('AnimationsManager', () => {
  let animationsManager: AnimationsManager;
  let scene: Scene;
  let camera: Camera;
  let rendererManager: RendererManager;

  beforeEach(() => {
    scene = new Scene();
    camera = new Camera();
    rendererManager = new RendererManager();
    animationsManager = new AnimationsManager(scene, camera, rendererManager);
  });

  test('should camera animate through event', () => {
    jest.spyOn(animationsManager, 'getCameraTween');

    animationsManager.animateThroughEvent([0, 0, 0], 5000);
    expect(animationsManager.getCameraTween).toHaveBeenCalled();
  });

  test('should get hits', () => {
    const hits = [2, 4, 5, 1, 2, 1]; // 2 hits
    expect((animationsManager as any).getHitsPositions(hits).length).toBe(2);
  });

  describe('depending on event data', () => {
    beforeEach(() => {
      const mockEventData = new Object3D();
      mockEventData.name = SceneManager.EVENT_DATA_ID;
      scene.add(mockEventData);
    });

    test('should animate event with collision', () => {
      jest.spyOn(animationsManager, 'collideParticles');
      animationsManager.animateEventWithCollision(5000, () => {});
      expect(animationsManager.collideParticles).toHaveBeenCalled();
    });

    test('should animate clipping with collision', () => {
      jest.spyOn(animationsManager, 'collideParticles');
      animationsManager.animateClippingWithCollision(5000, () => {});
      expect(animationsManager.collideParticles).toHaveBeenCalled();
    });
  });
});
