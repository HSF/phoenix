/**
 * @jest-environment jsdom
 */
import {
  Camera,
  Scene,
  WebGLRenderer,
  Color,
  WebGLRenderTarget,
  Texture,
  MeshDepthMaterial,
  ShaderMaterial,
} from 'three';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { EffectsManager } from '../../../managers/three-manager/effects-manager';
import createRenderer from '../../helpers/create-renderer';

describe('EffectsManager', () => {
  let effectsManager: EffectsManager;
  let camera: Camera;
  let scene: Scene;
  let renderer: WebGLRenderer;

  beforeEach(() => {
    camera = new Camera();
    scene = new Scene();
    renderer = createRenderer();
    effectsManager = new EffectsManager(camera, scene, renderer);
  });

  it('should create an instance', () => {
    expect(effectsManager).toBeTruthy();
  });

  it('should initialize the outline pass for highlighting hovered over event display elements', () => {
    const outlinePass = effectsManager.addOutlinePassForSelection();

    expect(outlinePass).toBeInstanceOf(OutlinePass);
    expect(outlinePass.selectedObjects.length).toBe(0);
    expect(outlinePass.visibleEdgeColor).toBeInstanceOf(Color);
    expect(outlinePass.hiddenEdgeColor).toBeInstanceOf(Color);

    expect(outlinePass.edgeGlow).toBe(0);
    expect(outlinePass.edgeThickness).toBe(1);
    expect(outlinePass.edgeStrength).toBe(3);

    expect(outlinePass.resolution.x).toBe(window.innerWidth);
    expect(outlinePass.resolution.y).toBe(window.innerHeight);

    expect(outlinePass.renderTargetMaskBuffer).toBeInstanceOf(
      WebGLRenderTarget
    );
    expect(outlinePass.renderTargetMaskBuffer.texture).toBeInstanceOf(Texture);

    expect(outlinePass.depthMaterial).toBeInstanceOf(MeshDepthMaterial);
    expect(outlinePass.prepareMaskMaterial).toBeInstanceOf(ShaderMaterial);

    expect(outlinePass.renderTargetDepthBuffer).toBeInstanceOf(
      WebGLRenderTarget
    );
    expect(outlinePass.edgeDetectionMaterial).toBeInstanceOf(ShaderMaterial);
    expect(outlinePass.overlayMaterial).toBeInstanceOf(ShaderMaterial);
    expect(outlinePass.materialCopy).toBeInstanceOf(ShaderMaterial);
    expect(outlinePass.fsQuad).toBeInstanceOf(FullScreenQuad);
  });

  it('should remove a pass from the effect composer', () => {
    const pass = new RenderPass(scene, camera);
    effectsManager.removePass(pass);

    expect(effectsManager.composer.passes.length).toBe(0);
  });

  it('should set the antialiasing of renderer', () => {
    effectsManager.setAntialiasing(true);
    expect(effectsManager.antialiasing).toBe(true);

    effectsManager.setAntialiasing(false);
    expect(effectsManager.antialiasing).toBe(false);
  });
});
