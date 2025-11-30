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

/** Mock BufferGeometryUtils*/
export const mergeGeometries = (
  geometries: BufferGeometry[],
): BufferGeometry => {
  // Simple mock implementation
  return geometries[0] || new BufferGeometry();
};

/** Mock ConvexGeometry */
export class ConvexGeometry extends BufferGeometry {
  /** Mock ConvexGeometry constructor */
  constructor(points: any[]) {
    super();
    // Mock implementation
  }
}

/** Mock TextGeometry */
export class TextGeometry extends BufferGeometry {
  /** Mock TextGeometry constructor */
  constructor(text: string, parameters?: any) {
    super();
    // Mock implementation
  }
}

/** Mock EffectComposer */
export class EffectComposer {
  /** The WebGL renderer used by the composer. */
  renderer: WebGLRenderer;
  /** The list of passes added to the composer. */
  passes: any[] = [];
  /** Mock EffectComposer constructor */
  constructor(renderer: WebGLRenderer, renderTarget?: WebGLRenderTarget) {
    this.renderer = renderer;
  }
  /** Adds a pass to the composer. */
  addPass(pass: any): void {
    this.passes.push(pass);
  }

  /** Removes a pass from the composer. */
  removePass(pass: any): void {
    const index = this.passes.indexOf(pass);
    if (index !== -1) {
      this.passes.splice(index, 1);
    }
  }
  /** Renders the effect composer. */
  render(deltaTime?: number): void {}
  /** Sets the size of the composer. */
  setSize(width: number, height: number): void {}
}

/** Mock Pass base class */
export class Pass {
  /** Whether the pass is enabled. */
  enabled: boolean = true;
  /** Whether the pass needs to swap buffers. */
  needsSwap: boolean = true;
  /** Whether the pass clears the buffer before rendering. */
  clear: boolean = false;
  /** Whether to render the pass to the screen. */
  renderToScreen: boolean = false;
  /** Sets the size of the pass. */
  setSize(width: number, height: number): void {}
  /** Renders the pass. */
  render(
    renderer: WebGLRenderer,
    writeBuffer: any,
    readBuffer: any,
    deltaTime?: number,
    maskActive?: boolean,
  ): void {}
}

/** Mock RenderPass */
export class RenderPass extends Pass {
  /** The scene to be rendered. */
  scene: Scene;
  /** The camera through which the scene is viewed. */
  camera: Camera;
  /** Mock RenderPass constructor */
  constructor(scene: Scene, camera: Camera) {
    super();
    this.scene = scene;
    this.camera = camera;
  }

  /** Renders the scene using the specified camera. */
  render(
    renderer: WebGLRenderer,
    writeBuffer: any,
    readBuffer: any,
    deltaTime: number,
    maskActive: boolean,
  ): void {}
  /** Sets the size of the render pass. */
  setSize(width: number, height: number): void {}
}

/** Mock OutlinePass */
export class OutlinePass {
  /** The resolution of the outline effect. */
  resolution: any;
  /** The scene to which the outline effect is applied. */
  scene: Scene;
  /** The camera used for rendering the outline effect. */
  camera: Camera;
  /** The camera used specifically for rendering. */
  renderCamera: Camera;
  /** The objects selected for outlining. */
  selectedObjects: Object3D[] = [];
  /** The strength of the outline edge. */
  edgeStrength: number = 3;
  /** The glow intensity of the outline edge. */
  edgeGlow: number = 0;
  /** The thickness of the outline edge. */
  edgeThickness: number = 1;
  /** The period of the outline pulse effect. */
  pulsePeriod: number = 0;
  /** The color of visible edges in the outline effect. */
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
  /** The color of hidden edges in the outline effect. */
  hiddenEdgeColor: {
    _value: number;
    set: (color: number) => void;
    getHex: () => number;
  } = {
    _value: 0x000000,
    set(color: number) {
      this._value = color;
    },
    /** Returns the hexadecimal representation of the color. */
    getHex() {
      return this._value;
    },
  };
  /** Whether the outline effect is enabled. */
  enabled: boolean = true;
  /** The material used for the outline overlay. */
  overlayMaterial: any = { blending: 0 };
  /** Mock OutlinePass constructor */
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

  /** Renders the outline effect. */
  render(
    renderer: WebGLRenderer,
    writeBuffer: any,
    readBuffer: any,
    deltaTime: number,
    maskActive: boolean,
  ): void {}
  /** Sets the size of the outline pass. */
  setSize(width: number, height: number): void {}
}

/** Mock ShaderPass */
export class ShaderPass {
  /** Mock ShaderPass constructor */
  constructor(shader: any, textureID?: string) {
    // Mock implementation
  }
}

/** Mock FXAAShader */
export const FXAAShader = {
  uniforms: {},
  vertexShader: '',
  fragmentShader: '',
};

/** Mock OrbitControls */
export class OrbitControls extends EventDispatcher {
  /** The camera object controlled by these orbit controls. */
  object: Camera;
  /** The HTML element used for event listeners. */
  domElement: HTMLElement | undefined;
  /** Whether the controls are enabled. */
  enabled: boolean = true;
  /** The point in space that the camera orbits around. */
  target: Vector3 = new Vector3();

  // Zoom properties
  /** The minimum distance the camera can be from the target. */
  minDistance: number = 0;
  /** The maximum distance the camera can be from the target. */
  maxDistance: number = Infinity;
  /** The minimum zoom level of the camera. */
  minZoom: number = 0;
  /** The maximum zoom level of the camera. */
  maxZoom: number = Infinity;

  // Polar angle limits
  /** The minimum polar angle (vertical angle) the camera can orbit to. */
  minPolarAngle: number = 0;
  /** The maximum polar angle (vertical angle) the camera can orbit to. */
  maxPolarAngle: number = Math.PI;

  // Azimuthal angle limits
  /** The minimum azimuthal angle (horizontal angle) the camera can orbit to. */
  minAzimuthAngle: number = -Infinity;
  /** The maximum azimuthal angle (horizontal angle) the camera can orbit to. */
  maxAzimuthAngle: number = Infinity;

  // Damping
  /** Whether damping (inertia) is enabled. */
  enableDamping: boolean = false;
  /** The damping factor for the controls. */
  dampingFactor: number = 0.05;

  // Auto rotation
  /** Whether auto-rotation is enabled. */
  autoRotate: boolean = false;
  /** The speed of auto-rotation. */
  autoRotateSpeed: number = 2.0;

  // Interaction properties
  /** Whether zooming is enabled. */
  enableZoom: boolean = true;
  /** The speed of zooming. */
  zoomSpeed: number = 1.0;
  /** Whether rotating is enabled. */
  enableRotate: boolean = true;
  /** The speed of rotation. */
  rotateSpeed: number = 1.0;
  /** Whether panning is enabled. */
  enablePan: boolean = true;
  /** The speed of panning. */
  panSpeed: number = 1.0;
  /** Whether to use screen space panning. */
  screenSpacePanning: boolean = true;
  /** Whether to invert the panning direction. */
  keyPanSpeed: number = 7.0;

  // Mouse buttons
  /** Mapping of mouse buttons to actions. */
  mouseButtons: { LEFT?: MOUSE; MIDDLE?: MOUSE; RIGHT?: MOUSE } = {
    LEFT: MOUSE.ROTATE,
    MIDDLE: MOUSE.DOLLY,
    RIGHT: MOUSE.PAN,
  };

  // Touch actions
  /** Mapping of touch actions to controls. */
  touches: { ONE?: TOUCH; TWO?: TOUCH } = {
    ONE: TOUCH.ROTATE,
    TWO: TOUCH.DOLLY_PAN,
  };
  /** Mock OrbitControls constructor */
  constructor(object: Camera, domElement?: HTMLElement) {
    super();
    this.object = object;
    this.domElement = domElement;
  }

  /** Updates the controls. */
  update(): boolean {
    return false;
  }

  /** Saves the current state of the controls. */
  saveState(): void {}

  /** Resets the controls to their initial state. */
  reset(): void {}

  /** Disposes of the controls and removes event listeners. */
  dispose(): void {}

  /** Gets the current polar angle. */
  getPolarAngle(): number {
    return 0;
  }

  /** Gets the current azimuthal angle. */
  getAzimuthalAngle(): number {
    return 0;
  }

  /** Gets the current distance from the target. */
  getDistance(): number {
    return 0;
  }

  /** Starts listening to key events on the given DOM element. */
  listenToKeyEvents(domElement: HTMLElement): void {}

  /** Stops listening to key events. */
  stopListenToKeyEvents(): void {}
}

/** Mock Font class */
export class Font {
  /** The font data. */
  data: any;
  /** Mock Font constructor */
  constructor(data: any) {
    this.data = data;
  }
  /** Generates shapes for the given text and size. */
  generateShapes(text: string, size: number): any[] {
    return [];
  }
}

/** Mock FontLoader */
export class FontLoader {
  /** Mock FontLoader constructor */
  constructor() {}
  /** Loads a font from the specified URL. */
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
  /** Parses font data from JSON and returns a Font instance. */
  parse(json: any): Font {
    return new Font(json);
  }
}

/** Mock OBJExporter */
export class OBJExporter {
  /** Parses the input Object3D and returns a mock OBJ string. */
  parse(object: Object3D): string {
    return '# Mock OBJ export\n';
  }
}

/** Mock GLTFExporter */
export class GLTFExporter {
  /** Parses the input and invokes the callback with the result. */
  parse(
    input: Object3D | Object3D[],
    onCompleted: (result: any) => void,
    onError?: (error: any) => void,
    options?: any,
  ): void {
    // Mock implementation
    setTimeout(() => onCompleted({ scenes: [], scene: 0 }), 0);
  }
  /** Parses the input and returns a Promise that resolves with the result. */
  parseAsync(input: Object3D | Object3D[], options?: any): Promise<any> {
    return Promise.resolve({ scenes: [], scene: 0 });
  }
}

/** Mock OBJLoader */
export class OBJLoader {
  /** Loads an OBJ model from the specified URL. */
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
  /** Parses OBJ data from a string and returns an Object3D. */
  parse(text: string): Object3D {
    return new Object3D();
  }
}

/** Mock GLTFLoader */
export class GLTFLoader {
  /** Sets the DRACOLoader instance. */
  setDRACOLoader(dracoLoader: DRACOLoader): this {
    return this;
  }
  /** Loads a GLTF model from the specified URL. */
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

  /** Parses GLTF data from an ArrayBuffer or string. */
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

/** Mock DRACOLoader */
export class DRACOLoader {
  /** Sets the path to the Draco decoder files. */
  setDecoderPath(path: string): this {
    return this;
  }
  /** Sets the configuration for the Draco decoder. */
  setDecoderConfig(config: any): this {
    return this;
  }
  /** Preloads the Draco decoder. */
  preload(): this {
    return this;
  }
  /** Disposes of the Draco loader and releases resources. */
  dispose(): void {}
}

/** Mock XRControllerModelFactory */
export class XRControllerModelFactory {
  /** Mock XRControllerModelFactory constructor */
  constructor() {}
  /** Creates a mock controller model. */
  createControllerModel(controller: any): Object3D {
    return new Object3D();
  }
}

/** Mock Stats (default export) */
export default class Stats {
  /** The DOM element containing the stats display. */
  dom: HTMLDivElement;

  /** Mock Stats constructor */
  constructor() {
    this.dom = document.createElement('div');
  }

  /** Begins the stats monitoring. */
  begin(): void {}
  /** Ends the stats monitoring. */
  end(): void {}
  /** Updates the stats display. */
  update(): void {}

  /** Changes the current stats mode. */
  setMode(mode: number): void {}
  /** Displays the specified stats panel. */
  showPanel(panel: number): void {}
}
