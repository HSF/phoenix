/**
 * @jest-environment jsdom
 */
import { Easing } from '@tweenjs/tween.js';
import { Camera, Object3D, Scene, Vector3 } from 'three';
import {
  AnimationsManager,
  AnimationPreset,
} from '../../../managers/three-manager/animations-manager';
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
    animationsManager = new AnimationsManager(scene, camera, rendererManager);
  });

  afterEach(() => {
    animationsManager = undefined;
  });

  it('should get the camera tween for animating camera to a position', () => {
    const camera = (animationsManager as any).activeCamera as Camera;
    const targetPosition = new Vector3(0, 1, 2);
    const tween = animationsManager.getCameraTween(
      Object.values(targetPosition),
      0,
      Easing.Linear.None
    );

    expect(camera.position).toEqual(new Vector3());
    tween.start().end();
    expect(camera.position).toEqual(targetPosition);
  });

  it('should animate the camera through the event scene', () => {
    jest.spyOn(animationsManager, 'getCameraTween');
    animationsManager.animateThroughEvent([0, 1, 2], 10, () => {});
    expect(animationsManager.getCameraTween).toHaveBeenCalledTimes(29);
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
      jest.spyOn(scene, 'getObjectByName');
      animationsManager.animateEvent(
        500,
        () => {},
        () => {}
      );
      expect(scene.getObjectByName).toHaveBeenCalled();
    });

    it('should animate the propagation and generation of event data using clipping planes after particle collison', () => {
      jest.spyOn(animationsManager, 'animateWithCollision');
      animationsManager.animateClippingWithCollision(5000, () => {});
      expect(animationsManager.animateWithCollision).toHaveBeenCalled();
    });

    it('should animate the propagation and generation of event data with particle collison', () => {
      jest.spyOn(animationsManager, 'animateWithCollision');
      animationsManager.animateEventWithCollision(5000, () => {});
      expect(animationsManager.animateWithCollision).toHaveBeenCalled();
    });

    it('should animate scene by animating camera through the scene and animating event collision', () => {
      jest.spyOn(animationsManager, 'getCameraTween');
      const animationPreset: AnimationPreset = {
        positions: [
          {
            position: [0, 0, 0],
            duration: 0,
          },
          {
            position: [0, 0, 0],
            duration: 0,
          },
        ],
        animateEventAfterInterval: 1,
        collisionDuration: 1,
      };
      animationsManager.animatePreset(animationPreset, () => {});
      expect(animationsManager.getCameraTween).toHaveBeenCalled();
    });
  });
});
