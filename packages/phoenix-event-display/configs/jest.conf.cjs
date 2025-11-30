const path = require('path');

module.exports = {
  rootDir: path.resolve(__dirname, '..'),
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  setupFiles: [path.resolve(__dirname, '../../../jest.setup.ts')],

  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs)$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true,
          esModuleInterop: true,
        },
      },
    ],
  },

  transformIgnorePatterns: [
    'node_modules/(?!(three/examples|@angular|jsroot)/)',
  ],

  moduleNameMapper: {
    '^jsroot$': '<rootDir>/../../node_modules/jsroot/build/jsroot.js',
    '^jsroot/(.*)$': '<rootDir>/../../node_modules/jsroot/build/jsroot.js',
    '^three/examples/jsm/utils/BufferGeometryUtils\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/geometries/ConvexGeometry\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/geometries/TextGeometry\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/postprocessing/EffectComposer\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/postprocessing/RenderPass\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/postprocessing/OutlinePass\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/postprocessing/ShaderPass\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/shaders/FXAAShader\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/controls/OrbitControls\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/loaders/FontLoader\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/postprocessing/Pass\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/exporters/OBJExporter\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/exporters/GLTFExporter\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/loaders/OBJLoader\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/loaders/GLTFLoader\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/loaders/DRACOLoader\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/webxr/XRControllerModelFactory\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
    '^three/examples/jsm/libs/stats\\.module\\.js$':
      '<rootDir>/src/tests/__mocks__/three-examples.mock.ts',
  },
};
