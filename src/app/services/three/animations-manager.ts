import { SceneManager } from "./scene-manager";
import { ControlsManager } from "./controls-manager";
import { TubeBufferGeometry, BufferGeometry, Vector3, Color, SphereGeometry, MeshBasicMaterial, Mesh } from "three";
import * as TWEEN from "@tweenjs/tween.js";

/**
 * Manager for managing animation related operations using three.js and tween.js.
 */
export class AnimationsManager {

  /**
   * Constructor for the animation manager.
   * @param sceneManager Manager for managing functions of the three.js scene.
   * @param controlsManager Manager for managing event display controls.
   */
  constructor(private sceneManager: SceneManager, private controlsManager: ControlsManager) { }

  /**
   * Get the camera tween for animating camera to a position.
   * @param pos End position of the camera tween.
   * @param duration Duration of the tween.
   * @param easing Animation easing of the tween if any.
   * @returns Tween object of the camera animation.
   */
  public getCameraTween(pos: number[],
    duration: number = 1000,
    easing?: any): any {
    const tween = new TWEEN.Tween(
      this.controlsManager.getActiveCamera().position
    ).to({ x: pos[0], y: pos[1], z: pos[2] }, duration);

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
  public animateThroughEvent(startPos: number[],
    tweenDuration: number,
    onAnimationEnd?: () => void) {
    // Move to start
    const start = this.getCameraTween(startPos, 1000, TWEEN.Easing.Cubic.Out);
    // Move to position along the detector axis
    const alongAxisPosition = [0, 0, startPos[2]];
    const startXAxis = this.getCameraTween(alongAxisPosition, tweenDuration);

    const radius = 500;
    const numOfSteps = 24;
    const angle = 3 * Math.PI;
    const step = angle / numOfSteps;

    let rotationPositions = [];
    for (let i = 1; i <= numOfSteps; i++) {
      rotationPositions.push([
        radius * Math.sin(step * i), // x
        0, // y
        radius * Math.cos(step * i) // z
      ]);
    }

    // Go to origin
    const rotateStart = this.getCameraTween([0, 0, radius], tweenDuration, TWEEN.Easing.Cubic.Out);

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
    const end = this.getCameraTween(endPos, tweenDuration, TWEEN.Easing.Cubic.In);
    const startClone = this.getCameraTween(startPos, tweenDuration, TWEEN.Easing.Cubic.Out);
    startClone.onComplete(onAnimationEnd);
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
   * @param onEnd Function to call when all animations have ended.
   */
  public animateEvent(tweenDuration: number, onEnd?: () => void) {
    const eventData = this.sceneManager.getScene()
      .getObjectByName(SceneManager.EVENT_DATA_ID);

    const allTweens = [];
    // Traverse over all event data
    eventData.traverse((eventObject: any) => {
      if (eventObject.geometry) {
        // Animation for extrapolating tracks without changing scale
        if (eventObject.name === 'Track') {
          // Check if geometry drawRange count exists
          let geometryPosCount = eventObject.geometry?.attributes?.position?.count;
          if (geometryPosCount) {
            // WORKAROUND
            // Changing position count for TubeBufferGeometry because
            // what we get is not the actual and it has Infinity drawRange count
            if (eventObject.geometry instanceof TubeBufferGeometry) {
              geometryPosCount *= 6;
            }
            if (eventObject.geometry instanceof BufferGeometry) {
              const oldDrawRangeCount = eventObject.geometry.drawRange.count;
              eventObject.geometry.setDrawRange(0, 0);
              const eventObjectTween = new TWEEN.Tween(
                eventObject.geometry.drawRange
              ).to({
                count: geometryPosCount
              }, tweenDuration);
              eventObjectTween.onComplete(() => {
                eventObject.geometry.drawRange.count = oldDrawRangeCount;
              });
              allTweens.push(eventObjectTween);
            }
          }
        }
        // Animation for scaling out objects with or without position
        else {
          const hasPosition = !eventObject.position.equals(new Vector3(0, 0, 0));

          const scaleTween = new TWEEN.Tween({
            x: 0.01,
            y: 0.01,
            z: 0.01
          }).to({
            x: eventObject.scale.x,
            y: eventObject.scale.y,
            z: eventObject.scale.z
          }, tweenDuration);
          // Manually updating scale since we need to change position
          scaleTween.onUpdate((updatedScale: Vector3) => {
            const previousScale = eventObject.scale.x;
            eventObject.scale.setScalar(updatedScale.x);
            if (hasPosition) {
              // Restoring to original position and then moving again with the current value
              eventObject.position.divideScalar(previousScale)
                .multiplyScalar(updatedScale.x);
            }
          });
          allTweens.push(scaleTween);
        }
      }
    });

    // Start all tweens
    for (const tween of allTweens) {
      tween.easing(TWEEN.Easing.Quartic.Out).start();
    }

    // Call onEnd when the last tween completes
    allTweens[allTweens.length - 1].onComplete(onEnd);
  }

  /**
   * Animate the collision of two particles.
   * @param tweenDuration Duration of the particle collision animation tween.
   * @param particleSize Size of the particles.
   * @param distanceFromOrigin Distance of the particles (along z-axes) from origin.
   * @param particleColor Color of the particles.
   * @param onEnd Callback to call when the particle collision ends.
   */
  public collideParticles(
    tweenDuration: number,
    particleSize: number = 10,
    distanceFromOrigin: number = 5000,
    particleColor: Color = new Color(0xffffff),
    onEnd?: () => void
  ) {
    const particleGeometry = new BufferGeometry().fromGeometry(
      new SphereGeometry(particleSize, 32, 32)
    );
    const particleMaterial = new MeshBasicMaterial({
      color: particleColor,
      transparent: true,
      opacity: 0
    });
    const particle1 = new Mesh(particleGeometry, particleMaterial);
    const particle2 = particle1.clone();
    particle1.position.setZ(distanceFromOrigin);
    particle2.position.setZ(-distanceFromOrigin);

    this.sceneManager.getScene().add(particle1, particle2);

    const particles = [particle1, particle2];
    const particleTweens = [];

    const allEventData = this.sceneManager.getScene()
      .getObjectByName(SceneManager.EVENT_DATA_ID);
    allEventData.visible = false;

    for (const particle of particles) {
      new TWEEN.Tween(particle.material).to({
        opacity: 1
      }, 300).start();

      const particleToOrigin = new TWEEN.Tween(particle.position).to({
        z: 0
      }, tweenDuration).start();

      particleTweens.push(particleToOrigin);
    }

    particleTweens[0].onComplete(() => {
      this.sceneManager.getScene().remove(particle1, particle2);
      setTimeout(() => {
        allEventData.visible = true;
      }, 200);
      onEnd?.();
    });
  }

  /**
   * Animate the propagation and generation of event data with particle collison.
   * @param tweenDuration Duration of the animation tween.
   * @param onEnd Function to call when all animations have ended.
   */
  public animateEventWithCollision(tweenDuration: number, onEnd?: () => void) {
    const trackColor = this.sceneManager.getScene()
      .getObjectByName('Track')['material']['color'];
    this.collideParticles(1500, 10, 5000, trackColor, () => {
      this.animateEvent(tweenDuration, onEnd);
    });
  }
}
