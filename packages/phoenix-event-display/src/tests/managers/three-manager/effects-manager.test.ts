/**
 * @jest-environment jsdom
 */
import { Camera, Scene, WebGLRenderer } from 'three';
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

  it('should render the effects composer', () => {
    jest.spyOn(effectsManager, 'addOutlinePassForSelection');
    effectsManager.addOutlinePassForSelection();
    expect(effectsManager.addOutlinePassForSelection).toHaveBeenCalled();
  });

  it('should remove a pass from the effect composer', () => {
    jest.spyOn(effectsManager, 'removePass');
    effectsManager.removePass(new RenderPass(scene, camera));
    expect(effectsManager.removePass).toHaveBeenCalled();
  });

  it('should set the antialiasing of renderer', () => {
    jest.spyOn(effectsManager, 'setAntialiasing');
    effectsManager.setAntialiasing(true);
    expect(effectsManager.setAntialiasing).toHaveBeenCalledWith(true);

    effectsManager.setAntialiasing(false);
    expect(effectsManager.setAntialiasing).toHaveBeenCalledWith(false);
  });
});
