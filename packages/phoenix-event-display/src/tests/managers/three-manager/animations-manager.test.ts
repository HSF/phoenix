/**
 * @jest-environment jsdom
 */
import { Camera, Object3D, Scene } from 'three';
import { AnimationsManager } from '../../../managers/three-manager/animations-manager';
import { RendererManager } from '../../../managers/three-manager/renderer-manager';
import * as TWEEN from '@tweenjs/tween.js';
import { SceneManager } from '../../../managers/three-manager/scene-manager';

describe('AnimationsManager', () => {
  let animationsManager: AnimationsManager;
  let scene: Scene;
  let camera: Camera;
  let rendererManager: RendererManager;

  beforeEach(() => {
    scene = new Scene();
    camera = new Camera();
    animationsManager = new AnimationsManager(scene, camera, rendererManager);
  });

  it('should get the camera tween for animating camera to a position', () => {
    const tween = animationsManager.getCameraTween([0, 1, 2], 0, 1);
    expect(tween).toBeDefined();
  });

  it('should animate the camera through the event scene', () => {
    animationsManager.animateThroughEvent([0, 1, 2], 10, () => {});
    const alongAxisPosition = [0, 0, 2];
    const startXAxis = animationsManager.getCameraTween(alongAxisPosition, 1);
    expect(startXAxis).toBeDefined();
    const startClone = animationsManager.getCameraTween(
      [0, 1, 2],
      10,
      TWEEN.Easing.Cubic.Out
    );
    expect(startClone).toBeDefined();
  });

  it('should get the positions of hits in a multidimensional array', () => {
    const hits = [2, 4, 5, 1, 5, 1];
    expect((animationsManager as any).getHitsPositions(hits).length).toBe(2);
  });

  describe('It depends on the event data', () => {
    beforeEach(() => {
      const mockEventData = new Object3D();
      mockEventData.name = SceneManager.EVENT_DATA_ID;
      scene.add(mockEventData);
    });

    it('should animate the propagation and generation of event data', () => {
      jest.spyOn(animationsManager, 'animateEvent');
      animationsManager.animateEvent(
        500,
        () => {},
        () => {}
      );
      expect(animationsManager.animateEvent).toHaveBeenCalled();
    });

    it('should animate the propagation and generation of event data with particle collison', () => {
      jest.spyOn(animationsManager, 'collideParticles');
      animationsManager.animateEventWithCollision(5000, () => {});
      expect(animationsManager.collideParticles).toHaveBeenCalled();
    });

    it('should animate the propagation and generation of event data using clipping planes after particle collison', () => {
      jest.spyOn(animationsManager, 'collideParticles');
      animationsManager.animateClippingWithCollision(5000, () => {});
      expect(animationsManager.collideParticles).toHaveBeenCalled();
    });
  });
});
