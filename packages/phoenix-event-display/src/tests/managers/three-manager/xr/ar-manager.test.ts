import { ARManager } from '../../../../managers/three-manager/xr/ar-manager';
import { PerspectiveCamera } from 'three';
import { Scene } from 'three';

describe('ARManager', () => {
  let arManager: ARManager;
  let scene: Scene;
  let camera: PerspectiveCamera;

  beforeEach(() => {
    const scene = new Scene();
    const camera = new PerspectiveCamera();
    arManager = new ARManager(scene, camera);
  });

  afterEach(() => {
    scene = undefined;
    camera = undefined;
    arManager = undefined;
  });

  it('should create an instance of ARManager', () => {
    expect(arManager).toBeTruthy();
  });
});
