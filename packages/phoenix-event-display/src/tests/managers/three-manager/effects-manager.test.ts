/**
 * @jest-environment jsdom
 */
import {
  Camera,
  Scene,
  NormalBlending,
  PerspectiveCamera,
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
} from 'three';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import {
  EffectsManager,
  EffectsState,
} from '../../../managers/three-manager/effects-manager';
import THREE from '../../helpers/webgl-mock';

function createMesh() {
  return new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
}

describe('EffectsManager', () => {
  let effectsManager: EffectsManager;
  let camera: Camera;
  let scene: Scene;

  beforeEach(() => {
    camera = new PerspectiveCamera();
    scene = new Scene();
    effectsManager = new EffectsManager(
      camera,
      scene,
      new THREE.WebGLRenderer(),
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

  describe('EffectsState enum', () => {
    it('should have exactly 5 values', () => {
      expect(Object.keys(EffectsState).length).toBe(5);
    });

    it('DEFAULT should equal "DEFAULT"', () => {
      expect(EffectsState.DEFAULT).toBe('DEFAULT');
    });

    it('HOVERED should equal "HOVERED"', () => {
      expect(EffectsState.HOVERED).toBe('HOVERED');
    });

    it('SELECTED should equal "SELECTED"', () => {
      expect(EffectsState.SELECTED).toBe('SELECTED');
    });

    it('HIGHLIGHTED should equal "HIGHLIGHTED"', () => {
      expect(EffectsState.HIGHLIGHTED).toBe('HIGHLIGHTED');
    });

    it('DIMMED should equal "DIMMED"', () => {
      expect(EffectsState.DIMMED).toBe('DIMMED');
    });
  });

  describe('setHoverColor', () => {
    it('should not throw when called with no active hover outline', () => {
      expect(() => effectsManager.setHoverColor(0xff6600)).not.toThrow();
    });

    it('should not throw when called multiple times', () => {
      expect(() => {
        effectsManager.setHoverColor(0xff0000);
        effectsManager.setHoverColor(0x00ff00);
        effectsManager.setHoverColor(0x0000ff);
      }).not.toThrow();
    });

    it('setHoverColor and setSelectionColor should be independent', () => {
      expect(() => {
        effectsManager.setHoverColor(0xff6600);
        effectsManager.setSelectionColor(0x00ff00);
        effectsManager.setHoverColor(0x0000ff);
      }).not.toThrow();
    });

    it('should update active hover outline uniforms immediately', () => {
      const mesh = createMesh();
      effectsManager.setHoverOutline(mesh);
      expect(() => effectsManager.setHoverColor(0xff6600)).not.toThrow();
      expect(effectsManager.getOutlinePerformanceStats().hasHoverOutline).toBe(
        true,
      );
    });
  });

  describe('state transitions', () => {
    it('should start with no selected objects', () => {
      expect(
        effectsManager.getOutlinePerformanceStats().selectedObjectsCount,
      ).toBe(0);
    });

    it('should start with no hover outline', () => {
      expect(effectsManager.getOutlinePerformanceStats().hasHoverOutline).toBe(
        false,
      );
    });

    it('selectObject should add object to selected set', () => {
      const mesh = createMesh();
      effectsManager.selectObject(mesh);
      expect(
        effectsManager.getOutlinePerformanceStats().selectedObjectsCount,
      ).toBe(1);
    });

    it('selectObject should not add the same object twice', () => {
      const mesh = createMesh();
      effectsManager.selectObject(mesh);
      effectsManager.selectObject(mesh);
      expect(
        effectsManager.getOutlinePerformanceStats().selectedObjectsCount,
      ).toBe(1);
    });

    it('deselectObject should remove object from selected set', () => {
      const mesh = createMesh();
      effectsManager.selectObject(mesh);
      effectsManager.deselectObject(mesh);
      expect(
        effectsManager.getOutlinePerformanceStats().selectedObjectsCount,
      ).toBe(0);
    });

    it('clearAllSelections should empty the selected set', () => {
      const mesh1 = createMesh();
      const mesh2 = createMesh();
      effectsManager.selectObject(mesh1);
      effectsManager.selectObject(mesh2);
      effectsManager.clearAllSelections();
      expect(
        effectsManager.getOutlinePerformanceStats().selectedObjectsCount,
      ).toBe(0);
    });

    it('setHoverOutline should create hover outline for unselected object', () => {
      const mesh = createMesh();
      effectsManager.setHoverOutline(mesh);
      expect(effectsManager.getOutlinePerformanceStats().hasHoverOutline).toBe(
        true,
      );
    });

    it('setHoverOutline with null should clear hover outline', () => {
      const mesh = createMesh();
      effectsManager.setHoverOutline(mesh);
      effectsManager.setHoverOutline(null);
      expect(effectsManager.getOutlinePerformanceStats().hasHoverOutline).toBe(
        false,
      );
    });

    it('setHoverOutline should not create outline for selected object', () => {
      const mesh = createMesh();
      effectsManager.selectObject(mesh);
      effectsManager.setHoverOutline(mesh);
      expect(effectsManager.getOutlinePerformanceStats().hasHoverOutline).toBe(
        false,
      );
    });

    it('toggleSelection should select unselected object', () => {
      const mesh = createMesh();
      const result = effectsManager.toggleSelection(mesh);
      expect(result).toBe(true);
      expect(
        effectsManager.getOutlinePerformanceStats().selectedObjectsCount,
      ).toBe(1);
    });

    it('toggleSelection should deselect selected object', () => {
      const mesh = createMesh();
      effectsManager.selectObject(mesh);
      const result = effectsManager.toggleSelection(mesh);
      expect(result).toBe(false);
      expect(
        effectsManager.getOutlinePerformanceStats().selectedObjectsCount,
      ).toBe(0);
    });
  });
});
