import { Easing, Tween } from '@tweenjs/tween.js';
import {
  TubeGeometry,
  BufferGeometry,
  Vector3,
  Color,
  MeshBasicMaterial,
  Mesh,
  SphereGeometry,
  Sphere,
  Object3D,
  BufferAttribute,
  Scene,
  Camera,
  Plane,
  Group,
} from 'three';
import { SceneManager } from './scene-manager';
import { RendererManager } from './renderer-manager';
import { TracksMesh } from '../../loaders/objects/tracks';

/** Type for animation preset. */
export interface AnimationPreset {
  /** Positions with duration and easing of each tween forming a path. */
  positions: { position: number[]; duration: number; easing?: any }[];
  /** Time after which to start the event collision animation. */
  animateEventAfterInterval?: number;
  /** Duration of the event collision. */
  collisionDuration?: number;
  /** Name of the Animation */
  name: string;
}

/**
 * Manager for managing animation related operations using three.js and tween.js.
 */
export class AnimationsManager {
  /**
   * Constructor for the animation manager.
   * @param scene Three.js scene containing all the objects and event data.
   * @param activeCamera Currently active camera.
   * @param rendererManager Manager for managing event display's renderer related functions.
   */
  constructor(
    private scene: Scene,
    private activeCamera: Camera,
    private rendererManager: RendererManager,
  ) {
    this.animateEvent = this.animateEvent.bind(this);
    this.animateEventWithClipping = this.animateEventWithClipping.bind(this);
  }

  /** Optional event-level time in nanoseconds */
  private eventTimeNs?: number;

  /** Current animation time in nanoseconds */
  private currentTimeNs = 0;

  /**
   * Get the camera tween for animating camera to a position.
   * @param pos End position of the camera tween.
   * @param duration Duration of the tween.
   * @param easing Animation easing of the tween if any.
   * @returns Tween object of the camera animation.
   */
  public getCameraTween(
    pos: number[],
    duration: number = 1000,
    easing?: typeof Easing.Linear.None,
  ) {
    const tween = new Tween(this.activeCamera.position).to(
      { x: pos[0], y: pos[1], z: pos[2] },
      duration,
    );

    if (easing) {
      tween.easing(easing);
    }

    return tween;
  }

  /**
   * Animate the camera through the event scene.
   * @param startPos Start position of the translation animation.
   * @param tweenDuration Duration of each tween in the translation animation.
   * @param onAnimationEnd Callback when the last animation ends.
   */
  public animateThroughEvent(
    startPos: number[],
    tweenDuration: number,
    onAnimationEnd?: () => void,
  ) {
    // Move to start
    const start = this.getCameraTween(startPos, 1000, Easing.Cubic.Out);
    // Move to position along the detector axis
    const alongAxisPosition = [0, 0, startPos[2]];
    const startXAxis = this.getCameraTween(alongAxisPosition, tweenDuration);

    const radius = 500;
    const numOfSteps = 24;
    const angle = 3 * Math.PI;
    const step = angle / numOfSteps;

    const rotationPositions = [];
    for (let i = 1; i <= numOfSteps; i++) {
      rotationPositions.push([
        radius * Math.sin(step * i), // x
        0, // y
        radius * Math.cos(step * i), // z
      ]);
    }

    // Go to origin
    const rotateStart = this.getCameraTween(
      [0, 0, radius],
      tweenDuration,
      Easing.Cubic.Out,
    );

    let rotate = rotateStart;
    const rotationTime = tweenDuration * 4;
    const singleRotationTime = rotationTime / numOfSteps;
    // Rotating around the event
    for (const pos of rotationPositions) {
      const animation = this.getCameraTween(pos, singleRotationTime);
      rotate.chain(animation);
      rotate = animation;
    }

    // Go to the end position and then back to the starting point
    const endPos = [0, 0, -startPos[2]];
    const end = this.getCameraTween(endPos, tweenDuration, Easing.Cubic.In);
    const startClone = this.getCameraTween(
      startPos,
      tweenDuration,
      Easing.Cubic.Out,
    );
    startClone.onComplete(() => onAnimationEnd?.());
    startClone.delay(500);

    start.chain(startXAxis);
    startXAxis.chain(rotateStart);
    rotate.chain(end);
    end.chain(startClone);

    start.start();
  }

  /**
   * Animate the propagation and generation of event data.
   * @param tweenDuration Duration of the animation tween.
   * @param onEnd Callback when all animations have ended.
   * @param onAnimationStart Callback when the first animation starts.
   */
  public animateEvent(
    tweenDuration: number,
    onEnd?: () => void,
    onAnimationStart?: () => void,
  ) {
    // 🔥 Hide labels at the start of the animation
    const labelsGroup = this.scene.getObjectByName(SceneManager.LABELS_ID);
    if (labelsGroup) labelsGroup.visible = false;

    const extraAnimationSphereDuration = tweenDuration * 0.25;
    tweenDuration *= 0.75;

    const eventData = this.scene.getObjectByName(SceneManager.EVENT_DATA_ID);
    if (!eventData) {
      return;
    }

    const animationSphere = new Sphere(new Vector3(), 0);
    const objectsToAnimateWithSphere: {
      eventObject: Object3D;
      position: any;
    }[] = [];

    const allTweens = [];

    // Traverse over all event data
    eventData.traverse((eventObject: any) => {
      if (eventObject.geometry) {
        // Animation for extrapolating tracks without changing scale
        if (eventObject.name === 'Track' || eventObject.name === 'LineHit') {
          let geometryPosCount =
            eventObject.geometry?.attributes?.position?.count;

          if (geometryPosCount) {
            if (eventObject.geometry instanceof TubeGeometry) {
              geometryPosCount *= 6;
            }

            if (eventObject.geometry instanceof TracksMesh) {
              eventObject.material.progress = 0;
              const eventObjectTween = new Tween(eventObject.material).to(
                { progress: 1 },
                tweenDuration,
              );
              eventObjectTween.onComplete(() => {
                eventObject.material.progress = 1;
              });
              allTweens.push(eventObjectTween);
            } else if (eventObject.geometry instanceof BufferGeometry) {
              const oldDrawRangeCount = eventObject.geometry.drawRange.count;
              eventObject.geometry.setDrawRange(0, 0);

              const eventObjectTween = new Tween(
                eventObject.geometry.drawRange,
              ).to({ count: geometryPosCount }, tweenDuration);
              eventObjectTween.onComplete(() => {
                eventObject.geometry.drawRange.count = oldDrawRangeCount;
              });
              allTweens.push(eventObjectTween);
            }
          }
        }
        // Animation for Jets
        else if (eventObject.name === 'Jet') {
          const scaleTween = new Tween({
            x: 0.01,
            y: 0.01,
            z: 0.01,
          }).to(
            {
              x: eventObject.scale.x,
              y: eventObject.scale.y,
              z: eventObject.scale.z,
            },
            tweenDuration,
          );

          scaleTween.onUpdate(
            (updatedScale: { x: number; y: number; z: number }) => {
              const previousScale = eventObject.scale.x;
              eventObject.scale.setScalar(updatedScale.x);
              eventObject.position
                .divideScalar(previousScale)
                .multiplyScalar(updatedScale.x);
            },
          );
          allTweens.push(scaleTween);
        }
        // Hits and generic objects
        else {
          const hasPosition = !eventObject.position.equals(
            new Vector3(0, 0, 0),
          );

          let position = hasPosition
            ? eventObject.position
            : eventObject.geometry.boundingSphere.center;

          if (eventObject.name === 'Hit') {
            position = Array.from(
              eventObject.geometry.attributes['position'].array,
            );
            eventObject.geometry.deleteAttribute('position');
            eventObject.geometry.computeBoundingSphere();
          } else {
            eventObject.visible = false;
          }

          objectsToAnimateWithSphere.push({
            eventObject: eventObject,
            position: position,
          });
        }
      }
    });

    // Tween for animation sphere
    const animationSphereTween = new Tween(animationSphere).to(
      { radius: 3000 },
      tweenDuration,
    );

    const onAnimationSphereUpdate = (updateAnimationSphere: Sphere) => {
      objectsToAnimateWithSphere.forEach((obj) => {
        if (obj.eventObject.name === 'Hit') {
          const geometry = (obj.eventObject as any).geometry;

          const hitsPositions = this.getHitsPositions(obj.position);
          const reachedHits = hitsPositions.filter((hitPosition) =>
            updateAnimationSphere.containsPoint(
              new Vector3().fromArray(hitPosition),
            ),
          );

          if (reachedHits.length > 0) {
            geometry.setAttribute(
              'position',
              new BufferAttribute(new Float32Array([...reachedHits].flat()), 3),
            );
            geometry.computeBoundingSphere();
          }
        } else if (updateAnimationSphere.containsPoint(obj.position)) {
          obj.eventObject.visible = true;
        }
      });
    };

    animationSphereTween.onUpdate(onAnimationSphereUpdate);

    const animationSphereTweenClone = new Tween(animationSphere).to(
      { radius: 10000 },
      extraAnimationSphereDuration,
    );
    animationSphereTweenClone.onUpdate(onAnimationSphereUpdate);

    animationSphereTween.chain(animationSphereTweenClone);

    allTweens.push(animationSphereTween);

    // onStart callback
    allTweens[0].onStart(() => onAnimationStart?.());

    // Start all tweens
    for (const tween of allTweens) {
      tween.easing(Easing.Quartic.Out).start();
    }

    // 🔥 FINAL animation end handler
    animationSphereTweenClone.onComplete(() => {
      onAnimationSphereUpdate(new Sphere(new Vector3(), Infinity));

      // 🔥 Show labels again when the animation ends
      const labelsGroup = this.scene.getObjectByName(SceneManager.LABELS_ID);
      if (labelsGroup) labelsGroup.visible = true;

      onEnd?.();
    });
  }

  /**
   * Animate the propagation and generation of event data using clipping planes.
   * @param tweenDuration Duration of the animation tween.
   * @param onEnd Function to call when all animations have ended.
   * @param onAnimationStart Callback when the first animation starts.
   * @param clippingConstant Constant for the clipping planes for distance from the origin.
   */
  public animateEventWithClipping(
    tweenDuration: number,
    onEnd?: () => void,
    onAnimationStart?: () => void,
    clippingConstant: number = 11000,
  ) {
    const allEventData = this.scene.getObjectByName(SceneManager.EVENT_DATA_ID);
    if (!allEventData) {
      return;
    }

    // 🔥 Hide labels at the start of the animation
    const labelsGroup = this.scene.getObjectByName(SceneManager.LABELS_ID);
    if (labelsGroup) labelsGroup.visible = false;

    // Sphere to get spherical set of clipping planes from
    const sphere = new SphereGeometry(1, 8, 8);
    // Clipping planes for animation
    const animationClipPlanes: Plane[] = [];

    // Get clipping planes from the vertices of sphere
    const position = sphere.attributes.position;
    const vertex = new Vector3();
    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position as BufferAttribute, i);
      animationClipPlanes.push(new Plane(vertex.clone(), 0));
    }

    // Save the previous clipping setting of the renderer
    const prevLocalClipping =
      this.rendererManager.getMainRenderer().localClippingEnabled;
    if (!prevLocalClipping) {
      this.rendererManager.setLocalClippingEnabled(true);
    }

    // Apply clipping planes to all the event data objects' material
    allEventData.traverse((eventObject: any) => {
      if (eventObject.geometry && eventObject.material) {
        eventObject.material.clippingPlanes = animationClipPlanes;
      }
    });

    const allTweens = [];
    // Create tweens for the animation clipping planes
    for (const animationClipPlane of animationClipPlanes) {
      animationClipPlane.constant = 0;
      const tween = new Tween(animationClipPlane).to(
        { constant: clippingConstant },
        tweenDuration,
      );
      allTweens.push(tween);
    }

    allTweens[0].onStart(() => onAnimationStart?.());

    // Start all the tweens
    for (const tween of allTweens) {
      tween.start();
    }

    allTweens[allTweens.length - 1].onComplete(() => {
      // Revert local clipping of the renderer
      if (!prevLocalClipping) {
        this.rendererManager.getMainRenderer().localClippingEnabled =
          prevLocalClipping /* false */;
      }

      // Remove the applied clipping planes from the event data objects
      allEventData.traverse((eventObject: any) => {
        if (eventObject.geometry && eventObject.material) {
          eventObject.material.clippingPlanes = null;
        }
      });

      onEnd?.();
    });
  }

  /**
   * Animate the collision of two particles.
   * @param tweenDuration Duration of the particle collision animation tween.
   * @param particleSize Size of the particles.
   * @param distanceFromOrigin Distance of the particles (along z-axes) from the origin.
   * @param particleColor Color of the particles.
   * @param onEnd Callback to call when the particle collision ends.
   */
  public collideParticles(
    tweenDuration: number,
    particleSize: number = 10,
    distanceFromOrigin: number = 5000,
    particleColor: Color = new Color(0xffffff),
    onEnd?: () => void,
  ) {
    const particleGeometry = new SphereGeometry(particleSize, 32, 32);
    const particleMaterial = new MeshBasicMaterial({
      color: particleColor,
      transparent: true,
      opacity: 0,
    });

    const particle1 = new Mesh(particleGeometry, particleMaterial);
    const particle2 = particle1.clone() as Mesh;

    particle1.position.setZ(distanceFromOrigin);
    particle2.position.setZ(-distanceFromOrigin);

    const particles = [particle1, particle2];

    this.scene.add(...particles);

    const particleTweens = [];

    for (const particle of particles) {
      new Tween(particle.material)
        .to(
          {
            opacity: 1,
          },
          300,
        )
        .start();

      const particleToOrigin = new Tween(particle.position)
        .to(
          {
            z: 0,
          },
          tweenDuration,
        )
        .start();

      particleTweens.push(particleToOrigin);
    }

    particleTweens[0].onComplete(() => {
      this.scene.remove(...particles);
      onEnd?.();
    });
  }

  /**
   * Animate the propagation and generation of event data with particle collison.
   * @param animationFunction Animation function to call after collision.
   * @param tweenDuration Duration of the animation tween.
   * @param onEnd Function to call when all animations have ended.
   */
  public animateWithCollision(
    animationFunction: (
      tweenDuration: number,
      onEnd?: () => void,
      onAnimationStart?: () => void,
    ) => void,
    tweenDuration: number,
    onEnd?: () => void,
  ) {
    const allEventData = this.scene.getObjectByName(SceneManager.EVENT_DATA_ID);
    if (!allEventData) {
      return;
    }
    // Get the color of the first track to use for colliding particles
    const track = allEventData.getObjectByName('Track');
    let trackColor: Color;
    if (track instanceof Group) {
      trackColor = (track.children[0] as any)?.material?.color;
    } else {
      trackColor = (track as any)?.material.color;
    }

    // Hide event data to show particles collision
    if (allEventData) {
      allEventData.visible = false;
    }

    this.collideParticles(1500, 30, 5000, trackColor, () => {
      animationFunction(tweenDuration, onEnd, () => {
        if (allEventData) {
          allEventData.visible = true;
        }
      });
    });
  }

  /**
   * Animate the propagation and generation of event data with particle collison.
   * @param tweenDuration Duration of the animation tween.
   * @param onEnd Function to call when all animations have ended.
   */
  public animateEventWithCollision(tweenDuration: number, onEnd?: () => void) {
    this.animateWithCollision(this.animateEvent, tweenDuration, onEnd);
  }

  /**
   * Animate the propagation and generation of event data
   * using clipping planes after particle collison.
   * @param tweenDuration Duration of the animation tween.
   * @param onEnd Function to call when all animations have ended.
   */
  public animateClippingWithCollision(
    tweenDuration: number,
    onEnd?: () => void,
  ) {
    this.animateWithCollision(
      this.animateEventWithClipping,
      tweenDuration,
      onEnd,
    );
  }

  /**
   * Get the positions of hits in a multidimensional array
   * from a single dimensional array.
   * @param positions Positions of hits in a single dimensional array.
   * @returns Positions of hits in a multidimensional array.
   */
  private getHitsPositions(positions: number[]): number[][] {
    const hitsPositions: number[][] = [];
    for (let i = 0; i < positions.length; i += 3) {
      hitsPositions.push(positions.slice(i, i + 3));
    }
    return hitsPositions;
  }

  /**
   * Animate scene by animating camera through the scene and animating event collision.
   * @param animationPreset Preset for animation including positions to go through and
   * event collision animation options.
   * @param onEnd Function to call when the animation ends.
   */
  public animatePreset(animationPreset: AnimationPreset, onEnd?: () => void) {
    const { positions, animateEventAfterInterval, collisionDuration } =
      animationPreset;

    // 🔥 Hide labels at the start of the preset animation
    const labelsGroup = this.scene.getObjectByName(SceneManager.LABELS_ID);
    if (labelsGroup) labelsGroup.visible = false;

    if (animateEventAfterInterval && collisionDuration) {
      // Will be made visible after collision animation ends.
      const object = this.scene.getObjectByName(SceneManager.EVENT_DATA_ID);
      if (object) {
        object.visible = false;
      }
      setTimeout(() => {
        this.animateEventWithCollision(collisionDuration);
      }, animateEventAfterInterval);
    }

    const firstTween = this.getCameraTween(
      positions[0].position,
      positions[0].duration ?? 2000,
      positions[0].easing,
    );

    let previousTween = firstTween;
    positions.slice(1).forEach(({ position, duration, easing }) => {
      const tween = this.getCameraTween(position, duration ?? 2000, easing);
      previousTween.chain(tween);
      previousTween = tween;
    });

    // 🔥 When animation finishes, show labels again
    previousTween.onComplete(() => {
      const labelsGroup = this.scene.getObjectByName(SceneManager.LABELS_ID);
      if (labelsGroup) labelsGroup.visible = true;

      onEnd?.(); // Call original callback
    });

    firstTween.start();
  }

  /**
   * Set event-level time (in nanoseconds) for time-driven animations.
   */
  public setEventTime(timeNs?: number): void {
    if (typeof timeNs === 'number' && timeNs > 0) {
      this.eventTimeNs = timeNs;
      this.currentTimeNs = 0;
    } else {
      this.eventTimeNs = undefined;
      this.currentTimeNs = 0;
    }
  }

  /**
   * Get normalized animation progress based on event time.
   * Returns value in range [0, 1].
   */
  public getTimeProgress(): number {
    if (!this.eventTimeNs || this.eventTimeNs <= 0) {
      return 0;
    }

    return Math.min(this.currentTimeNs / this.eventTimeNs, 1);
  }
  /**
   * Set normalized time [0, 1] from UI slider.
   */
  public setNormalizedTime(progress: number): void {
    if (!this.eventTimeNs || this.eventTimeNs <= 0) {
      return;
    }

    // Clamp value between 0 and 1
    const clamped = Math.max(0, Math.min(1, progress));

    // Convert normalized progress to nanoseconds
    this.currentTimeNs = clamped * this.eventTimeNs;
  }

  /**
   * Update the animation state.
   * @param deltaSeconds Time delta since last update in seconds.
   */
  public update(deltaSeconds: number) {
    // Advance time-driven animation
    if (this.eventTimeNs) {
      this.currentTimeNs += deltaSeconds * 1e9; // seconds → nanoseconds

      // Clamp to max event time
      if (this.currentTimeNs > this.eventTimeNs) {
        this.currentTimeNs = this.eventTimeNs;
      }
    }

    // Time-driven visibility logic
    const eventData = this.scene.getObjectByName(SceneManager.EVENT_DATA_ID);

    if (eventData) {
      eventData.traverse((object: any) => {
        if (object.userData?.time !== undefined) {
          object.visible = object.userData.time <= this.currentTimeNs;
        }
      });
    }
  }
}
