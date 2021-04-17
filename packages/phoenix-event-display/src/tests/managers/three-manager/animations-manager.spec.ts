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

  it('should camera animate through event', () => {
    spyOn(animationsManager, 'getCameraTween').and.callThrough();

    animationsManager.animateThroughEvent([0, 0, 0], 5000);
    expect(animationsManager.getCameraTween).toHaveBeenCalled();
  });

  it('should get hits', () => {
    const hits = [2, 4, 5, 1, 2, 1]; // 2 hits
    expect((animationsManager as any).getHitsPositions(hits).length).toBe(2);
  });

  describe('depending on event data', () => {
    beforeEach(() => {
      const mockEventData = new Object3D();
      mockEventData.name = SceneManager.EVENT_DATA_ID;
      scene.add(mockEventData);
    });

    it('should animate event with collision', () => {
      spyOn(animationsManager, 'collideParticles').and.callThrough();
      animationsManager.animateEventWithCollision(5000, () => {});
      expect(animationsManager.collideParticles).toHaveBeenCalled();
    });

    it('should animate clipping with collision', () => {
      spyOn(animationsManager, 'collideParticles').and.callThrough();
      animationsManager.animateClippingWithCollision(5000, () => {});
      expect(animationsManager.collideParticles).toHaveBeenCalled();
    });
  });
});
