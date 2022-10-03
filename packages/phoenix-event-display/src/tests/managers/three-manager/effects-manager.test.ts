/**
 * @jest-environment jsdom
 */
import { Camera, Scene, NormalBlending } from 'three';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { EffectsManager } from '../../../managers/three-manager/effects-manager';
import THREE from '../../helpers/webgl-mock';

describe('EffectsManager', () => {
  let effectsManager: EffectsManager;
  let camera: Camera;
  let scene: Scene;

  beforeEach(() => {
    camera = new Camera();
    scene = new Scene();

    effectsManager = new EffectsManager(
      camera,
      scene,
      new THREE.WebGLRenderer()
    );
  });

  afterEach(() => {
    effectsManager = undefined;
  });

  it('should create an instance', () => {
    expect(effectsManager).toBeTruthy();
  });

  it('should initialize the outline pass for highlighting hovered over event display elements', () => {
    const outlinePass = effectsManager.addOutlinePassForSelection();

    expect(outlinePass).toBeInstanceOf(OutlinePass);
    expect(outlinePass.overlayMaterial.blending).toBe(NormalBlending);
    expect(outlinePass.visibleEdgeColor.getHex()).toBe(0xdf5330);
    expect(effectsManager.composer.passes.length).toBe(2);
  });

  it('should remove a pass from the effect composer', () => {
    const pass1 = new RenderPass(scene, camera);
    effectsManager.composer.addPass(pass1);

    const pass2 = new RenderPass(scene, camera);
    effectsManager.composer.addPass(pass2);

    expect(effectsManager.composer.passes.length).toBe(3);

    effectsManager.removePass(pass2);

    expect(effectsManager.composer.passes.length).toBe(2);
  });

  it('should set the antialiasing of renderer', () => {
    effectsManager.setAntialiasing(true);
    expect(effectsManager.antialiasing).toBe(true);

    effectsManager.setAntialiasing(false);
    expect(effectsManager.antialiasing).toBe(false);
  });
});
