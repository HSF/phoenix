// Mock for three.js examples to work around ESM import issues in Jest

import {
  BufferGeometry,
  Material,
  Object3D,
  Camera,
  Scene,
  WebGLRenderTarget,
  WebGLRenderer,
  EventDispatcher,
  Vector3,
  MOUSE,
  TOUCH,
  Spherical,
  Vector2,
} from 'three';

// Mock BufferGeometryUtils
export const mergeGeometries = (
  geometries: BufferGeometry[],
): BufferGeometry => {
  // Simple mock implementation
  return geometries[0] || new BufferGeometry();
};

// Mock ConvexGeometry
export class ConvexGeometry extends BufferGeometry {
  constructor(points: any[]) {
    super();
    // Mock implementation
  }
}

// Mock TextGeometry
export class TextGeometry extends BufferGeometry {
  constructor(text: string, parameters?: any) {
    super();
    // Mock implementation
  }
}

// Mock EffectComposer
export class EffectComposer {
  renderer: WebGLRenderer;
  passes: any[] = [];

  constructor(renderer: WebGLRenderer, renderTarget?: WebGLRenderTarget) {
    this.renderer = renderer;
  }

  addPass(pass: any): void {
    this.passes.push(pass);
  }

  removePass(pass: any): void {
    const index = this.passes.indexOf(pass);
    if (index !== -1) {
      this.passes.splice(index, 1);
    }
  }

  render(deltaTime?: number): void {}
  setSize(width: number, height: number): void {}
}

// Mock Pass base class
export class Pass {
  enabled: boolean = true;
  needsSwap: boolean = true;
  clear: boolean = false;
  renderToScreen: boolean = false;

  setSize(width: number, height: number): void {}
  render(
    renderer: WebGLRenderer,
    writeBuffer: any,
    readBuffer: any,
    deltaTime?: number,
    maskActive?: boolean,
  ): void {}
}

// Mock RenderPass
export class RenderPass extends Pass {
  scene: Scene;
  camera: Camera;

  constructor(scene: Scene, camera: Camera) {
    super();
    this.scene = scene;
    this.camera = camera;
  }

  render(
    renderer: WebGLRenderer,
    writeBuffer: any,
    readBuffer: any,
    deltaTime: number,
    maskActive: boolean,
  ): void {}
  setSize(width: number, height: number): void {}
}

// Mock OutlinePass
export class OutlinePass {
  resolution: any;
  scene: Scene;
  camera: Camera;
  renderCamera: Camera;
  selectedObjects: Object3D[] = [];
  edgeStrength: number = 3;
  edgeGlow: number = 0;
  edgeThickness: number = 1;
  pulsePeriod: number = 0;
  visibleEdgeColor: {
    _value: number;
    set: (color: number) => void;
    getHex: () => number;
  } = {
    _value: 0xffffff,
    set(color: number) {
      this._value = color;
    },
    getHex() {
      return this._value;
    },
  };
  hiddenEdgeColor: {
    _value: number;
    set: (color: number) => void;
    getHex: () => number;
  } = {
    _value: 0x000000,
    set(color: number) {
      this._value = color;
    },
    getHex() {
      return this._value;
    },
  };
  enabled: boolean = true;
  overlayMaterial: any = { blending: 0 };

  constructor(
    resolution: any,
    scene: Scene,
    camera: Camera,
    selectedObjects?: Object3D[],
  ) {
    this.resolution = resolution;
    this.scene = scene;
    this.camera = camera;
    this.renderCamera = camera;
    if (selectedObjects) {
      this.selectedObjects = selectedObjects;
    }
  }

  render(
    renderer: WebGLRenderer,
    writeBuffer: any,
    readBuffer: any,
    deltaTime: number,
    maskActive: boolean,
  ): void {}
  setSize(width: number, height: number): void {}
}

// Mock ShaderPass
export class ShaderPass {
  constructor(shader: any, textureID?: string) {
    // Mock implementation
  }
}

// Mock FXAAShader
export const FXAAShader = {
  uniforms: {},
  vertexShader: '',
  fragmentShader: '',
};

// Mock OrbitControls
export class OrbitControls extends EventDispatcher {
  object: Camera;
  domElement: HTMLElement | undefined;
  enabled: boolean = true;
  target: Vector3 = new Vector3();

  // Zoom properties
  minDistance: number = 0;
  maxDistance: number = Infinity;
  minZoom: number = 0;
  maxZoom: number = Infinity;

  // Polar angle limits
  minPolarAngle: number = 0;
  maxPolarAngle: number = Math.PI;

  // Azimuthal angle limits
  minAzimuthAngle: number = -Infinity;
  maxAzimuthAngle: number = Infinity;

  // Damping
  enableDamping: boolean = false;
  dampingFactor: number = 0.05;

  // Auto rotation
  autoRotate: boolean = false;
  autoRotateSpeed: number = 2.0;

  // Interaction properties
  enableZoom: boolean = true;
  zoomSpeed: number = 1.0;
  enableRotate: boolean = true;
  rotateSpeed: number = 1.0;
  enablePan: boolean = true;
  panSpeed: number = 1.0;
  screenSpacePanning: boolean = true;
  keyPanSpeed: number = 7.0;

  // Mouse buttons
  mouseButtons: { LEFT?: MOUSE; MIDDLE?: MOUSE; RIGHT?: MOUSE } = {
    LEFT: MOUSE.ROTATE,
    MIDDLE: MOUSE.DOLLY,
    RIGHT: MOUSE.PAN,
  };

  // Touch actions
  touches: { ONE?: TOUCH; TWO?: TOUCH } = {
    ONE: TOUCH.ROTATE,
    TWO: TOUCH.DOLLY_PAN,
  };

  constructor(object: Camera, domElement?: HTMLElement) {
    super();
    this.object = object;
    this.domElement = domElement;
  }

  update(): boolean {
    return false;
  }

  saveState(): void {}

  reset(): void {}

  dispose(): void {}

  getPolarAngle(): number {
    return 0;
  }

  getAzimuthalAngle(): number {
    return 0;
  }

  getDistance(): number {
    return 0;
  }

  listenToKeyEvents(domElement: HTMLElement): void {}

  stopListenToKeyEvents(): void {}
}

// Mock Font class
export class Font {
  data: any;

  constructor(data: any) {
    this.data = data;
  }

  generateShapes(text: string, size: number): any[] {
    return [];
  }
}

// Mock FontLoader
export class FontLoader {
  constructor() {}

  load(
    url: string,
    onLoad?: (font: Font) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void,
  ): void {
    // Mock implementation - call onLoad with a mock font
    if (onLoad) {
      const mockFont = new Font({});
      setTimeout(() => onLoad(mockFont), 0);
    }
  }

  parse(json: any): Font {
    return new Font(json);
  }
}

// Mock OBJExporter
export class OBJExporter {
  parse(object: Object3D): string {
    return '# Mock OBJ export\n';
  }
}

// Mock GLTFExporter
export class GLTFExporter {
  parse(
    input: Object3D | Object3D[],
    onCompleted: (result: any) => void,
    onError?: (error: any) => void,
    options?: any,
  ): void {
    // Mock implementation
    setTimeout(() => onCompleted({ scenes: [], scene: 0 }), 0);
  }

  parseAsync(input: Object3D | Object3D[], options?: any): Promise<any> {
    return Promise.resolve({ scenes: [], scene: 0 });
  }
}

// Mock OBJLoader
export class OBJLoader {
  load(
    url: string,
    onLoad?: (object: Object3D) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void,
  ): void {
    if (onLoad) {
      setTimeout(() => onLoad(new Object3D()), 0);
    }
  }

  parse(text: string): Object3D {
    return new Object3D();
  }
}

// Mock GLTFLoader
export class GLTFLoader {
  setDRACOLoader(dracoLoader: DRACOLoader): this {
    return this;
  }

  load(
    url: string,
    onLoad?: (gltf: any) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void,
  ): void {
    if (onLoad) {
      setTimeout(
        () => onLoad({ scene: new Object3D(), scenes: [], animations: [] }),
        0,
      );
    }
  }

  parse(
    data: ArrayBuffer | string,
    path: string,
    onLoad: (gltf: any) => void,
    onError?: (event: ErrorEvent) => void,
  ): void {
    setTimeout(
      () => onLoad({ scene: new Object3D(), scenes: [], animations: [] }),
      0,
    );
  }
}

// Mock DRACOLoader
export class DRACOLoader {
  setDecoderPath(path: string): this {
    return this;
  }

  setDecoderConfig(config: any): this {
    return this;
  }

  preload(): this {
    return this;
  }

  dispose(): void {}
}

// Mock XRControllerModelFactory
export class XRControllerModelFactory {
  constructor() {}

  createControllerModel(controller: any): Object3D {
    return new Object3D();
  }
}

// Mock Stats (default export)
export default class Stats {
  dom: HTMLDivElement;

  constructor() {
    this.dom = document.createElement('div');
  }

  begin(): void {}
  end(): void {}
  update(): void {}

  setMode(mode: number): void {}

  showPanel(panel: number): void {}
}
