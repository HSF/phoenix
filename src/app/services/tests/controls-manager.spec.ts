import { ControlsManager } from '../extras/controls-manager';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Camera } from 'three';

describe('ControlsManager', () => {
  it('should create an instance', () => {
    const controls = new OrbitControls(new Camera());
    expect(new ControlsManager(controls)).toBeTruthy();
  });
});
