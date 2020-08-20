import { Scene, Object3D, Color, LineSegments, Mesh, MeshPhongMaterial, LineBasicMaterial, Vector3, Group, AxesHelper, AmbientLight, DirectionalLight, Line, MeshBasicMaterial, Material, Points, PointsMaterial, MeshToonMaterial, Camera, BufferGeometry, TubeBufferGeometry, SphereGeometry } from 'three';
import { Cut } from '../extras/cut.model';
import * as TWEEN from '@tweenjs/tween.js';

/**
 * Manager for managing functions of the three.js scene.
 */
export class SceneManager {
    /** Object group ID containing event data. */
    public static EVENT_DATA_ID = 'EventData';
    /** Object group ID containing detector geometries. */
    public static GEOMETRIES_ID = 'Geometries';

    /** Three.js scene containing all the objects and event data. */
    private scene: Scene;
    /** List of objects to ignore for getting a clean scene. */
    private ignoreList: string[];
    /** An axes helper for visualizing the x, y and z-axis. */
    private axis: AxesHelper;
    /** Whether to use directional light placed at the camera position. */
    private useCameraLight: boolean = true;
    /** Directional light following the camera position. */
    public cameraLight: DirectionalLight;

    /**
     * Create the scene manager.
     * @param ignoreList List of objects to ignore for getting a clean scene.
     * @param useCameraLight Whether to use directional light placed at the camera position.
     */
    constructor(ignoreList: string[], useCameraLight: boolean = true) {
        this.getScene();
        this.ignoreList = ignoreList;
        this.scene.background = new Color('hsl(0, 0%, 100%)');
        this.axis = null;
        this.setLights(useCameraLight);
    }

    /**
     * Initializes the lights in the scene.
     * @param useCameraLight Whether to use directional light placed at the camera position.
     */
    private setLights(useCameraLight: boolean = true) {
        this.useCameraLight = useCameraLight;

        const ambientLight = new AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        if (this.useCameraLight) {
            this.cameraLight = new DirectionalLight(0xffffff, 0.45);
            this.cameraLight.position.set(0, 0, 10);
            this.scene.add(this.cameraLight);
        } else {
            [
                [-100, -50, 100],   // Bottom left
                [100, 50, -100],    // Top right
                [-100, 50, -100],   // Top left
                [100, -50, 100]     // Bottom right
            ].forEach((position) => {
                const directionalLight = new DirectionalLight(0xffffff, 0.2);
                directionalLight.position.set(position[0], position[1], position[2]);
                this.scene.add(directionalLight);
            });
        }
    }

    /**
     * Update position of directional light for each frame rendered.
     * @param camera Camera for setting the position of directional light.
     */
    public updateLights(camera: Camera) {
        if (this.useCameraLight) {
            this.cameraLight.position.set(
                camera.position.x,
                camera.position.y,
                camera.position.z
            );
        }
    }

    /**
     * Get the current scene and create new if it doesn't exist.
     * @returns The scene.
     */
    public getScene(): Scene {
        if (!this.scene) {
            this.scene = new Scene();
        }
        return this.scene;
    }

    /**
     * Get a clean copy of the scene.
     * @returns A clear scene with no objects from the ignoreList.
     */
    public getCleanScene(): Scene {
        const clearScene: Scene = this.scene.clone();
        const removeList = [];

        clearScene.traverse((object: Object3D) => {
            if (this.ignoreList.includes(object.type)) {
                removeList.push(object);
            }
        });

        clearScene.remove(...removeList);

        return clearScene;
    }

    /**
     * Sets the scene background to be dark or white.
     * @param dark If the scene background is dark (true) or white (false).
     */
    public darkBackground(dark: boolean) {
        let background = 0xffffff;
        if (dark) {
            background = 0x0;
        }
        if (this.scene) {
            this.scene.background = new Color(background);
        }
    }

    /**
     * Modifies an object's opacity.
     * @param name Name of the object to change its opacity.
     * @param value Value of opacity, between 0 (transparent) and 1 (opaque).
     */
    public setGeometryOpacity(name: string, value: number) {
        const object = this.scene.getObjectByName(name);

        if (value) {
            object.traverse((o) => {
                if (o instanceof Mesh && o.material instanceof Material) {
                    o.material.transparent = true;
                    o.material.opacity = value;
                }
            });
        }
    }


    /**
     * Changes color of an OBJ geometry.
     * @param name Name of the geometry.
     * @param value Value representing the color in hex format.
     */
    public OBJGeometryColor(name: string, value: any) {
        const object = this.scene.getObjectByName(name);
        if (object) {
            object.traverse(child => {
                if (child instanceof Mesh || child instanceof LineSegments) {
                    if (
                        child.material instanceof MeshPhongMaterial ||
                        child.material instanceof MeshBasicMaterial ||
                        child.material instanceof LineBasicMaterial
                    ) {
                        child.material.color.set(value);
                    }
                }
            });
        }
    }

    /**
     * Changes objects visibility.
     * @param name Name of the object to change its visibility.
     * @param visible If the object will be visible (true) or hidden (false).
     * @param parentName Name of the parent object to look inside for object
     * whose visibility is to be toggled.
     */
    public objectVisibility(name: string, visible: boolean, parentName?: string) {
        const parent = parentName
            ? this.scene.getObjectByName(parentName)
            : this.scene;
        const object = parent.getObjectByName(name);
        if (object) {
            object.traverse((child) => {
                child.visible = visible;
                if (!visible) {
                    child.layers.disable(0);
                    child.layers.enable(1);
                } else {
                    child.layers.enable(0);
                    child.layers.disable(1);
                }
            });
        }
    }

    /**
     * Gets an object's position.
     * @param name Name of the object.
     * @returns Object position.
     */
    public getObjectPosition(name: string): Vector3 {
        const object = this.scene.getObjectByName(name);
        if (object) {
            return object.position;
        }
    }

    /**
     * Removes an object from the scene.
     * @param name Name of the object to be removed.
     */
    public removeGeometry(name: string) {
        const object = this.scene.getObjectByName(name);
        const geometries = this.getGeometries() as Group;
        geometries.remove(object);
    }

    /**
     * Scales an object.
     * @param name Name of the object to scale.
     * @param value Value to scale the object by.
     */
    public scaleObject(name: string, value: any) {
        const object = this.scene.getObjectByName(name);
        object.scale.set(value, value, value);
    }

    /**
     * Adds new type of objects (Jets, Tracks...) to the event data group.
     * @param objectType Name of the object type.
     * @returns The new group added to the event data.
     */
    public addEventDataTypeGroup(objectType: string): Group {
        const eventData = this.getEventData();
        let typeGroup = this.scene.getObjectByName(objectType) as Group;
        if (!typeGroup) {
            typeGroup = new Group();
        }
        typeGroup.name = objectType;
        eventData.add(typeGroup);
        return typeGroup;
    }

    /**
     * Changes the color of all objects inside an event data collection.
     * @param collectionName Name of the collection.
     * @param color Hex value representing the color.
     */
    public collectionColor(collectionName: string, color: any) {
        const collection = this.getScene()
            .getObjectByName(SceneManager.EVENT_DATA_ID)
            .getObjectByName(collectionName);

        for (const child of Object.values(collection.children)) {
            child.traverse((object: THREE.Object3D) => {
                // For jets and tracks
                if (object instanceof Line ||
                    object instanceof Mesh ||
                    object instanceof Points) {
                    if (
                        object.material instanceof LineBasicMaterial ||
                        object.material instanceof MeshBasicMaterial ||
                        object.material instanceof MeshBasicMaterial ||
                        object.material instanceof PointsMaterial ||
                        object.material instanceof MeshPhongMaterial ||
                        object.material instanceof MeshToonMaterial
                    ) {
                        object.material.color.set(color);

                    }
                }
            });
        }
    }

    /**
     * Applies a cut to all objects inside a collection, filtering them given a parameter.
     * @param collectionName Name of the collection.
     * @param filter Cut used to filter the objects in the collection.
     */
    public collectionFilter(collectionName: string, filter: Cut) {
        const collection = this.getScene()
            .getObjectByName(SceneManager.EVENT_DATA_ID)
            .getObjectByName(collectionName);
        for (const child of Object.values(collection.children)) {
            if (child.userData) {
                const value = child.userData[filter.field];
                if (value) {
                    if (value <= filter.maxValue && value >= filter.minValue) {
                        child.visible = true;
                    } else {
                        child.visible = false;
                    }
                }
            }
        }
    }

    /**
     * Changes the visibility of all elements in a group.
     * @param name Name of the group.
     * @param visible If the group will be visible (true) or hidden (false).
     * @param parentName Name of the parent object to look inside for object
     * whose visibility is to be toggled.
     */
    public groupVisibility(name: string, visible: boolean, parentName?: string) {
        const parent = parentName
            ? this.scene.getObjectByName(parentName)
            : this.scene;
        const collection = parent.getObjectByName(name);
        for (const child of Object.values(collection.children)) {
            child.visible = visible;
        }
    }


    /**
     * Gets a group of objects from the scene.
     * @param identifier String that identifies the group's name.
     * @returns The object.
     */
    public getObjectsGroup(identifier: string): Object3D {
        let group = this.scene.getObjectByName(identifier);
        if (group == null) {
            group = new Group();
            group.name = identifier;
            this.scene.add(group);
        }
        return group;
    }

    /**
     * Get event data inside the scene.
     * @returns A group of objects with event data.
     */
    public getEventData(): Object3D {
        return this.getObjectsGroup(SceneManager.EVENT_DATA_ID);
    }

    /**
     * Get geometries inside the scene.
     * @returns A group of objects with geometries.
     */
    public getGeometries(): Object3D {
        return this.getObjectsGroup(SceneManager.GEOMETRIES_ID);
    }

    /**
     * Clears event data of the scene.
     */
    public clearEventData() {
        const eventData = this.getEventData();
        if (eventData != null) {
            this.scene.remove(eventData);
        }
        this.getEventData();
    }

    /**
     * Sets scene axis visibility.
     * @param visible If the axes will be visible (true) or hidden (false).
     */
    public setAxis(visible: boolean) {
        if (this.axis == null) {
            this.axis = new AxesHelper(2000);
            this.scene.add(this.axis);
        }
        this.axis.visible = visible;
    }

    /**
     * Toggle depthTest of event data by updating all children's depthTest and renderOrder.
     * @param value If depthTest will be true or false.
     */
    public eventDataDepthTest(value: boolean) {
        const object = this.getEventData();

        if (object !== null) {
            // Traversing all event data objects to change material's depthTest
            object.traverse((objectChild: any) => {
                if (objectChild.material) {
                    // Changing renderOrder to make event data render on top of geometry
                    // Arbitrarily setting a high value of 999
                    value ? objectChild.renderOrder = 0 : objectChild.renderOrder = 999;
                    // Applying depthTest
                    objectChild.material.depthTest = value;
                }
            });
        }
    }

    /**
     * Wireframe geometries and decrease their opacity.
     * @param value A boolean to specify if geometries are to be wireframed
     * or not.
     */
    public wireframeGeometries(value: boolean) {
        const allGeoms = this.getGeometries();
        allGeoms.traverse((object: any) => {
            if (object.material) {
                object.material.wireframe = value;
                if (value) {
                    object.material.transparent = true;
                    object.material.opacity = 0.1;
                } else {
                    // Rolling back transparency because depthTest doesn't work with it
                    object.material.transparent = false;
                    object.material.opacity = 1;
                }
            }
        });
    }

    /**
     * Change the scale of Jets.
     * @param value Percentage factor by which the Jets are to be scaled.
     */
    public scaleJets(value: number) {
        const jets = this.scene.getObjectByName('Jets');
        value /= 100;

        jets.traverse((objectChild: Object3D) => {
            if (objectChild.name === 'Jet') {
                const previousScale = objectChild.scale.x;
                objectChild.scale.setScalar(value);
                // Restoring to original position and then moving again with the current value.
                objectChild.position.divideScalar(previousScale).multiplyScalar(value);
            }
        });
    }

    /**
     * Animate the propagation and generation of event data.
     * @param tweenDuration Duration of the animation tween.
     * @param onEnd Function to call when all animations have ended.
     */
    public animateEvent(tweenDuration: number, onEnd?: () => void) {
        const eventData = this.scene.getObjectByName(SceneManager.EVENT_DATA_ID);

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
                // // Animation for moving objects outward with no position
                // else if (eventObject.position.equals(new Vector3(0, 0, 0))) {
                //     console.log(eventObject);
                // }
                // // Animation for moving objects outward
                // else if (eventObject.position) {
                //     const oldPosition = eventObject.position.clone();
                //     eventObject.position.setScalar(0);
                //     allTweens.push(new TWEEN.Tween(eventObject.position)
                //         .to(oldPosition, tweenDuration));
                // }
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

        this.getScene().add(particle1, particle2);

        const particles = [particle1, particle2];
        const particleTweens = [];

        const allEventData = this.getScene().getObjectByName(SceneManager.EVENT_DATA_ID);
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
            this.getScene().remove(particle1, particle2);
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
        const trackColor = this.getScene()
            .getObjectByName('Track')['material']['color'];
        this.collideParticles(1500, 10, 5000, trackColor, () => {
            this.animateEvent(tweenDuration, onEnd);
        });
    }
}
