/**
 * Mock for three/examples/jsm modules.
 *
 * These ESM-only modules cannot be parsed by Jest's CommonJS pipeline
 * and depend on WebGL which is unavailable in jsdom.
 * This mock provides lightweight stubs for all three/examples/jsm
 * imports used across the test suite.
 */

import {
  Camera,
  Scene,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
  Color,
  Object3D,
  BufferGeometry,
} from 'three';

// --- postprocessing/Pass.js ---
export class Pass {
  enabled = true;
  needsSwap = true;
  renderToScreen = false;
  setSize(_width: number, _height: number) {}
  render(
    _renderer: WebGLRenderer,
    _writeBuffer: WebGLRenderTarget,
    _readBuffer: WebGLRenderTarget,
  ) {}
  dispose() {}
}

export class FullScreenQuad {
  material: any;
  constructor(material?: any) {
    this.material = material;
  }
  render(_renderer: WebGLRenderer) {}
  dispose() {}
}

// --- postprocessing/EffectComposer.js ---
export class EffectComposer {
  renderer: WebGLRenderer;
  passes: Pass[] = [];
  renderTarget1: any = {};
  renderTarget2: any = {};

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
  }
  addPass(pass: Pass) {
    this.passes.push(pass);
  }
  removePass(pass: Pass) {
    const index = this.passes.indexOf(pass);
    if (index > -1) this.passes.splice(index, 1);
  }
  render() {}
  setSize(_width: number, _height: number) {}
  dispose() {}
}

// --- postprocessing/RenderPass.js ---
export class RenderPass extends Pass {
  scene: Scene;
  camera: Camera;
  constructor(scene?: Scene, camera?: Camera) {
    super();
    this.scene = scene ?? new Scene();
    this.camera = camera ?? ({} as Camera);
  }
}

// --- postprocessing/OutlinePass.js ---
export class OutlinePass extends Pass {
  renderScene: Scene;
  renderCamera: Camera;
  selectedObjects: Object3D[] = [];
  visibleEdgeColor = new Color(0xffffff);
  hiddenEdgeColor = new Color(0x190a05);
  edgeGlow = 0;
  edgeThickness = 1;
  edgeStrength = 3;
  overlayMaterial = { blending: 1 };

  constructor(_resolution?: Vector2, scene?: Scene, camera?: Camera) {
    super();
    this.renderScene = scene ?? new Scene();
    this.renderCamera = camera ?? ({} as Camera);
  }
}

// --- postprocessing/ShaderPass.js ---
export class ShaderPass extends Pass {
  uniforms: any = {};
  material: any = {};
  constructor(shader?: any) {
    super();
    if (shader) {
      this.uniforms = shader.uniforms || {};
    }
  }
}

// --- controls/OrbitControls.js ---
export class OrbitControls {
  object: Camera;
  domElement: HTMLElement;
  enabled = true;
  target = { x: 0, y: 0, z: 0, set: jest.fn(), fromArray: jest.fn() };
  enableDamping = false;

  constructor(object: Camera, domElement?: HTMLElement) {
    this.object = object;
    this.domElement = domElement ?? document.createElement('div');
  }
  update() {}
  dispose() {}
  addEventListener(_type: string, _listener: any) {}
  removeEventListener(_type: string, _listener: any) {}
}

// --- loaders ---
export class OBJLoader {
  load(_url: string, onLoad?: any, _onProgress?: any, _onError?: any) {
    if (onLoad) onLoad(new Object3D());
  }
  parse(_text: string) {
    return new Object3D();
  }
}

export class GLTFLoader {
  load(_url: string, onLoad?: any, _onProgress?: any, _onError?: any) {
    if (onLoad) onLoad({ scene: new Object3D(), scenes: [], animations: [] });
  }
}

export class DRACOLoader {
  setDecoderPath(_path: string) {
    return this;
  }
  setDecoderConfig(_config: any) {
    return this;
  }
  dispose() {}
}

export class FontLoader {
  load(_url: string, onLoad?: any) {
    if (onLoad) onLoad({});
  }
}

export class Font {
  data: any;
  constructor(data?: any) {
    this.data = data;
  }
}

// --- geometries ---
export class TextGeometry extends BufferGeometry {
  constructor(_text?: string, _params?: any) {
    super();
  }
}

export class ConvexGeometry extends BufferGeometry {
  constructor(_points?: any[]) {
    super();
  }
}

// --- utils/BufferGeometryUtils.js ---
export function mergeGeometries(geometries: BufferGeometry[]) {
  return geometries[0] ?? new BufferGeometry();
}

export function mergeBufferGeometries(geometries: BufferGeometry[]) {
  return mergeGeometries(geometries);
}

// --- libs/stats.module.js ---
export class Stats {
  dom = document.createElement('div');
  showPanel(_id: number) {}
  begin() {}
  end() {}
  update() {}
}

// --- webxr/XRControllerModelFactory.js ---
export class XRControllerModelFactory {
  createControllerModel(_controller: any) {
    return new Object3D();
  }
}

// --- exporters ---
export class OBJExporter {
  parse(_object: Object3D) {
    return '';
  }
}

export class GLTFExporter {
  parse(_input: any, onCompleted?: any, _onError?: any, _options?: any) {
    if (onCompleted) onCompleted({});
  }
}
