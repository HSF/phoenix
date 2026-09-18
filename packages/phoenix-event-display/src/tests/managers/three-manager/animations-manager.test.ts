/**
 * @jest-environment jsdom
 */
import { Easing, Group as TweenGroup } from '@tweenjs/tween.js';
import {
  BoxGeometry,
  Camera,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector3,
} from 'three';
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
    camera = new PerspectiveCamera();
    animationsManager = new AnimationsManager(
      scene,
      camera,
      rendererManager,
      new TweenGroup(),
    );
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
      Easing.Linear.None,
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

  it('should restore the labels when there is no event data to animate', () => {
    const labelsGroup = new Object3D();
    labelsGroup.name = SceneManager.LABELS_ID;
    labelsGroup.visible = true;
    scene.add(labelsGroup);

    // No event data has been loaded, so the animation cannot run.
    expect(scene.getObjectByName(SceneManager.EVENT_DATA_ID)).toBeUndefined();

    animationsManager.animateEvent(500);

    expect(labelsGroup.visible).toBe(true);
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
        () => {},
      );
      expect(scene.getObjectByName).toHaveBeenCalled();
    });

    it('should keep objects hidden by a cut hidden through the animation', () => {
      const eventData = scene.getObjectByName(SceneManager.EVENT_DATA_ID);
      const collection = new Object3D();
      collection.name = 'CaloCalTopoCluster_xAOD';
      eventData.add(collection);

      // Two clusters, as a collection filter would leave them: the one whose
      // energy fails the cut is already hidden before the animation starts.
      const passingCluster = new Mesh(new BoxGeometry(1, 1, 1));
      passingCluster.name = 'Cluster';
      passingCluster.position.set(10, 0, 0);
      passingCluster.userData = { energy: 1000 };

      const cutCluster = new Mesh(new BoxGeometry(1, 1, 1));
      cutCluster.name = 'Cluster';
      cutCluster.position.set(20, 0, 0);
      cutCluster.userData = { energy: 122411 };
      cutCluster.visible = false;

      collection.add(passingCluster, cutCluster);

      const tweenGroup = (animationsManager as any).tweenGroup as TweenGroup;
      animationsManager.animateEvent(500);

      // Run the animation to completion, which sweeps a sphere of infinite
      // radius over every object.
      tweenGroup.update(performance.now() + 100000);

      expect(passingCluster.visible).toBe(true);
      expect(cutCluster.visible).toBe(false);
    });

    it('should restore the labels after a clipping animation', () => {
      const labelsGroup = new Object3D();
      labelsGroup.name = SceneManager.LABELS_ID;
      labelsGroup.visible = true;
      scene.add(labelsGroup);

      // animateEventWithClipping needs a renderer, which the shared setup
      // leaves undefined.
      const tweenGroup = new TweenGroup();
      const manager = new AnimationsManager(
        scene,
        camera,
        {
          getMainRenderer: () => ({ localClippingEnabled: false }),
          setLocalClippingEnabled: jest.fn(),
        } as unknown as RendererManager,
        tweenGroup,
      );

      manager.animateEventWithClipping(500);
      expect(labelsGroup.visible).toBe(false);

      tweenGroup.update(performance.now() + 100000);

      expect(labelsGroup.visible).toBe(true);
    });

    it('should leave labels off after an animation if they were toggled off', () => {
      const labelsGroup = new Object3D();
      labelsGroup.name = SceneManager.LABELS_ID;
      // The user has turned labels off before running the animation.
      labelsGroup.visible = false;
      scene.add(labelsGroup);

      const tweenGroup = (animationsManager as any).tweenGroup as TweenGroup;
      animationsManager.animateEvent(500);
      tweenGroup.update(performance.now() + 100000);

      expect(labelsGroup.visible).toBe(false);
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
        name: 'test',
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
