/**
 * @jest-environment jsdom
 */
import { Camera, Object3D, Scene, Vector3 } from 'three';
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
    animationsManager = new AnimationsManager(scene, camera, rendererManager);
  });

  it('should get the camera tween for animating camera to a position', () => {
    const tween = animationsManager.getCameraTween([0, 1, 2], 0, 1);

    expect(tween._object).toBeInstanceOf(Vector3);
    expect(tween._object.x).toBe(0);
    expect(tween._object.y).toBe(0);
    expect(tween._object.z).toBe(0);

    expect(tween._valuesStart).toEqual({});
    expect(tween._valuesEnd).toEqual({ x: 0, y: 1, z: 2 });
    expect(tween._easingFunction).toBe(1);
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
      expect(scene.getObjectByName).toHaveBeenCalledTimes(1);
    });

    it('should animate the propagation and generation of event data with particle collison', () => {
      jest.spyOn(animationsManager, 'animateWithCollision');
      animationsManager.animateEventWithCollision(5000, () => {});
      expect(animationsManager.animateWithCollision).toHaveBeenCalledTimes(1);
    });

    it('should animate the propagation and generation of event data using clipping planes after particle collison', () => {
      jest.spyOn(animationsManager, 'animateWithCollision');
      animationsManager.animateClippingWithCollision(5000, () => {});
      expect(animationsManager.animateWithCollision).toHaveBeenCalledTimes(1);
    });
  });
});
